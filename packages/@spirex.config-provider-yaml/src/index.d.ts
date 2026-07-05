import type { IConfigProvider } from "@spirex/config";

/**
 * Options for {@link YamlConfigProvider}.
 */
export interface YamlConfigProviderOptions {
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
     * When `true`, watches the YAML file for changes via `fs.watch`
     * and automatically reloads on modification.
     *
     * The watcher starts on the first {@link YamlConfigProvider.load} call.
     * If the file does not exist at that time and `noThrow` is `true`,
     * no watcher is set up — the file will only be picked up on the next
     * manual `config.reload()`.
     */
    watch?: boolean;

    /**
     * When `true`, a missing file is silently ignored (the cache stays
     * empty or unchanged). Invalid YAML still throws regardless of this
     * setting.
     *
     * @default false
     */
    noThrow?: boolean;
}

/**
 * A configuration provider that reads key-value pairs from a YAML file
 * and maps them into the {@link IConfigProvider} interface.
 *
 * YAML mappings are flattened using `:` as the section separator:
 * `{ db: { host: localhost } }` becomes `"db:host" = "localhost"`.
 *
 * Flat keys containing `:` take priority over hierarchical equivalents.
 *
 * @example
 * ```ts
 * import { configBuilder } from "@spirex/config";
 * import { YamlConfigProvider } from "@spirex/config-provider-yaml";
 *
 * const config = configBuilder()
 *   .add(new YamlConfigProvider("./config.defaults.yaml"))
 *   .add(new YamlConfigProvider("./config.local.yaml", { noThrow: true }))
 *   .build();
 *
 * const host = config.getString("database:host");
 * ```
 */
export class YamlConfigProvider implements IConfigProvider {
    /**
     * Creates a new YAML file configuration provider.
     *
     * @param filePath - Path to the YAML file, relative to `process.cwd()`
     *                   or an absolute path.
     * @param options  - Optional configuration for filtering and file watching.
     */
    constructor(filePath: string, options?: YamlConfigProviderOptions);

    /**
     * Retrieves a configuration value by its key.
     *
     * @param key - The configuration key to look up.
     * @returns The associated value, or `undefined` if the key is not found
     *          or the provider has not been loaded yet.
     */
    get(key: string): string | undefined;

    /**
     * Reads and parses the YAML file, populating the internal cache.
     *
     * Throws if the file does not exist (unless `noThrow` is `true`)
     * or if the file contains invalid YAML.
     */
    load(): void;

    /**
     * Stops the file watcher if one is active. Safe to call multiple times.
     */
    unwatch(): void;
}
