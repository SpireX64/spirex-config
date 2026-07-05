export declare const SECTION_CHAR: string;

/** Provides configuration values by key.*/
export interface IConfigProvider {
    /**
     * Retrieves a configuration value by its key.
     *
     * @param key - The configuration key to look up.
     * @returns The associated value, or `undefined` if the key is not found.
     */
    get(key: string): string | undefined;

    /**
     * Loads or reloads configuration data from the underlying source.
     */
    load(): void;
}

/**
 * A default value that can be either a concrete value or a lazy factory function.
 *
 * Factory functions are only invoked when the fallback is actually needed.
 *
 * @typeParam T - The type of the default value.
 */
export type TDefValue<T> = T | (() => T);

/**
 * Abstract key-value collection providing typed access to configuration values.
 */
export interface IConfig {
    /**
     * Creates a scoped subsection rooted at the given path.
     *
     * Keys within the section are prefixed with `path`, allowing
     * logical grouping of related settings.
     *
     * @param path - The dot-separated path prefix for the section.
     * @returns A new {@link IConfigSection} scoped to the given path.
     */
    section(path: string): IConfigSection;

    /**
     * Returns a configuration value as a string.
     *
     * @param key - The configuration key.
     * @param def - A fallback value or factory, used when the key is missing.
     */
    getString(key: string, def?: TDefValue<string>): string;

    /**
     * Returns a configuration value as an integer.
     *
     * @param key - The configuration key.
     * @param def - A fallback value or factory, used when the key is missing.
     */
    getInteger(key: string, def?: TDefValue<number>): number;

    /**
     * Returns a configuration value as a floating-point number.
     *
     * @param key - The configuration key.
     * @param def - A fallback value or factory, used when the key is missing.
     */
    getFloat(key: string, def?: TDefValue<number>): number;

    /**
     * Returns a configuration value as a boolean.
     *
     * @param key - The configuration key.
     * @param def - A fallback value or factory, used when the key is missing.
     */
    getBoolean(key: string, def?: TDefValue<boolean>): boolean;
}

/**
 * A configuration section scoped to a specific path prefix.
 */
export interface IConfigSection extends IConfig {
    /** The dot-separated path prefix for this section. */
    readonly path: string;

    /** Map section to specific struct */
    map<T>(mapper: (config: this) => T): T;
}

/**
 * Builder that assembles an {@link IConfig}.
 *
 * Providers added later take precedence over those added earlier;
 * the last match wins.
 *
 * @example
 * ```ts
 * const config = configBuilder()
 *   .add(new EnvConfigProvider("APP_", true))
 *   .build();
 * ```
 */
export interface IConfigBuilder {
    /** The list of registered configuration providers, in priority order. */
    get providers(): IConfigProvider[];

    /**
     * Registers a configuration provider.
     *
     * @param provider - The provider to append.
     * @returns This builder (for chaining).
     */
    add(provider: IConfigProvider): this;

    /**
     * Finalises the builder and returns a ready-to-use {@link IConfig} instance.
     */
    build(): IConfig;
}

/**
 * Creates a new {@link IConfigBuilder} for assembling configuration.
 *
 * @returns A fresh builder instance.
 */
export function configBuilder(): IConfigBuilder;
