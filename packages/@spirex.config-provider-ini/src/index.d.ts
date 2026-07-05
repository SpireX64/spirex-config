import type { IConfigProvider } from "@spirex/config";

/**
 * Options for {@link IniConfigProvider}.
 */
export interface IniConfigProviderOptions {
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
     * When `true`, watches the INI file for changes via `fs.watch`
     * and automatically reloads on modification.
     *
     * The watcher starts on the first {@link IniConfigProvider.load} call.
     * If the file does not exist at that time and `noThrow` is `true`,
     * no watcher is set up — the file will only be picked up on the next
     * manual `config.reload()`.
     */
    watch?: boolean;

    /**
     * When `true`, a missing file is silently ignored (the cache stays
     * empty or unchanged). Malformed INI still throws regardless of this
     * setting.
     *
     * @default false
     */
    noThrow?: boolean;
}

/**
 * A configuration provider that reads key-value pairs from an INI file
 * and maps them into the {@link IConfigProvider} interface.
 *
 * INI sections are prefixed using `:` as the section separator:
 * `[Database]\nhost=localhost` becomes `"Database:host" = "localhost"`.
 *
 * Keys may contain `:` for nested paths; these combine with section
 * prefixes: `[App]\nFeatures:Secure=true` → `"App:Features:Secure"`.
 *
 * `#` starts a comment. `\#` escapes to a literal `#` in values.
 *
 * @example
 * ```ts
 * import { configBuilder } from "@spirex/config";
 * import { IniConfigProvider } from "@spirex/config-provider-ini";
 *
 * const config = configBuilder()
 *   .add(new IniConfigProvider("./config.defaults.ini"))
 *   .add(new IniConfigProvider("./config.local.ini", { noThrow: true }))
 *   .build();
 *
 * const host = config.getString("Database:host");
 * ```
 */
export class IniConfigProvider implements IConfigProvider {
    /**
     * Creates a new INI file configuration provider.
     *
     * @param filePath - Path to the INI file, relative to `process.cwd()`
     *                   or an absolute path.
     * @param options  - Optional configuration for filtering and file watching.
     */
    constructor(filePath: string, options?: IniConfigProviderOptions);

    /**
     * Retrieves a configuration value by its key.
     *
     * @param key - The configuration key to look up.
     * @returns The associated value, or `undefined` if the key is not found
     *          or the provider has not been loaded yet.
     */
    get(key: string): string | undefined;

    /**
     * Reads and parses the INI file, populating the internal cache.
     *
     * Throws if the file does not exist (unless `noThrow` is `true`).
     */
    load(): void;

    /**
     * Stops the file watcher if one is active. Safe to call multiple times.
     */
    unwatch(): void;
}
