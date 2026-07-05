import { SECTION_CHAR } from "@spirex/config";

var len = function (v) {
    return v.length;
};

/**
 * Strip inline comments and resolve escaped `\#` sequences.
 * Walks the value character by character:
 * - `\#` → literal `#`
 * - bare `#` → comment starts, stop here
 * - everything else is kept verbatim
 * Returns trimmed result.
 */
var resolveValue = function (raw) {
    var result = "";
    for (var i = 0; i < len(raw); ++i) {
        var c = raw[i];
        if (c === "\\" && raw[i + 1] === "#") {
            result += "#";
            ++i; // consume the escaped #
        } else if (c === "#") {
            break; // unescaped # → comment starts
        } else {
            result += c;
        }
    }
    return result.trim();
};

/**
 * Parse an INI-format string into a flat Map of key-value pairs.
 *
 * Rules:
 * - `[Section]` headers become key prefixes joined with `:` (SECTION_CHAR).
 *   Whitespace inside brackets is trimmed. Inline comments after `]` are ignored.
 * - Keys may contain `:` for nested paths (e.g. `Foo:Value1=Hello`).
 * - Section prefix + inline `:` combine: `[App]` + `Features:Secure=true` → `App:Features:Secure`.
 * - `#` starts a comment (full-line or inline). `\#` escapes to a literal `#`.
 * - Whitespace around `=` is flexible.
 * - Empty values (`Key =` or `Key = # comment`) and lines with no key (`=value`) are skipped.
 * - Duplicate keys: last-wins.
 * - CRLF line endings are handled.
 *
 * @param {string} text - Raw INI file content.
 * @returns {Map<string, string>} Parsed key-value pairs.
 */
export function parseIni(text) {
    var map = new Map();
    var currentSection = "";

    var lines = text.split(/\r?\n/);
    for (var i = 0; i < len(lines); ++i) {
        var line = lines[i].trim();

        // Skip empty lines and whitespace-only lines
        if (line === "") continue;

        // Skip full-line comments
        if (line[0] === "#") continue;

        // Section header
        if (line[0] === "[") {
            var closeBracket = line.indexOf("]");
            if (closeBracket === -1) continue; // malformed, skip

            var sectionName = line.slice(1, closeBracket).trim();

            // Strip inline comment after "]"
            var afterBracket = line.slice(closeBracket + 1).trim();
            if (afterBracket !== "" && afterBracket[0] !== "#") {
                // Something after "]" that isn't a comment — treat as malformed, skip
                continue;
            }

            // Empty section header → section-less mode
            currentSection = sectionName !== "" ? sectionName : "";
            continue;
        }

        // Key-value pair
        var eqIdx = line.indexOf("=");
        if (eqIdx === -1) continue; // no "=", skip

        var key = line.slice(0, eqIdx).trim();
        if (key === "") continue; // no key, skip

        var rawValue = line.slice(eqIdx + 1);
        var value = resolveValue(rawValue);
        if (value === "") continue; // empty value, skip

        // Build full key
        var fullKey =
            currentSection !== "" ? currentSection + SECTION_CHAR + key : key;

        map.set(fullKey, value); // last-wins
    }

    return map;
}
