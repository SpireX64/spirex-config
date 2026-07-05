import { describe, test, expect } from "vitest";
import { parseIni } from "./ini-reader.js";

/**
 * Helper: convert a Map to a plain object for easier assertions.
 */
var toObj = function (map) {
    var obj = {};
    map.forEach(function (v, k) {
        obj[k] = v;
    });
    return obj;
};

/**
 * Helper: get all keys from a Map.
 */
var keysOf = function (map) {
    return Array.from(map.keys());
};

describe("parseIni", function () {
    describe("basic key-value", function () {
        test("loads key=value pairs", function () {
            var map = parseIni("name=MyApp\nversion=1.0");
            expect(map.get("name")).toBe("MyApp");
            expect(map.get("version")).toBe("1.0");
        });

        test("handles whitespace around =", function () {
            var map = parseIni("name  =  MyApp\nversion\t=\t1.0");
            expect(map.get("name")).toBe("MyApp");
            expect(map.get("version")).toBe("1.0");
        });

        test("values are always strings", function () {
            var map = parseIni("port=5432\ncount=42");
            expect(map.get("port")).toBe("5432");
            expect(map.get("count")).toBe("42");
        });

        test("trailing whitespace on values is trimmed", function () {
            var map = parseIni("key = value   \nother = hello\t ");
            expect(map.get("key")).toBe("value");
            expect(map.get("other")).toBe("hello");
        });
    });

    describe("inline path separators", function () {
        test("keys with : pass through as-is", function () {
            var map = parseIni("Foo:Value1=Hello\nFoo:Value2=yes");
            expect(map.get("Foo:Value1")).toBe("Hello");
            expect(map.get("Foo:Value2")).toBe("yes");
        });
    });

    describe("empty values and malformed lines", function () {
        test("empty values (trailing =) are skipped", function () {
            var map = parseIni("key=\nother=val");
            expect(map.has("key")).toBe(false);
            expect(map.get("other")).toBe("val");
        });

        test("empty values with comment (= # comment) are skipped", function () {
            var map = parseIni("key = # was unset\nother=val");
            expect(map.has("key")).toBe(false);
            expect(map.get("other")).toBe("val");
        });

        test("whitespace-only value is skipped", function () {
            var map = parseIni("key =   \nother=val");
            expect(map.has("key")).toBe(false);
            expect(map.get("other")).toBe("val");
        });

        test("lines with no key (=value) are skipped", function () {
            var map = parseIni("=value\nkey=real");
            expect(map.has("")).toBe(false);
            expect(keysOf(map)).toHaveLength(1);
            expect(map.get("key")).toBe("real");
        });

        test("lines without = are skipped", function () {
            var map = parseIni("just some text\nkey=val");
            expect(keysOf(map)).toHaveLength(1);
            expect(map.get("key")).toBe("val");
        });
    });

    describe("section headers", function () {
        test("section headers create prefixed keys", function () {
            var map = parseIni("[Section]\nvalueA=Hello\nvalueB=World");
            expect(map.get("Section:valueA")).toBe("Hello");
            expect(map.get("Section:valueB")).toBe("World");
        });

        test("section name whitespace is trimmed", function () {
            var map = parseIni("[ Section ]\nkey=val");
            expect(map.get("Section:key")).toBe("val");
        });

        test("section name with internal whitespace is preserved", function () {
            var map = parseIni("[App Features]\nSecure=true");
            expect(map.get("App Features:Secure")).toBe("true");
        });

        test("inline comment after section header is ignored", function () {
            var map = parseIni("[Section] # my section\nkey=val");
            expect(map.get("Section:key")).toBe("val");
        });

        test("empty section header [] treated as section-less", function () {
            var map = parseIni("[]\nkey=val");
            expect(map.get("key")).toBe("val");
        });

        test("whitespace-only section header treated as section-less", function () {
            var map = parseIni("[   ]\nkey=val");
            expect(map.get("key")).toBe("val");
        });

        test("section changes mid-file", function () {
            var map = parseIni("[SectionA]\nkey=valA\n[SectionB]\nkey=valB");
            expect(map.get("SectionA:key")).toBe("valA");
            expect(map.get("SectionB:key")).toBe("valB");
        });

        test("reverting to section-less mid-file", function () {
            var map = parseIni("[Section]\nkey=val\n[]\nflat=here");
            expect(map.get("Section:key")).toBe("val");
            expect(map.get("flat")).toBe("here");
        });

        test("malformed section [ without closing ] is skipped", function () {
            var map = parseIni("[Section\nkey=val");
            expect(map.get("Section")).toBeUndefined();
            expect(map.get("key")).toBe("val");
        });

        test("section with junk after ] not a comment is skipped", function () {
            // The section header is malformed and ignored, so key=val
            // parses in flat mode (currentSection unchanged).
            var map = parseIni("[Section]garbage\nkey=val");
            expect(map.get("Section:key")).toBeUndefined();
            expect(map.get("key")).toBe("val");
        });
    });

    describe("combined section + inline :", function () {
        test("section prefix combines with inline : in key", function () {
            var map = parseIni("[App]\nFeatures:Secure=true");
            expect(map.get("App:Features:Secure")).toBe("true");
        });

        test("multiple inline : levels combine with section prefix", function () {
            var map = parseIni("[Config]\nA:B:C=deep");
            expect(map.get("Config:A:B:C")).toBe("deep");
        });
    });

    describe("flat property mode (no section)", function () {
        test("no section header — flat mode", function () {
            var map = parseIni("keyA=valA\nkeyB=valB");
            expect(map.get("keyA")).toBe("valA");
            expect(map.get("keyB")).toBe("valB");
        });

        test("no section header with inline : keys", function () {
            var map = parseIni("Db:Host=localhost\nDb:Port=5432");
            expect(map.get("Db:Host")).toBe("localhost");
            expect(map.get("Db:Port")).toBe("5432");
        });
    });

    describe("duplicate keys", function () {
        test("last-wins for duplicate keys", function () {
            var map = parseIni("key=first\nkey=second");
            expect(map.get("key")).toBe("second");
        });

        test("last-wins across sections", function () {
            var map = parseIni("[A]\nkey=fromA\n[B]\nkey=fromB");
            expect(map.get("A:key")).toBe("fromA");
            expect(map.get("B:key")).toBe("fromB");
        });
    });

    describe("comments", function () {
        test("full-line comments are skipped", function () {
            var map = parseIni(
                "# this is a comment\nkey=val\n# another comment",
            );
            expect(map.get("key")).toBe("val");
            expect(keysOf(map)).toHaveLength(1);
        });

        test("inline comments after values are stripped", function () {
            var map = parseIni("key = val # inline comment");
            expect(map.get("key")).toBe("val");
        });

        test("escaped \\# preserved as literal #", function () {
            var map = parseIni("Value = foo\\#bar # comment");
            expect(map.get("Value")).toBe("foo#bar");
        });

        test("# without escape starts comment", function () {
            var map = parseIni("Password = abc#123");
            expect(map.get("Password")).toBe("abc");
        });

        test("escaped \\# at end of value", function () {
            var map = parseIni("key = value\\#");
            expect(map.get("key")).toBe("value#");
        });

        test("multiple escaped \\# in value", function () {
            var map = parseIni("key = a\\#b\\#c");
            expect(map.get("key")).toBe("a#b#c");
        });

        test("# after whitespace starts comment not escaped", function () {
            var map = parseIni("key = value  # trailing comment");
            expect(map.get("key")).toBe("value");
        });
    });

    describe("line endings", function () {
        test("CRLF line endings are handled", function () {
            var map = parseIni("key=val\r\nother=foo\r\n");
            expect(map.get("key")).toBe("val");
            expect(map.get("other")).toBe("foo");
        });

        test("mixed LF and CRLF", function () {
            var map = parseIni("a=1\r\nb=2\nc=3");
            expect(map.get("a")).toBe("1");
            expect(map.get("b")).toBe("2");
            expect(map.get("c")).toBe("3");
        });
    });

    describe("edge cases", function () {
        test("lines with only whitespace are skipped", function () {
            var map = parseIni("   \nkey=val\n\t\nother=foo");
            expect(map.get("key")).toBe("val");
            expect(map.get("other")).toBe("foo");
            expect(keysOf(map)).toHaveLength(2);
        });

        test("empty string returns empty map", function () {
            var map = parseIni("");
            expect(map.size).toBe(0);
        });

        test("only comments and whitespace returns empty map", function () {
            var map = parseIni("# comment\n\n  \n# another");
            expect(map.size).toBe(0);
        });

        test("returns a Map instance", function () {
            var map = parseIni("key=val");
            expect(map).toBeInstanceOf(Map);
        });

        test("keys are case-sensitive", function () {
            var map = parseIni("Key=upper\nkey=lower");
            expect(map.get("Key")).toBe("upper");
            expect(map.get("key")).toBe("lower");
        });

        test("= inside value is preserved", function () {
            var map = parseIni("connection = host=localhost;port=5432");
            expect(map.get("connection")).toBe("host=localhost;port=5432");
        });
    });
});
