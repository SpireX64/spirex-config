export const SECTION_CHAR = ":";

var len = (v) => v.length;
var withProps = Object.defineProperties;
var readonlyPropValue = (v) => ({ value: v, writable: false });

var isNumeric = (str) => {
    for (var i = 0; i < len(str); ++i) {
        var c = str.charCodeAt(i);
        if (c < 48 || c > 57) return false;
    }
    return true;
};

var parseBoolean = (str) => {
    str = str.trim().toLowerCase();
    var c = str[0];
    if (c === "y" || c === "t" || c === "a") return true;
    return len(str) > 0 && isNumeric(str) && str !== "0";
};

var getValue = (providers, map, key, def) => {
    var value;
    for (var i = len(providers) - 1; i >= 0; --i) {
        value = providers[i].get(key);
        if (value !== undefined) break;
    }
    if (value === undefined) {
        if (def) return typeof def === "function" ? def() : def;
        throw new Error(`Configuration value is not defined: ${key}`);
    }
    return map ? map(value) : value;
};

var mappers = {
    getBoolean: parseBoolean,
    getInteger: parseInt,
    getFloat: parseFloat,
    getString: null,
};
var mapMappers = (f, i = {}) =>
    Object.keys(mappers).reduce((o, m) => ((o[m] = f(m)), o), i);

var createSection = (config, path) => {
    var pathJoin = (key) => path + SECTION_CHAR + key;
    var sectionGetter = (getter) => (key, def) => getter(pathJoin(key), def);

    return mapMappers((m) => sectionGetter(config[m]), {
        path,
        section: (subPath) => config.section(pathJoin(subPath)),
        map(mapper) {
            return mapper(this);
        },
    });
};

var createConfig = (providers) =>
    mapMappers((m) => getValue.bind(null, providers, mappers[m]), {
        section(path) {
            return createSection(this, path);
        },
    });

var createConfigRoot = (providers) => {
    var config = createConfig(providers);
    config.reload = () => {
        for (var p of providers) p.load();
    };
    return withProps(config, {
        providers: readonlyPropValue(providers),
    });
};

export function configBuilder() {
    var providers = [];

    function add(provider) {
        providers.push(provider);
        return this;
    }

    var build = () => {
        var root = createConfigRoot(providers);
        root.reload();
        return root;
    };

    return withProps(
        { add, build },
        { providers: readonlyPropValue(providers) },
    );
}
