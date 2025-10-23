/**
 * Built-in storage adapters shipped with the library
 */
export type BuiltInStorageType = 'local' | 'mongodb' | 'memory';

/**
 * Storage type - supports both built-in and custom adapters
 *
 * Built-in adapters provide IDE autocomplete, but custom
 * storage types are fully supported.
 */
export type StorageType = BuiltInStorageType | (string & {});

/**
 * Type guard to check if storage type is built-in
 */
export function isBuiltInStorageType(type: string): type is BuiltInStorageType {
    return ['local', 'mongodb', 'memory'].includes(type);
}
