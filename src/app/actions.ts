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
export async function login(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
export async function register(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
    if (!data.session)
      return {
        success: "Check your email to confirm your account, then sign in.",
      };
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
export async function resetPassword(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const email = z.email().parse(form.get("email"));
    const db = await supabase();
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: site() + "/auth/callback?next=/reset-password",
    });
    check(error);
    return {
      success:
        "If this email has an account, a reset link will arrive shortly.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function updatePassword(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
export async function saveProfile(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
        blood_group: z.enum([
          "",
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
        ]),
      })
      .parse(Object.fromEntries(form));
    const file = form.get("avatar");
    if (file instanceof File && file.size)
      newPath = await upload(file, "avatars", user.id);
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
    if (newPath) await removeFile("avatars", newPath).catch(() => {});
    return failure(e);
  }
  if (newPath && user.avatar_path)
    await removeFile("avatars", user.avatar_path).catch(() => {});
  revalidatePath("/patient/profile");
  return { success: "Profile saved." };
}
export async function changeEmail(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
export async function saveEntity(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
    if (file instanceof File && file.size)
      image = await upload(file, "directory-images", user.id);
    const row = { ...input, ...(image ? { image_path: image } : {}) };
    const result = id
      ? await db.from(key).update(row).eq("id", id).select("id").single()
      : await db.from(key).insert(row).select("id").single();
    check(result.error);
  } catch (e) {
    if (image) await removeFile("directory-images", image).catch(() => {});
    return failure(e);
  }
  if (image && oldImage)
    await removeFile("directory-images", oldImage).catch(() => {});
  revalidatePath("/admin/" + key);
  revalidatePath("/" + key);
  return { success: "Saved successfully." };
}
export async function deleteEntity(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
    if (data?.image_path)
      await removeFile("directory-images", data.image_path).catch(() => {});
    revalidatePath("/admin/" + key);
    return { success: "Deleted." };
  } catch (e) {
    return failure(e);
  }
}
export async function uploadRecord(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
    if (path) await removeFile("health-records", path).catch(() => {});
    return failure(e);
  }
  revalidatePath("/patient/prescriptions");
  revalidatePath("/patient/reports");
  return { success: "File uploaded." };
}
export async function deleteRecord(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
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
    // Storage first: a failed Storage delete keeps the record available for retry.
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
export async function manageUser(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const admin = await requireUser("admin");
  try {
    const id = z.uuid().parse(form.get("id"));
    const operation = z.enum(["update", "delete"]).parse(form.get("operation"));
    if (id === admin.id)
      throw new Error(
        "Use My profile to update yourself. Administrators cannot change their own role or delete themselves here.",
      );
    const db = adminClient();
    if (operation === "delete") {
      const { data: shared, error: sharedError } = await db.storage
        .from("directory-images")
        .list(id, { limit: 1 });
      check(sharedError);
      if (shared?.length)
        throw new Error(
          "This account owns directory images. Set it to Inactive, or transfer its shared images before deleting it.",
        );
      // Remove owned objects before deleting the Auth account; Supabase blocks deletion of users owning Storage objects.
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
