import { SECTION_CHAR } from "@spirex/config";

const ENV_SECTION_SEPARATOR = "__";

export class EnvConfigProvider {
    constructor(prefix, stripPrefix) {
        this._prefix = prefix;
        this._stripPrefix = stripPrefix;
        this._cache = null;
    }

    load() {
        var keys = Object.keys(process.env);
        if (this._prefix && this._prefix.length > 0)
            keys = keys.filter((k) => k.startsWith(this._prefix));
        if (keys.length === 0) return;

        this._cache = new Map();
        for (var key of keys) {
            var configKey =
                this._prefix && this._stripPrefix
                    ? key.slice(this._prefix.length)
                    : key;

            configKey = configKey
                .replaceAll(ENV_SECTION_SEPARATOR, SECTION_CHAR)
                .toLowerCase();

            this._cache.set(configKey, process.env[key]);
        }
    }

    get(key) {
        return this._cache.get(key.toLowerCase());
    }
}
