import type { IConfigProvider } from "@spirex/config";

/**
 * Options for {@link JsonConfigProvider}.
 */
export interface JsonConfigProviderOptions {
    /**
     * Only include keys whose full path starts with one of these prefixes.
     * An empty or omitted list includes all keys.
     */
    whitelist?: string[];

    /**
     * Exclude keys whose full path starts with one of these prefixes.
     * An empty or omitted list excludes nothing.
     */
    blacklist?: string[];

    /**
     * When `true`, watches the JSON file for changes via `fs.watch`
     * and automatically reloads on modification.
     *
     * The watcher starts on the first {@link JsonConfigProvider.load} call.
     * If the file does not exist at that time and `noThrow` is `true`,
     * no watcher is set up — the file will only be picked up on the next
     * manual `config.reload()`.
     */
    watch?: boolean;

    /**
     * When `true`, a missing file is silently ignored (the cache stays
     * empty or unchanged). Invalid JSON still throws regardless of this
     * setting.
     *
     * @default false
     */
    noThrow?: boolean;
}

/**
 * A configuration provider that reads key-value pairs from a JSON file
 * and maps them into the {@link IConfigProvider} interface.
 *
 * JSON objects are flattened using `:` as the section separator:
 * `{ "db": { "host": "localhost" } }` becomes `"db:host" = "localhost"`.
 *
 * Flat keys containing `:` take priority over hierarchical equivalents.
 *
 * @example
 * ```ts
 * import { configBuilder } from "@spirex/config";
 * import { JsonConfigProvider } from "@spirex/config-provider-json";
 *
 * const config = configBuilder()
 *   .add(new JsonConfigProvider("./config.defaults.json"))
 *   .add(new JsonConfigProvider("./config.local.json", { noThrow: true }))
 *   .build();
 *
 * const host = config.getString("db:host");
 * ```
 */
export class JsonConfigProvider implements IConfigProvider {
    /**
     * Creates a new JSON file configuration provider.
     *
     * @param filePath - Path to the JSON file, relative to `process.cwd()`
     *                   or an absolute path.
     * @param options  - Optional configuration for filtering and file watching.
     */
    constructor(filePath: string, options?: JsonConfigProviderOptions);

    /**
     * Retrieves a configuration value by its key.
     *
     * @param key - The configuration key to look up.
     * @returns The associated value, or `undefined` if the key is not found
     *          or the provider has not been loaded yet.
     */
    get(key: string): string | undefined;

    /**
     * Reads and parses the JSON file, populating the internal cache.
     *
     * Throws if the file does not exist (unless `noThrow` is `true`)
     * or if the file contains invalid JSON.
     */
    load(): void;

    /**
     * Stops the file watcher if one is active. Safe to call multiple times.
     */
    unwatch(): void;
}
