"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const schoolName = formData.get("schoolName") as string;
  const grade = formData.get("grade") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, school_name: schoolName, grade },
    },
  });

  if (error) return { error: error.message };

  // Create profile row
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      school_name: schoolName,
      grade,
      merits: 500, // starter merits
    });
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
