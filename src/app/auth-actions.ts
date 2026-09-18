"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { createPatientAccount } from "@/lib/public-registration";
import type { ActionState } from "@/lib/form-state";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

function isBangla(form: FormData) {
  return String(form.get("lang") || "") === "bn";
}

function humanError(message: string, bn: boolean) {
  const normalized = message.toLowerCase();

  if (normalized.includes("too many registration attempts")) {
    return bn
      ? "অল্প সময়ে অনেকবার অ্যাকাউন্ট তৈরির চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
      : "Too many registration attempts. Please wait and try again.";
  }

  if (
    normalized.includes("service_role") ||
    normalized.includes("account administration requires")
  ) {
    return bn
      ? "সার্ভারের account-creation configuration অসম্পূর্ণ। অ্যাডমিনকে জানান।"
      : "The server account-creation configuration is incomplete.";
  }

  return message;
}

function failure(error: unknown, bn: boolean): ActionState {
  if (error instanceof z.ZodError) {
    return {
      error: bn
        ? "ইমেইল, পাসওয়ার্ড ও প্রয়োজনীয় তথ্যগুলো ঠিকভাবে দিন। পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"
        : error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
    };
  }

  if (error instanceof Error) {
    return { error: humanError(error.message, bn) };
  }

  return {
    error: bn
      ? "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।"
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

    const result = await createPatientAccount(input);

    if (result.status === "exists") {
      return {
        error: bn
          ? "এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে। লগ ইন করুন অথবা পাসওয়ার্ড রিসেট করুন।"
          : "An account already exists for this email. Sign in or reset the password.",
      };
    }

    if (result.status === "created") {
      return {
        success: bn
          ? "অ্যাকাউন্ট তৈরি হয়েছে। এখন একই ইমেইল ও পাসওয়ার্ড দিয়ে লগ ইন করুন।"
          : "Account created. Sign in with the same email and password.",
      };
    }
  } catch (error) {
    return failure(error, bn);
  }

  redirect(bn ? "/dashboard?lang=bn" : "/dashboard");
}
