import { StorageType } from '../Types/Storage';

export interface StorageAdapter {
    // Core operations
    save(key: string, value: unknown): Promise<void>;
    load(key: string): Promise<unknown | null>;
    remove(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;

    // Batch operations
    saveMany(entries: Record<string, unknown>): Promise<void>;
    loadMany(keys: string[]): Promise<Record<string, unknown>>;

    // Session management
    listSessions(): Promise<string[]>;
    deleteSession(): Promise<void>;

    // Metadata
    getType(): StorageType;
}
