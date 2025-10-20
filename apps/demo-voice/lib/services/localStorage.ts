import { IdentityLevel } from "@thrivereflections/realtime-contracts";

export interface LocalEntry {
  id: string;
  text: string;
  timestamp: number;
  identityLevel: IdentityLevel;
}

export interface LocalStorageConfig {
  maxEntries: number;
  maxAgeMs: number;
  encryptionKey?: string;
}

export class LocalStorageService {
  private static instance: LocalStorageService;
  private config: LocalStorageConfig;
  private entries: LocalEntry[] = [];
  private listeners: Set<(entries: LocalEntry[]) => void> = new Set();

  private constructor(config: LocalStorageConfig = { maxEntries: 100, maxAgeMs: 0 }) {
    this.config = config;
    this.loadFromStorage();
  }

  static getInstance(config?: LocalStorageConfig): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService(config);
    }
    return LocalStorageService.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("thrive_local_entries");
      if (stored) {
        this.entries = JSON.parse(stored);
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.warn("Failed to load entries from local storage:", error);
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem("thrive_local_entries", JSON.stringify(this.entries));
    } catch (error) {
      console.warn("Failed to save entries to local storage:", error);
    }
  }

  private cleanupExpiredEntries(): void {
    if (this.config.maxAgeMs > 0) {
      const now = Date.now();
      this.entries = this.entries.filter((entry) => now - entry.timestamp < this.config.maxAgeMs);
    }
  }

  addEntry(text: string): LocalEntry {
    const entry: LocalEntry = {
      id: crypto.randomUUID(),
      text,
      timestamp: Date.now(),
      identityLevel: "local",
    };

    this.entries.unshift(entry);

    // Enforce max entries limit
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(0, this.config.maxEntries);
    }

    this.saveToStorage();
    this.notifyListeners();
    return entry;
  }

  getEntries(): LocalEntry[] {
    this.cleanupExpiredEntries();
    return [...this.entries];
  }

  getEntry(id: string): LocalEntry | undefined {
    return this.entries.find((entry) => entry.id === id);
  }

  deleteEntry(id: string): boolean {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.entries.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  clearEntries(): void {
    this.entries = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  exportEntries(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  importEntries(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        this.entries = imported;
        this.cleanupExpiredEntries();
        this.saveToStorage();
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.warn("Failed to import entries:", error);
    }
    return false;
  }

  getStats(): { totalEntries: number; oldestEntry?: number; newestEntry?: number } {
    if (this.entries.length === 0) {
      return { totalEntries: 0 };
    }

    const timestamps = this.entries.map((entry) => entry.timestamp);
    return {
      totalEntries: this.entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  }

  subscribe(listener: (entries: LocalEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.entries]));
  }

  // Encryption methods for sensitive data (basic implementation)
  private encrypt(text: string): string {
    if (!this.config.encryptionKey) return text;

    // Simple XOR encryption (not secure for production)
    const key = this.config.encryptionKey;
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private decrypt(encryptedText: string): string {
    if (!this.config.encryptionKey) return encryptedText;

    try {
      const text = atob(encryptedText);
      const key = this.config.encryptionKey;
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return encryptedText;
    }
  }
}

export const localStorageService = LocalStorageService.getInstance();
