"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { entities, entitySchema } from "@/lib/entities";
import { upload, removeFile } from "@/lib/storage";
import type { ActionState } from "@/lib/form-state";
import { healthcareLocations } from "@/lib/locations";

function failure(e: unknown): ActionState {
  return {
    error:
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : e instanceof Error
          ? e.message
          : "The request could not be completed.",
  };
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function locationMatches(location: unknown, area: string) {
  const clean = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const doctorLocation = clean(location);
  const selectedArea = clean(area);
  return Boolean(doctorLocation && selectedArea && (doctorLocation.includes(selectedArea) || selectedArea.includes(doctorLocation)));
}

const credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

function site() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = credentials.parse(Object.fromEntries(form));
    const db = await supabase();
    const { error } = await db.auth.signInWithPassword(input);
    check(error);

    const {
      data: { user },
    } = await db.auth.getUser();

    const { data: profile, error: pe } = await db
      .from("profiles")
      .select("status")
      .eq("id", user!.id)
      .single();

    check(pe);

    if (profile?.status !== "Active") {
      await db.auth.signOut();
      return { error: "Your account is inactive. Contact the administrator." };
    }
  } catch (e) {
    return failure(e);
  }

  redirect("/dashboard");
}

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = credentials
      .extend({
        full_name: z.string().trim().min(1).max(300),
        phone: z.string().max(100),
        address: z.string().max(4000),
      })
      .parse(Object.fromEntries(form));

    const db = await supabase();

    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: site() + "/auth/callback",
        data: {
          full_name: input.full_name,
          phone: input.phone,
          address: input.address,
        },
      },
    });

    check(error);

    if (!data.session) {
      return {
        success: "Check your email to confirm your account, then sign in.",
      };
    }
  } catch (e) {
    return failure(e);
  }

  redirect("/dashboard");
}

export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/login");
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const email = z.email().parse(form.get("email"));
    const db = await supabase();
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: site() + "/auth/callback?next=/reset-password",
    });

    check(error);

    return {
      success: "If this email has an account, a reset link will arrive shortly.",
    };
  } catch (e) {
    return failure(e);
  }
}

export async function updatePassword(_: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();

  try {
    const password = z.string().min(8).max(128).parse(form.get("password"));
    const db = await supabase();
    const { error } = await db.auth.updateUser({ password });
    check(error);
    return { success: "Password updated." };
  } catch (e) {
    return failure(e);
  }
}

export async function saveProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  let newPath: string | undefined;

  try {
    const input = z
      .object({
        full_name: z.string().trim().min(1).max(300),
        phone: z.string().max(100),
        address: z.string().max(4000),
        date_of_birth: z.union([z.iso.date(), z.literal("")]),
        gender: z.enum(["", "Female", "Male", "Other"]),
        blood_group: z.enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
      })
      .parse(Object.fromEntries(form));

    const file = form.get("avatar");

    if (file instanceof File && file.size) {
      newPath = await upload(file, "avatars", user.id);
    }

    const db = await supabase();

    const { error } = await db
      .from("profiles")
      .update({
        ...input,
        date_of_birth: input.date_of_birth || null,
        ...(newPath ? { avatar_path: newPath } : {}),
      })
      .eq("id", user.id);

    check(error);
  } catch (e) {
    if (newPath) {
      await removeFile("avatars", newPath).catch(() => {});
    }
    return failure(e);
  }

  if (newPath && user.avatar_path) {
    await removeFile("avatars", user.avatar_path).catch(() => {});
  }

  revalidatePath("/patient/profile");
  return { success: "Profile saved." };
}

export async function changeEmail(_: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();

  try {
    const email = z.email().parse(form.get("email"));
    const db = await supabase();

    const { error } = await db.auth.updateUser(
      { email },
      { emailRedirectTo: site() + "/auth/callback" },
    );

    check(error);
    return { success: "Check your email to confirm the email change." };
  } catch (e) {
    return failure(e);
  }
}

export async function saveEntity(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("admin");
  const key = String(form.get("entity"));
  const entity = entities[key];

  if (!entity) return { error: "Unknown resource." };

  let image: string | undefined;
  let oldImage: string | undefined;

  try {
    const values = Object.fromEntries(
      entity.fields.map((f) => [f.key, form.get(f.key) ?? ""]),
    );

    const input = entitySchema(entity).parse(values);
    const id = form.get("id") ? z.uuid().parse(form.get("id")) : null;
    const db = await supabase();

    if (id) {
      const { data, error } = await db
        .from(key)
        .select("*")
        .eq("id", id)
        .single();

      check(error);
      oldImage = data?.image_path;
    }

    const file = form.get("image");

    if (file instanceof File && file.size) {
      image = await upload(file, "directory-images", user.id);
    }

    const doctorContact = key === "doctors"
      ? { phone: input.phone || null, email: input.email || null }
      : null;
    const publicInput = key === "doctors"
      ? Object.fromEntries(Object.entries(input).filter(([field]) => !["phone", "email"].includes(field)))
      : input;
    const row = { ...publicInput, ...(image ? { image_path: image } : {}) };

    const result = id
      ? await db.from(key).update(row).eq("id", id).select("id").single()
      : await db.from(key).insert(row).select("id").single();

    check(result.error);
    if (key === "doctors" && result.data?.id) {
      const { error: contactError } = await db
        .from("doctor_private_contacts")
        .upsert({ doctor_id: result.data.id, ...doctorContact }, { onConflict: "doctor_id" });
      check(contactError);
    }
  } catch (e) {
    if (image) {
      await removeFile("directory-images", image).catch(() => {});
    }
    return failure(e);
  }

  if (image && oldImage) {
    await removeFile("directory-images", oldImage).catch(() => {});
  }

  revalidatePath("/admin/" + key);
  revalidatePath("/" + key);
  return { success: "Saved successfully." };
}

export async function deleteEntity(_: ActionState, form: FormData): Promise<ActionState> {
  await requireUser("admin");

  try {
    const key = String(form.get("entity"));
    if (!entities[key]) throw new Error("Unknown resource.");

    const id = z.uuid().parse(form.get("id"));
    const db = await supabase();

    const { data, error } = await db
      .from(key)
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    check(error);

    if (data?.image_path) {
      await removeFile("directory-images", data.image_path).catch(() => {});
    }

    revalidatePath("/admin/" + key);
    return { success: "Deleted." };
  } catch (e) {
    return failure(e);
  }
}

export async function uploadRecord(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("patient");
  let path: string | undefined;

  try {
    const kind = z.enum(["prescription", "report"]).parse(form.get("kind"));
    const description = z.string().max(4000).parse(form.get("description"));
    const file = form.get("file");

    if (!(file instanceof File)) throw new Error("Select a file.");

    path = await upload(file, "health-records", user.id);

    const db = await supabase();
    const { error } = await db
      .from("health_records")
      .insert({
        user_id: user.id,
        kind,
        description,
        path,
        file_name: file.name.slice(0, 250),
      });

    check(error);
  } catch (e) {
    if (path) {
      await removeFile("health-records", path).catch(() => {});
    }
    return failure(e);
  }

  revalidatePath("/patient/prescriptions");
  revalidatePath("/patient/reports");
  return { success: "File uploaded." };
}

export async function deleteRecord(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("patient");

  try {
    const id = z.uuid().parse(form.get("id"));
    const db = await supabase();

    const { data, error } = await db
      .from("health_records")
      .select("path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    check(error);

    await removeFile("health-records", data!.path);

    const { error: de } = await db
      .from("health_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    check(de);

    revalidatePath("/patient/prescriptions");
    revalidatePath("/patient/reports");
    return { success: "File deleted." };
  } catch (e) {
    return failure(e);
  }
}

export async function manageUser(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireUser("admin");

  try {
    const id = z.uuid().parse(form.get("id"));
    const operation = z.enum(["update", "delete"]).parse(form.get("operation"));

    if (id === admin.id) {
      throw new Error(
        "Use My profile to update yourself. Administrators cannot change their own role or delete themselves here.",
      );
    }

    const db = adminClient();

    if (operation === "delete") {
      const { data: shared, error: sharedError } = await db.storage
        .from("directory-images")
        .list(id, { limit: 1 });

      check(sharedError);

      if (shared?.length) {
        throw new Error(
          "This account owns directory images. Set it to Inactive, or transfer its shared images before deleting it.",
        );
      }

      for (const bucket of ["health-records", "avatars"]) {
        for (;;) {
          const { data, error } = await db.storage
            .from(bucket)
            .list(id, { limit: 100 });

          check(error);

          if (!data?.length) break;

          const { error: de } = await db.storage
            .from(bucket)
            .remove(data.map((f) => `${id}/${f.name}`));

          check(de);
        }
      }

      const { error } = await db.auth.admin.deleteUser(id);
      check(error);
    } else {
      const input = z
        .object({
          full_name: z.string().trim().min(1).max(300),
          email: z.email(),
          phone: z.string().max(100),
          address: z.string().max(4000),
          role: z.enum(["patient", "doctor", "admin"]),
          status: z.enum(["Active", "Inactive"]),
          password: z.union([z.string().min(8).max(128), z.literal("")]),
        })
        .parse(
          Object.fromEntries(
            [
              "full_name",
              "email",
              "phone",
              "address",
              "role",
              "status",
              "password",
            ].map((k) => [k, form.get(k) ?? ""]),
          ),
        );

      const { error } = await db.auth.admin.updateUserById(id, {
        email: input.email,
        ...(input.password ? { password: input.password } : {}),
        ban_duration: input.status === "Inactive" ? "876000h" : "none",
      });

      check(error);

      const { error: pe } = await db
        .from("profiles")
        .update({
          full_name: input.full_name,
          phone: input.phone,
          address: input.address,
          role: input.role,
          status: input.status,
        })
        .eq("id", id);

      check(pe);
    }

    revalidatePath("/admin/users");

    return {
      success: operation === "delete" ? "Account deleted." : "Account saved.",
    };
  } catch (e) {
    return failure(e);
  }
}

export async function requestAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("patient");
  try {
    const input = z.object({
      doctor_id: z.union([z.uuid(), z.literal("")]),
      specialty_id: z.union([z.uuid(), z.literal("")]),
      preferred_date: z.iso.date(),
      time_period: z.enum(["morning", "afternoon", "evening", "anytime"]),
      budget: z.enum(["800", "1500", "2500", "flexible"]),
      area: z.enum(healthcareLocations),
      concern_summary: z.string().trim().max(1200),
    }).parse(Object.fromEntries(form));
    const periods = { morning: ["09:00", "12:00"], afternoon: ["12:00", "16:00"], evening: ["16:00", "20:00"], anytime: ["09:00", "20:00"] } as const;
    const [preferredStart, preferredEnd] = periods[input.time_period];
    const budgetMax = input.budget === "flexible" ? 100000 : Number(input.budget);
    const db = await supabase();
    let doctorId: string | null = null;
    if (input.doctor_id) {
      const { data: viewedDoctor, error: doctorError } = await db.from("doctors").select("id,location,specialty_id").eq("id", input.doctor_id).eq("status", "Active").maybeSingle();
      check(doctorError);
      if (viewedDoctor && locationMatches(viewedDoctor.location, input.area)) doctorId = viewedDoctor.id;
    }
    if (!doctorId && input.specialty_id) {
      const { data: localDoctors, error: localError } = await db.from("doctors").select("id,location").eq("status", "Active").eq("specialty_id", input.specialty_id).order("experience", { ascending: false }).limit(100);
      check(localError);
      doctorId = localDoctors?.find((doctor) => locationMatches(doctor.location, input.area))?.id || null;
    }
    const { data: request, error } = await db.from("appointment_requests").insert({
      patient_id: user.id,
      specialty_id: input.specialty_id || null,
      requested_doctor_id: doctorId,
      preferred_date: input.preferred_date,
      preferred_time_start: preferredStart,
      preferred_time_end: preferredEnd,
      alternate_date: null,
      alternate_time_start: null,
      alternate_time_end: null,
      budget_min: 0,
      budget_max: budgetMax,
      area: input.area,
      concern_summary: input.concern_summary || null,
    }).select("id").single();
    check(error);
    const ranked = doctorId ? [doctorId] : [];
    if (ranked.length) {
      const { error: candidateError } = await db.from("appointment_request_candidates").insert(
        ranked.map((id, index) => ({ request_id: request!.id, doctor_id: id, preference_rank: index + 1 })),
      );
      check(candidateError);
    }
    const { error: eventError } = await db.from("appointment_request_events").insert({ request_id: request!.id, actor_id: user.id, to_status: "Requested", note: "Appointment requested by patient." });
    check(eventError);
    revalidatePath("/patient/appointments");
    return { success: "Appointment request sent. An administrator will confirm the doctor, time and contact details." };
  } catch (e) { return failure(e); }
}

export async function reviewAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireUser("admin");
  try {
    const input = z.object({
      id: z.uuid(),
      status: z.enum(["Reviewing", "Confirmed", "Declined", "Completed"]),
      assigned_doctor_id: z.union([z.uuid(), z.literal("")]),
      confirmed_time: z.string().max(40),
      contact_info: z.string().trim().max(500),
      admin_note: z.string().trim().max(1200),
    }).parse(Object.fromEntries(form));
    if (input.status === "Confirmed" && (!input.assigned_doctor_id || !input.confirmed_time || !input.contact_info)) {
      throw new Error("A confirmed request needs a doctor, final date/time and contact information.");
    }
    const db = await supabase();
    const { data: current, error: readError } = await db.from("appointment_requests").select("status,area").eq("id", input.id).single();
    check(readError);
    if (input.assigned_doctor_id) {
      const { data: assignedDoctor, error: doctorError } = await db.from("doctors").select("location").eq("id", input.assigned_doctor_id).eq("status", "Active").single();
      check(doctorError);
      if (!locationMatches(assignedDoctor?.location, current!.area)) {
        throw new Error(`Select a doctor who serves ${current!.area}.`);
      }
    }
    const confirmed = input.status === "Confirmed";
    const { error } = await db.from("appointment_requests").update({
      status: input.status,
      assigned_doctor_id: input.assigned_doctor_id || null,
      confirmed_time: input.confirmed_time ? new Date(`${input.confirmed_time}:00+06:00`).toISOString() : null,
      contact_info: input.contact_info || null,
      admin_note: input.admin_note || null,
      confirmed_at: confirmed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", input.id);
    check(error);
    const { error: eventError } = await db.from("appointment_request_events").insert({ request_id: input.id, actor_id: admin.id, from_status: current!.status, to_status: input.status, note: input.admin_note || null });
    check(eventError);
    revalidatePath("/admin/appointments"); revalidatePath("/patient/appointments");
    return { success: "Appointment request updated." };
  } catch (e) { return failure(e); }
}
