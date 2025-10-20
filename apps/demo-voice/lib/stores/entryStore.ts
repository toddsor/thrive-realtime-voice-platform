type IdentityKey = { level: "anonymous" | "pseudonymous" | "authenticated"; id: string };

export interface EntryRecord {
  id: string;
  text: string;
  createdAt: number;
}

interface PseudonymProfile {
  id: string;
  nickname: string;
  createdAt: number;
}

class InMemoryEntryStore {
  private entriesByIdentity = new Map<string, EntryRecord[]>();
  private pseudonymProfiles = new Map<string, PseudonymProfile>();
  private anonToPseudonym = new Map<string, string>();
  private pseudonymToUser = new Map<string, string>();

  private key(k: IdentityKey): string {
    return `${k.level}:${k.id}`;
  }

  listEntries(k: IdentityKey): EntryRecord[] {
    return this.entriesByIdentity.get(this.key(k)) ?? [];
  }

  addEntry(k: IdentityKey, text: string): EntryRecord {
    const list = this.entriesByIdentity.get(this.key(k)) ?? [];
    const rec: EntryRecord = { id: crypto.randomUUID(), text, createdAt: Date.now() };
    list.unshift(rec);
    this.entriesByIdentity.set(this.key(k), list);
    return rec;
  }

  createPseudonym(nickname: string): PseudonymProfile {
    const id = crypto.randomUUID();
    const profile = { id, nickname, createdAt: Date.now() };
    this.pseudonymProfiles.set(id, profile);
    return profile;
  }

  linkAnonToPseudonym(anonymousId: string, pseudonymousId: string): void {
    this.anonToPseudonym.set(anonymousId, pseudonymousId);
  }

  linkPseudonymToUser(pseudonymousId: string, userId: string): void {
    this.pseudonymToUser.set(pseudonymousId, userId);
  }

  getPseudonymForAnon(anonymousId: string): string | undefined {
    return this.anonToPseudonym.get(anonymousId);
  }
}

export const entryStore = new InMemoryEntryStore();
