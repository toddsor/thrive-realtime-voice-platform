import { useState, useEffect, useCallback } from "react";
import { identityStore, IdentityState } from "../stores/identityStore";
import { IdentityLevel } from "@thrivereflections/realtime-contracts";

export function useIdentity() {
  const [state, setState] = useState<IdentityState>(identityStore.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = identityStore.subscribe(setState);
    return unsubscribe;
  }, []);

  const upgradeToAnonymous = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await identityStore.upgradeToAnonymous();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upgrade to anonymous");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upgradeToPseudonymous = useCallback(async (pseudonym: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await identityStore.upgradeToPseudonymous(pseudonym);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upgrade to pseudonymous");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkToUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await identityStore.linkToUser(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link to user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setConsent = useCallback((consent: "ACCEPTED" | "DECLINED" | "UNKNOWN") => {
    identityStore.setConsent(consent);
  }, []);

  const reset = useCallback(() => {
    identityStore.reset();
  }, []);

  const canUpgrade = useCallback(
    (targetLevel: IdentityLevel): boolean => {
      const levelOrder: IdentityLevel[] = ["ephemeral", "local", "anonymous", "pseudonymous", "authenticated"];
      const currentIndex = levelOrder.indexOf(state.level);
      const targetIndex = levelOrder.indexOf(targetLevel);
      return targetIndex > currentIndex;
    },
    [state.level]
  );

  const getUpgradeOptions = useCallback(() => {
    const options = [];

    if (canUpgrade("anonymous")) {
      options.push({
        level: "anonymous" as const,
        title: "Anonymous Session",
        description:
          "Store your conversation on our servers with a temporary ID. Data is automatically deleted after 14 days.",
        benefits: ["Persistent conversation", "Server-side storage", "Automatic cleanup"],
        requirements: ["Accept data storage"],
      });
    }

    if (canUpgrade("pseudonymous")) {
      options.push({
        level: "pseudonymous" as const,
        title: "Pseudonymous Profile",
        description: "Create a persistent profile with a chosen nickname. Your data is stored for 90 days.",
        benefits: ["Persistent profile", "Longer retention", "Personalized experience"],
        requirements: ["Choose a nickname", "Accept extended storage"],
      });
    }

    if (canUpgrade("authenticated")) {
      options.push({
        level: "authenticated" as const,
        title: "Authenticated User",
        description: "Sign in with your account for full features and permanent data storage.",
        benefits: ["Full features", "Permanent storage", "Account management"],
        requirements: ["Sign in with account"],
      });
    }

    return options;
  }, [canUpgrade]);

  return {
    ...state,
    isLoading,
    error,
    upgradeToAnonymous,
    upgradeToPseudonymous,
    linkToUser,
    setConsent,
    reset,
    canUpgrade,
    getUpgradeOptions,
  };
}
