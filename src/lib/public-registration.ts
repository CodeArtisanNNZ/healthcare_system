import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/server";

export type PatientRegistrationInput = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address: string;
};

export type PatientRegistrationResult =
  | { status: "signed_in" }
  | { status: "created" }
  | { status: "exists" };

async function signupKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for") || "";
  const ip =
    forwarded.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  return createHash("sha256")
    .update(`${ip.toLowerCase()}|${email.toLowerCase()}`)
    .digest("hex");
}

function isExistingUser(message: string) {
  return /already|registered|exists|duplicate/i.test(message);
}

export async function createPatientAccount(
  input: PatientRegistrationInput,
): Promise<PatientRegistrationResult> {
  const email = input.email.trim().toLowerCase();
  const admin = adminClient();

  const keyHash = await signupKey(email);
  const { data: allowed, error: quotaError } = await admin.rpc(
    "consume_signup_quota",
    {
      p_key_hash: keyHash,
      p_max_attempts: 8,
      p_window_minutes: 60,
    },
  );

  if (quotaError) {
    console.error("Signup quota check failed", quotaError.message);
    throw new Error("Registration is temporarily unavailable. Please try again.");
  }

  if (!allowed) {
    throw new Error(
      "Too many registration attempts. Please wait before trying again.",
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
    },
  });

  if (error) {
    if (isExistingUser(error.message)) {
      return { status: "exists" };
    }

    console.error("Patient account creation failed", error.message);
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("The account could not be created.");
  }

  const db = await supabase();
  const { error: signInError } = await db.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (signInError) {
    console.error(
      "Account created but automatic sign-in failed",
      signInError.message,
    );
    return { status: "created" };
  }

  return { status: "signed_in" };
}
