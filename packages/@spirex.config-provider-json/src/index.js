import * as fs from "node:fs";
import * as path from "node:path";
import { SECTION_CHAR } from "@spirex/config";

var isArr = Array.isArray;
var len = (v) => v.length;
var isObject = (v) => v != null && typeof v === "object" && !isArr(v);
var isEmpty = (v) => v == null || (isArr(v) && !len(v));
var shouldStringify = (v) => v != null && typeof v !== "string";
var stringify = (v) => (shouldStringify(v) ? String(v) : v);

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

var applyFilter = function (map, list, isWhitelist) {
    if (!list || !len(list)) return;

    var keys = Array.from(map.keys());
    for (var i = 0; i < len(keys); ++i) {
        var key = keys[i];
        var matched = false;
        for (var j = 0; j < len(list); ++j) {
            if (key.startsWith(list[j])) {
                matched = true;
                break;
            }
        }
        if (isWhitelist ? !matched : matched) {
            map.delete(key);
        }
    }
};

export class JsonConfigProvider {
    constructor(filePath, options) {
        this._filePath = filePath;
        this._whitelist = options && options.whitelist;
        this._blacklist = options && options.blacklist;
        this._watch = options && options.watch;
        this._noThrow = options && options.noThrow;
        this._cache = null;
        this._watcher = null;
        this._debounce = null;
    }

    load() {
        var resolvedPath = path.resolve(process.cwd(), this._filePath);

        if (!fs.existsSync(resolvedPath)) {
            if (this._noThrow) return;
            throw new Error("JSON config file not found: " + resolvedPath);
        }

        var raw = fs.readFileSync(resolvedPath, "utf-8");
        var parsed = JSON.parse(raw);

        this._cache = new Map();

        // First pass — flatten hierarchical keys (nested objects)
        if (isObject(parsed)) {
            flattenInto(this._cache, parsed, "");
        }

        // Second pass — overlay flat keys (keys containing SECTION_CHAR win)
        if (isObject(parsed)) {
            var keys = Object.keys(parsed);
            for (var i = 0; i < len(keys); ++i) {
                var key = keys[i];
                if (key.indexOf(SECTION_CHAR) !== -1) {
                    this._cache.set(key, stringify(parsed[key]));
                }
            }
        }

        // Apply filters
        applyFilter(this._cache, this._whitelist, true);
        applyFilter(this._cache, this._blacklist, false);

        // Set up file watcher
        if (this._watch && !this._watcher) {
            var self = this;
            this._watcher = fs.watch(resolvedPath, function () {
                self._scheduleReload();
            });
        }
    }

    _scheduleReload() {
        clearTimeout(this._debounce);
        var self = this;
        this._debounce = setTimeout(function () {
            self.load();
        }, 100);
    }

    get(key) {
        return this._cache ? this._cache.get(key) : undefined;
    }

    unwatch() {
        if (this._watcher) {
            this._watcher.close();
            this._watcher = null;
        }
        if (this._debounce) {
            clearTimeout(this._debounce);
            this._debounce = null;
        }
    }
}
