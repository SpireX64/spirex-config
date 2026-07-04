export const SECTION_CHAR = ":";

var charCodeZero = "0".charCodeAt(0);
var charCodeNine = "9".charCodeAt(0);

function isDigitChar(n) {
    return n >= charCodeZero && n <= charCodeNine;
}

function isNumeric(str) {
    for (var i = 0; i < str.length; ++i) {
        if (!isDigitChar(str.charCodeAt(i))) return false;
    }
    return true;
}

/**
 * Parse string to boolean value
 * @param {string} str
 * @returns {boolean}
 */
function parseBoolean(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith("y") || str.startsWith("t") || str.startsWith("a"))
        return true;

    return str.length > 0 && isNumeric(str) && str !== "0";
}

function getValue(providers, map, key, def) {
    var value;
    for (var i = providers.length - 1; i >= 0; --i) {
        value = providers[i].get(key);
        if (value !== undefined) break;
    }

    if (value === undefined) {
        if (def) return typeof def === "function" ? def() : def;
        throw new Error(`Configuration value is not defined: ${key}`);
    }

    return map ? map(value) : value;
}

function createSection(config, path) {
    const pathJoin = (key) => path + SECTION_CHAR + key;
    const sectionGetter = (getter) => (key, def) => getter(pathJoin(key), def);
    return {
        path,
        section: (subPath) => config.section(pathJoin(subPath)),
        getBoolean: sectionGetter(config.getBoolean),
        getInteger: sectionGetter(config.getInteger),
        getFloat: sectionGetter(config.getFloat),
        getString: sectionGetter(config.getString),
        map(mapper) {
            return mapper(this);
        },
    };
}

function createConfig(providers) {
    return {
        getBoolean: getValue.bind(0, providers, parseBoolean),
        getInteger: getValue.bind(0, providers, parseInt),
        getFloat: getValue.bind(0, providers, parseFloat),
        getString: getValue.bind(0, providers, 0),
        section(path) {
            return createSection(this, path);
        },
    };
}

function createConfigRoot(providers) {
    var config = createConfig(providers);

    config.reload = function () {
        for (var p of providers) p.load();
    };

    return Object.defineProperties(config, {
        providers: {
            value: providers,
            writable: false,
        },
    });
}

export function configBuilder() {
    const providers = [];

    function add(provider) {
        providers.push(provider);
        return this;
    }

    function build() {
        var root = createConfigRoot(providers);
        root.reload();
        return root;
    }

    return Object.defineProperties(
        { add, build },
        {
            providers: {
                value: providers,
                writable: false,
            },
        },
    );
}

function fillMapByEntries(map, entries) {
    for (var [key, value] of entries) {
        map.set(key, value);
    }
}

export class InMemoryConfigProvider {
    constructor(kvSource) {
        this._kvSource = kvSource;
        this._cache = null;
    }

    load() {
        if (!this._kvSource || typeof this._kvSource !== "object") return;

        this._cache = new Map();
        if (this._kvSource instanceof Map) {
            this._kvSource.forEach((value, key) => {
                this._cache.set(key, value);
            });
        } else if (Array.isArray(this._kvSource)) {
            fillMapByEntries(this._cache, this._kvSource);
        } else {
            fillMapByEntries(this._cache, Object.entries(this._kvSource));
        }
    }

    get(key) {
        if (!this._cache) return undefined;
        return this._cache.get(key);
    }

    set(key, value) {
        if (!this._cache) this._cache = new Map();
        this._cache.set(key, value);
    }
}
