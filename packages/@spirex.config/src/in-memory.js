import { SECTION_CHAR } from "./index";

function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Check if an array is an "entries array" (Object.entries style).
 * An entries array has at least one element that is itself a [key, value] pair.
 * This distinguishes `[["k","v"]]` (entries) from `["a","b","c"]` (leaf list).
 * @param {Array} arr
 * @returns {boolean}
 */
function isEntriesArray(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (Array.isArray(arr[i]) && arr[i].length >= 2) return true;
    }
    return false;
}

function flattenEntry(map, key, value, prefix) {
    if (value === null || value === undefined) return;

    // Skip empty arrays (like empty objects, they produce no entries)
    if (Array.isArray(value) && value.length === 0) return;

    var fullKey = prefix ? prefix + SECTION_CHAR + key : key;
    if (isPlainObject(value)) {
        flattenInto(map, value, fullKey);
    } else if (Array.isArray(value) && isEntriesArray(value)) {
        flattenInto(map, value, fullKey);
    } else {
        map.set(fullKey, value);
    }
}

function flattenInto(map, source, prefix) {
    if (source instanceof Map) {
        source.forEach((value, key) => {
            flattenEntry(map, key, value, prefix);
        });
    } else if (Array.isArray(source)) {
        for (var i = 0; i < source.length; ++i) {
            var entry = source[i];
            if (entry && Array.isArray(entry) && entry.length >= 2) {
                flattenEntry(map, entry[0], entry[1], prefix);
            }
        }
    } else {
        // isPlainObject — the only valid remaining source type
        for (var key of Object.keys(source)) {
            flattenEntry(map, key, source[key], prefix);
        }
    }
}

export class InMemoryConfigProvider {
    constructor(kvSource) {
        this._kvSource = kvSource;
        this._cache = null;
    }

    load() {
        this._cache = new Map();
        if (this._kvSource && typeof this._kvSource === "object") {
            flattenInto(this._cache, this._kvSource, "");
        }
    }

    get(key) {
        if (!this._cache) return undefined;
        return this._cache.get(key);
    }

    set(key, value) {
        if (!this._cache) this._cache = new Map();
        if (value === null || value === undefined) return;
        // Empty arrays (like empty objects) produce no entries
        if (Array.isArray(value) && value.length === 0) return;

        if (isPlainObject(value) || (Array.isArray(value) && isEntriesArray(value))) {
            flattenInto(this._cache, value, key);
        } else {
            this._cache.set(key, value);
        }
    }
}
