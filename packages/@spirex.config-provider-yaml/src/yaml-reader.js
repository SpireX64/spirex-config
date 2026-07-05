import { parse } from "yaml";
import { SECTION_CHAR } from "@spirex/config";

var isArr = Array.isArray;
var len = function (v) {
    return v.length;
};
var isObject = function (v) {
    return v != null && typeof v === "object" && !isArr(v);
};
var isEmpty = function (v) {
    return v == null || (isArr(v) && !len(v));
};
var shouldStringify = function (v) {
    return v != null && typeof v !== "string";
};
var stringify = function (v) {
    return shouldStringify(v) ? String(v) : v;
};

var flattenInto = function (map, obj, prefix) {
    var keys = Object.keys(obj);
    for (var i = 0; i < len(keys); ++i) {
        var key = keys[i];
        var value = obj[key];
        var fullKey = prefix ? prefix + SECTION_CHAR + key : key;

        if (isEmpty(value)) continue;
        if (isObject(value)) {
            flattenInto(map, value, fullKey);
        } else {
            map.set(fullKey, stringify(value));
        }
    }
};

/**
 * Parse a YAML string into a flat Map of key-value pairs.
 *
 * Nested objects are recursively flattened using `:` (SECTION_CHAR)
 * as the key separator — identical behaviour to the JSON provider.
 *
 * Flat keys containing `:` take priority over hierarchical equivalents
 * when they overlap.
 *
 * Top-level YAML scalars (strings, numbers) and sequences (arrays)
 * produce an empty Map — only YAML mappings are flattened.
 *
 * YAML `null` / `~` values and empty arrays are skipped.
 * All non-string values are converted to strings via `String()`.
 *
 * @param {string} text - Raw YAML content.
 * @returns {Map<string, string>} Parsed key-value pairs.
 */
export function parseYaml(text) {
    var parsed = parse(text);
    var map = new Map();

    // Only mappings produce keys — scalars and sequences yield empty
    if (!isObject(parsed)) {
        return map;
    }

    // First pass — flatten hierarchical keys
    flattenInto(map, parsed, "");

    // Second pass — overlay flat keys (keys containing SECTION_CHAR win)
    var keys = Object.keys(parsed);
    for (var i = 0; i < len(keys); ++i) {
        var key = keys[i];
        if (key.indexOf(SECTION_CHAR) !== -1) {
            map.set(key, stringify(parsed[key]));
        }
    }

    return map;
}
