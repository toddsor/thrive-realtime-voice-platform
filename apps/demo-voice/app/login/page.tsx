"use client";

import { useState, useEffect, Suspense } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authProvider } from "@/lib/auth/authProvider";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { EmailLoginForm } from "@/components/auth/email-login-form";

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<typeof authProvider | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/demo";

  useEffect(() => {
    setAuth(authProvider);
  }, []);

  const handleEmailLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Authentication service not available");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Failed to sign in");
        return;
      }

      if (data.user) {
        router.push(redirectTo);
      }
    } catch (err) {
      console.error("Email login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Authentication service not available");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/demo`,
        },
      });

      if (error) {
        setError("Failed to sign in with Google");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Authentication service not available");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin",
        options: {
          redirectTo: `${window.location.origin}/demo`,
        },
      });

      if (error) {
        setError("Failed to sign in with LinkedIn");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("LinkedIn sign in error:", err);
      setError("Failed to sign in with LinkedIn");
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Authentication service not available");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/demo`,
        },
      });

      if (error) {
        setError("Failed to sign in with Facebook");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Facebook sign in error:", err);
      setError("Failed to sign in with Facebook");
      setIsLoading(false);
    }
  };

  if (!auth) {
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">Access your voice assistant</p>
        </div>

        <div className="space-y-6">
          <OAuthButtons
            onGoogleSignIn={handleGoogleSignIn}
            onLinkedInSignIn={handleLinkedInSignIn}
            onFacebookSignIn={handleFacebookSignIn}
            isLoading={isLoading}
            disabled={isLoading}
          />

          <EmailLoginForm onSubmit={handleEmailLogin} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
