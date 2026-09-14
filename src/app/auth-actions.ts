"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/form-state";

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

function isBangla(form: FormData) {
  return String(form.get("lang") || "") === "bn";
}

function failure(error: unknown, bn: boolean): ActionState {
  if (error instanceof z.ZodError) {
    return {
      error: bn
        ? "দেওয়া তথ্যগুলো আবার পরীক্ষা করুন।"
        : error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
    };
  }

  if (error instanceof Error) {
    return {
      error: bn
        ? "অনুরোধটি সম্পন্ন করা যায়নি। তথ্যগুলো পরীক্ষা করে আবার চেষ্টা করুন।"
        : error.message,
    };
  }

  return {
    error: bn
      ? "অনুরোধটি সম্পন্ন করা যায়নি।"
      : "The request could not be completed.",
  };
}

export async function localizedLogin(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const bn = isBangla(form);

  try {
    const input = credentials.parse({
      email: form.get("email"),
      password: form.get("password"),
    });

    const db = await supabase();
    const { error } = await db.auth.signInWithPassword(input);

    if (error) throw new Error(error.message);

    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      return {
        error: bn ? "লগ ইন করা যায়নি।" : "Could not sign in.",
      };
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error(profileError.message);

    if (profile?.status !== "Active") {
      await db.auth.signOut();

      return {
        error: bn
          ? "আপনার অ্যাকাউন্টটি সক্রিয় নয়। অ্যাডমিনের সাথে যোগাযোগ করুন।"
          : "Your account is inactive. Contact the administrator.",
      };
    }
  } catch (error) {
    return failure(error, bn);
  }

  redirect(bn ? "/dashboard?lang=bn" : "/dashboard");
}

export async function localizedRegister(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const bn = isBangla(form);

  try {
    const input = credentials
      .extend({
        full_name: z.string().trim().min(1).max(300),
        phone: z.string().max(100),
        address: z.string().max(4000),
      })
      .parse({
        email: form.get("email"),
        password: form.get("password"),
        full_name: form.get("full_name"),
        phone: form.get("phone") || "",
        address: form.get("address") || "",
      });

    const db = await supabase();

    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo:
          site() + `/auth/callback${bn ? "?lang=bn" : ""}`,
        data: {
          full_name: input.full_name,
          phone: input.phone,
          address: input.address,
        },
      },
    });

    if (error) throw new Error(error.message);

    if (!data.session) {
      return {
        success: bn
          ? "আপনার ইমেইল যাচাই করুন, তারপর লগ ইন করুন।"
          : "Check your email to confirm your account, then sign in.",
      };
    }
  } catch (error) {
    return failure(error, bn);
  }

  redirect(bn ? "/dashboard?lang=bn" : "/dashboard");
}
