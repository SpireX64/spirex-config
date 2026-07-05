import { SECTION_CHAR } from "./index";

var isArr = Array.isArray;
var len = (v) => v.length;
var isObject = (v) => v != null && typeof v === "object";
var isEmpty = (v) => v == null || (isArr(v) && !len(v));
var isEntry = (v) => isArr(v) && len(v) >= 2;
var isEntriesArray = (arr) => arr.some(isEntry);

var canFlatten = (v) => (isArr(v) ? isEntriesArray(v) : isObject(v));

var flattenEntry = (map, key, value, prefix) => {
    if (isEmpty(value)) return;

    var fullKey = prefix ? prefix + SECTION_CHAR + key : key;
    if (canFlatten(value)) {
        flattenInto(map, value, fullKey);
    } else {
        map.set(fullKey, value);
    }
};

var flattenInto = (map, source, prefix) => {
    if (source instanceof Map) {
        source.forEach((value, key) => {
            flattenEntry(map, key, value, prefix);
        });
    } else if (isArr(source)) {
        for (var entry of source) {
            if (entry && isEntry(entry)) {
                flattenEntry(map, entry[0], entry[1], prefix);
            }
        }
    } else {
        for (var key of Object.keys(source)) {
            flattenEntry(map, key, source[key], prefix);
        }
    }
};

export class InMemoryConfigProvider {
    constructor(kvSource) {
        this._kvSource = kvSource;
        this._cache = null;
    }

    load() {
        this._cache = new Map();
        if (isObject(this._kvSource)) {
            flattenInto(this._cache, this._kvSource, "");
        }
    }

    get(key) {
        if (!this._cache) return undefined;
        return this._cache.get(key);
    }

    set(key, value) {
        if (!this._cache) this._cache = new Map();
        if (isEmpty(value)) return;

        if (canFlatten(value)) {
            flattenInto(this._cache, value, key);
        } else {
            this._cache.set(key, value);
        }
    }
}
