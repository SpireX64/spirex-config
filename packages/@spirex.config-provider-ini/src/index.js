import * as fs from "node:fs";
import * as path from "node:path";
import { parseIni } from "./ini-reader.js";

var isArr = Array.isArray;
var len = function (v) {
    return v.length;
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

export class IniConfigProvider {
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
            throw new Error("INI config file not found: " + resolvedPath);
        }

        var raw = fs.readFileSync(resolvedPath, "utf-8");
        this._cache = parseIni(raw);

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
