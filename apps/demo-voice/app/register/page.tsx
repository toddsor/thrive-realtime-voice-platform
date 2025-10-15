"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SupabaseAuthProvider } from "@/lib/auth/authProvider";
import { EmailRegisterForm } from "@/components/auth/email-register-form";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<SupabaseAuthProvider | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const provider = new SupabaseAuthProvider();
    provider.setSupabaseClient(supabase);
    setAuthProvider(provider);
  }, []);

  const handleEmailRegister = async (email: string, password: string) => {
    if (!authProvider) return;

    setIsLoading(true);
    setError(null);

    try {
      const { user, error } = await authProvider.signUp(email, password);

      if (error) {
        setError(error.message || "Failed to create account");
        return;
      }

      if (user) {
        // Redirect to demo app after successful registration
        router.push("/demo");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Get started with your voice assistant</p>
        </div>

        <EmailRegisterForm onSubmit={handleEmailRegister} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
