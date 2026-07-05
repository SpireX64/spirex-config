/**
 * Parse a YAML string into a flat Map of key-value pairs.
 *
 * Nested objects are recursively flattened using `:` as the key separator:
 * `{ db: { host: localhost } }` becomes `"db:host" = "localhost"`.
 *
 * Flat keys containing `:` take priority over hierarchical equivalents
 * when they overlap.
 *
 * YAML `null` / `~` values and empty arrays are skipped.
 * All non-string values are converted to strings via `String()`.
 * Top-level scalars and sequences produce an empty Map.
 *
 * @param text - Raw YAML content.
 * @returns A {@link Map} of configuration key to string value.
 *
 * @example
 * ```ts
 * import { parseYaml } from "@spirex/config-provider-yaml/yaml-reader";
 *
 * const map = parseYaml(`
 *   database:
 *     host: localhost
 *     port: 5432
 *   app:name: MyApp
 * `);
 * // Map { "database:host" → "localhost", "database:port" → "5432", "app:name" → "MyApp" }
 * ```
 */
export function parseYaml(text: string): Map<string, string>;
