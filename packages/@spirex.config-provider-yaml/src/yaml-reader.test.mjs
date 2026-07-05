import { describe, test, expect } from "vitest";
import { parseYaml } from "./yaml-reader.js";

/**
 * Helper: get all keys from a Map.
 */
var keysOf = function (map) {
    return Array.from(map.keys());
};

describe("parseYaml", function () {
    describe("basic key-value", function () {
        test("loads flat key-value pairs", function () {
            var map = parseYaml('name: MyApp\nversion: "1.0"');
            expect(map.get("name")).toBe("MyApp");
            expect(map.get("version")).toBe("1.0");
        });

        test("reads integer values as strings", function () {
            var map = parseYaml("port: 5432\ncount: 42");
            expect(map.get("port")).toBe("5432");
            expect(map.get("count")).toBe("42");
        });

        test("reads boolean values as strings", function () {
            var map = parseYaml("debug: true\nenabled: false");
            expect(map.get("debug")).toBe("true");
            expect(map.get("enabled")).toBe("false");
        });

        test("reads float values as strings", function () {
            var map = parseYaml("ratio: 3.14");
            expect(map.get("ratio")).toBe("3.14");
        });

        test("yes/no/on/off are kept as literal strings in YAML 1.2", function () {
            var map = parseYaml("a: yes\nb: no\nc: on\nd: off");
            expect(map.get("a")).toBe("yes");
            expect(map.get("b")).toBe("no");
            expect(map.get("c")).toBe("on");
            expect(map.get("d")).toBe("off");
        });
    });

    describe("arrays and sequences", function () {
        test("reads array values as stringified arrays", function () {
            var map = parseYaml("items:\n  - 1\n  - 2\n  - 3");
            expect(map.get("items")).toBe("1,2,3");
        });

        test("skips empty arrays", function () {
            var map = parseYaml("present: val\nempty: []");
            expect(map.get("present")).toBe("val");
            expect(map.has("empty")).toBe(false);
        });
    });

    describe("null values", function () {
        test("skips explicit null values", function () {
            var map = parseYaml("present: val\nmissing: null");
            expect(map.get("present")).toBe("val");
            expect(map.has("missing")).toBe(false);
        });

        test("skips YAML ~ (null alias)", function () {
            var map = parseYaml("present: val\nmissing: ~");
            expect(map.get("present")).toBe("val");
            expect(map.has("missing")).toBe(false);
        });
    });

    describe("nested objects", function () {
        test("reads nested objects flattened with : separator", function () {
            var map = parseYaml("db:\n  host: localhost\n  port: 5432");
            expect(map.get("db:host")).toBe("localhost");
            expect(map.get("db:port")).toBe("5432");
        });

        test("deep nesting produces multi-level keys", function () {
            var map = parseYaml("a:\n  b:\n    c: d");
            expect(map.get("a:b:c")).toBe("d");
        });
    });

    describe("flat vs hierarchical priority", function () {
        test("flat key overrides hierarchical key", function () {
            var map = parseYaml(
                "db:\n  host: nested\n  port: 5432\ndb:host: flat",
            );
            expect(map.get("db:host")).toBe("flat");
            expect(map.get("db:port")).toBe("5432");
        });

        test("both forms coexist when keys do not overlap", function () {
            var map = parseYaml(
                "db:\n  host: nested\n  port: 5432\napp:name: MyApp",
            );
            expect(map.get("db:host")).toBe("nested");
            expect(map.get("db:port")).toBe("5432");
            expect(map.get("app:name")).toBe("MyApp");
        });
    });

    describe("edge cases", function () {
        test("empty object produces empty cache", function () {
            var map = parseYaml("{}");
            expect(map.size).toBe(0);
        });

        test("empty YAML string produces empty cache", function () {
            var map = parseYaml("");
            expect(map.size).toBe(0);
        });

        test("top-level array produces empty cache", function () {
            var map = parseYaml("- 1\n- 2\n- 3");
            expect(map.size).toBe(0);
        });

        test("top-level scalar produces empty cache", function () {
            var map = parseYaml("hello world");
            expect(map.size).toBe(0);
        });

        test("returns a Map instance", function () {
            var map = parseYaml("key: val");
            expect(map).toBeInstanceOf(Map);
        });

        test("keys are case-sensitive", function () {
            var map = parseYaml("Key: upper\nkey: lower");
            expect(map.get("Key")).toBe("upper");
            expect(map.get("key")).toBe("lower");
        });

        test("duplicate keys throw YAMLParseError", function () {
            expect(function () {
                parseYaml("key: first\nkey: second");
            }).toThrow();
        });

        test("throws on invalid YAML", function () {
            expect(function () {
                parseYaml("{ bad: yaml: here }");
            }).toThrow();
        });
    });

    describe("YAML-specific types", function () {
        test("multi-line strings via | are preserved", function () {
            var map = parseYaml("desc: |\n  hello\n  world");
            expect(map.get("desc")).toBe("hello\nworld\n");
        });

        test("multi-line strings via > (folded) are handled", function () {
            var map = parseYaml("desc: >\n  hello\n  world");
            expect(map.get("desc")).toBe("hello world\n");
        });

        test("quoted strings are unquoted", function () {
            var map = parseYaml("single: 'hello'\ndouble: \"world\"");
            expect(map.get("single")).toBe("hello");
            expect(map.get("double")).toBe("world");
        });

        test("dates are stringified", function () {
            var map = parseYaml("date: 2024-01-01");
            // The yaml package parses this as a Date by default
            var val = map.get("date");
            expect(typeof val).toBe("string");
            expect(val).toBeTruthy();
        });
    });
});
