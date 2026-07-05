/**
 * Parse an INI-format string into a flat Map of key-value pairs.
 *
 * ### Parsing rules
 * - **Section headers** `[Section]` become key prefixes joined with `:`.
 *   Whitespace inside brackets is trimmed. Comments after `]` are ignored.
 * - **Flat mode** — if no section header appears, keys are used as-is.
 * - **Inline paths** — keys may contain `:` for nesting (e.g. `Foo:Value1=Hello`).
 * - **Comments** — `#` starts a comment (full-line or inline). `\#` escapes to literal `#`.
 * - **Whitespace** — flexible around `=`. Trailing whitespace on values is trimmed.
 * - **Empty values** — skipped (not added to the map).
 * - **Duplicate keys** — last-wins.
 * - **CRLF** — Windows line endings are handled.
 *
 * @param text - Raw INI file content.
 * @returns A {@link Map} of configuration key to string value.
 *
 * @example
 * ```ts
 * import { parseIni } from "@spirex/config-provider-ini/ini-reader";
 *
 * const map = parseIni(`
 *   [Database]
 *   host = localhost
 *   port = 5432
 *
 *   App:Name = MyApp
 * `);
 * // Map { "Database:host" → "localhost", "Database:port" → "5432", "App:Name" → "MyApp" }
 * ```
 */
export function parseIni(text: string): Map<string, string>;
