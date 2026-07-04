import type { IConfigProvider } from "@spirex/config";

/**
 * A configuration provider that reads values from environment variables
 * (`process.env`) and maps them into the {@link IConfigProvider} interface.
 *
 * @example
 * import { configBuilder } from "@spirex/config";
 * import { EnvConfigProvider } from "@spirex/config-provider-env";
 *
 * // APP__DB__HOST → section("db").getString("host")
 * const config = configBuilder()
 *   .add(new EnvConfigProvider("APP_", true))
 *   .build();
 */
export class EnvConfigProvider implements IConfigProvider {
    /**
     * Creates a new environment variable provider.
     *
     * @param prefix - Optional prefix to filter environment variables.
     *                 Only keys starting with this prefix are loaded.
     * @param stripPrefix - When `true`, the prefix is removed from the
     *                      resulting configuration key. Defaults to `false`.
     */
    constructor(prefix?: string, stripPrefix?: boolean);

    /**
     * Retrieves a configuration value by its key.
     *
     * @param key - The configuration key to look up (case-insensitive).
     * @returns The associated value, or `undefined` if the key is not found.
     */
    get(key: string): string | undefined;

    /**
     * Loads all matching environment variables into the internal cache.
     */
    load(): void;
}
