import { ClientIdentity, IdentityLevel } from "@thrivereflections/realtime-contracts";

export interface IdentityState {
  level: IdentityLevel;
  anonymousId?: string;
  pseudonymousId?: string;
  userId?: string;
  consent?: "ACCEPTED" | "DECLINED" | "UNKNOWN";
}

export class IdentityStore {
  private static instance: IdentityStore;
  private state: IdentityState = { level: "ephemeral" };
  private listeners: Set<(state: IdentityState) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): IdentityStore {
    if (!IdentityStore.instance) {
      IdentityStore.instance = new IdentityStore();
    }
    return IdentityStore.instance;
  }

  private loadFromStorage(): void {
    try {
      // Check for anonymous ID in cookies (handled by server)
      const anonymousId = this.getCookie("anon_id");
      const pseudonymousId = this.getCookie("pseud_id");

      if (pseudonymousId) {
        this.state = {
          level: "pseudonymous",
          pseudonymousId,
          anonymousId,
        };
      } else if (anonymousId) {
        this.state = {
          level: "anonymous",
          anonymousId,
        };
      } else {
        // Check for local storage data
        const localData = localStorage.getItem("thrive_identity");
        if (localData) {
          const parsed = JSON.parse(localData);
          this.state = {
            level: "local",
            ...parsed,
          };
        }
      }
    } catch (error) {
      console.warn("Failed to load identity from storage:", error);
    }
  }

  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift();
    }
    return undefined;
  }

  getState(): IdentityState {
    return { ...this.state };
  }

  getIdentity(): ClientIdentity {
    return { ...this.state };
  }

  setLevel(level: IdentityLevel): void {
    this.state.level = level;
    this.notifyListeners();
  }

  setAnonymousId(anonymousId: string): void {
    this.state.anonymousId = anonymousId;
    this.state.level = "anonymous";
    this.notifyListeners();
  }

  setPseudonymousId(pseudonymousId: string): void {
    this.state.pseudonymousId = pseudonymousId;
    this.state.level = "pseudonymous";
    this.notifyListeners();
  }

  setUserId(userId: string): void {
    this.state.userId = userId;
    this.state.level = "authenticated";
    this.notifyListeners();
  }

  setConsent(consent: "ACCEPTED" | "DECLINED" | "UNKNOWN"): void {
    this.state.consent = consent;
    this.notifyListeners();
  }

  upgradeToAnonymous(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch("/api/session/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "anonymous" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.anonymousId) {
            this.setAnonymousId(data.anonymousId);
            resolve();
          } else {
            reject(new Error("Failed to create anonymous session"));
          }
        })
        .catch(reject);
    });
  }

  upgradeToPseudonymous(pseudonym: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch("/api/pseudonym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pseudonymId) {
            this.setPseudonymousId(data.pseudonymId);
            resolve();
          } else {
            reject(new Error("Failed to create pseudonymous identity"));
          }
        })
        .catch(reject);
    });
  }

  linkToUser(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch("/api/pseudonym/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            this.setUserId(userId);
            resolve();
          } else {
            reject(new Error("Failed to link pseudonym to user"));
          }
        })
        .catch(reject);
    });
  }

  saveToLocalStorage(): void {
    if (this.state.level === "local") {
      try {
        localStorage.setItem(
          "thrive_identity",
          JSON.stringify({
            anonymousId: this.state.anonymousId,
            pseudonymousId: this.state.pseudonymousId,
            consent: this.state.consent,
          })
        );
      } catch (error) {
        console.warn("Failed to save identity to local storage:", error);
      }
    }
  }

  subscribe(listener: (state: IdentityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  reset(): void {
    this.state = { level: "ephemeral" };
    localStorage.removeItem("thrive_identity");
    this.notifyListeners();
  }
}

export const identityStore = IdentityStore.getInstance();
