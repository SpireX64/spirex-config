import type { IConfigProvider } from "@spirex/config";

/**
 * A value that can be stored in an in-memory config provider.
 *
 * Supports scalars, nested plain objects, and `Object.entries`–style
 * arrays (for deeply nested configuration).
 */
export type TConfigValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | NestedConfigRecord
    | readonly TConfigValue[]
    | readonly [string, TConfigValue][];

/** A nested plain object that can be flattened into colon-separated keys. */
export interface NestedConfigRecord {
    [key: string]: TConfigValue;
}

/**
 * A {@link IConfigProvider} that stores key-value pairs in memory.
 *
 * Supports construction from a `Map`, a plain `Record`, an array of
 * `[key, value]` tuples (including nested `Object.entries`–style arrays),
 * or empty (no initial data).
 *
 * @example
 * ```ts
 * // Empty, then populate:
 * const provider = new InMemoryConfigProvider();
 * provider.set("host", "0.0.0.0");
 *
 * // From a Record (nested objects are flattened with ":"):
 * const provider = new InMemoryConfigProvider({ db: { host: "localhost" } });
 *
 * // From Object.entries–style arrays (deeply nested):
 * const provider = new InMemoryConfigProvider([
 *   ["app", [["name", "MyApp"]]],
 *   ["db", [["host", "localhost"], ["port", "5432"]]],
 * ]);
 * ```
 */
export class InMemoryConfigProvider implements IConfigProvider {
    /** Creates an empty provider. */
    public constructor();
    /**
     * Creates a provider initialised from a `Map`.
     * @param map - The source map.
     */
    public constructor(map: ReadonlyMap<string, TConfigValue>);
    /**
     * Creates a provider initialised from a plain object.
     *
     * Nested objects are flattened into colon-separated keys.
     * @param record - The source record.
     */
    public constructor(record: Readonly<NestedConfigRecord>);
    /**
     * Creates a provider initialised from an array of key-value tuples.
     *
     * Supports `Object.entries`–style nested arrays for deeply
     * nested configuration.
     * @param entries - The source entries.
     */
    public constructor(entries: readonly [string, TConfigValue][]);

    get(key: string): string | undefined;
    load(): void;

    /**
     * Stores a configuration value.
     *
     * If the value is a plain object or an `Object.entries`–style array,
     * it is flattened under the given key.
     *
     * @param key - The configuration key.
     * @param value - The value to associate with the key.
     */
    set(key: string, value: TConfigValue): void;
}
