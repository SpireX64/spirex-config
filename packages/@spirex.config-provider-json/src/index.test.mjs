import { describe, test, expect, afterEach, beforeEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { JsonConfigProvider } from "./index.js";

var tmpDir = path.resolve(process.cwd(), ".tmp-test-json");

var writeJson = function (name, obj) {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    var filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, JSON.stringify(obj), "utf-8");
    return filePath;
};

var cleanup = function () {
    if (fs.existsSync(tmpDir))
        fs.rmSync(tmpDir, { recursive: true, force: true });
};

describe("JsonConfigProvider", function () {
    beforeEach(cleanup);
    afterEach(cleanup);

    describe("file loading", function () {
        test("loads and reads string values", function () {
            var file = writeJson("strings.json", {
                name: "MyApp",
                version: "1.0",
            });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("name")).toBe("MyApp");
            expect(provider.get("version")).toBe("1.0");
        });

        test("reads integer values as strings", function () {
            var file = writeJson("nums.json", { port: 5432, count: 42 });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("port")).toBe("5432");
            expect(provider.get("count")).toBe("42");
        });

        test("reads boolean values as strings", function () {
            var file = writeJson("bools.json", { debug: true, enabled: false });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("debug")).toBe("true");
            expect(provider.get("enabled")).toBe("false");
        });

        test("reads array values as stringified arrays", function () {
            var file = writeJson("arrays.json", { items: [1, 2, 3] });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("items")).toBe("1,2,3");
        });

        test("top-level JSON array produces empty cache", function () {
            var filePath = path.join(tmpDir, "toparr.json");
            fs.mkdirSync(tmpDir, { recursive: true });
            fs.writeFileSync(filePath, "[1, 2, 3]", "utf-8");
            var provider = new JsonConfigProvider(filePath);
            provider.load();
            expect(provider.get("anything")).toBeUndefined();
        });

        test("skips JSON null values", function () {
            var file = writeJson("nulls.json", {
                present: "val",
                missing: null,
            });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("present")).toBe("val");
            expect(provider.get("missing")).toBeUndefined();
        });

        test("reads nested objects flattened with : separator", function () {
            var file = writeJson("nested.json", {
                db: { host: "localhost", port: 5432 },
            });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:port")).toBe("5432");
        });

        test("deep nesting produces multi-level keys", function () {
            var file = writeJson("deep.json", { a: { b: { c: "d" } } });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("a:b:c")).toBe("d");
        });

        test("empty object produces empty cache, no crash", function () {
            var file = writeJson("empty.json", {});
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("anything")).toBeUndefined();
        });

        test("returns undefined for missing keys", function () {
            var file = writeJson("simple.json", { x: "y" });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("nonexistent")).toBeUndefined();
        });

        test("returns undefined when get() called before load()", function () {
            var file = writeJson("simple.json", { x: "y" });
            var provider = new JsonConfigProvider(file);
            expect(provider.get("x")).toBeUndefined();
        });

        test("throws when file does not exist", function () {
            var provider = new JsonConfigProvider(
                "/nonexistent/path/config.json",
            );
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("throws when JSON is malformed", function () {
            var filePath = path.join(tmpDir, "bad.json");
            fs.mkdirSync(tmpDir, { recursive: true });
            fs.writeFileSync(filePath, "{ bad json }", "utf-8");
            var provider = new JsonConfigProvider(filePath);
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("flat vs hierarchical priority", function () {
        test("flat key overrides hierarchical key", function () {
            var file = writeJson("priority.json", {
                "db": { host: "nested" },
                "db:host": "flat",
            });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("db:host")).toBe("flat");
        });

        test("both forms coexist when keys do not overlap", function () {
            var file = writeJson("mix.json", {
                "db": { host: "nested", port: 5432 },
                "app:name": "MyApp",
            });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("db:host")).toBe("nested");
            expect(provider.get("db:port")).toBe("5432");
            expect(provider.get("app:name")).toBe("MyApp");
        });
    });

    describe("whitelist filtering", function () {
        test("only includes keys with matching prefixes", function () {
            var file = writeJson("whitelist.json", {
                db: { host: "localhost", port: 5432 },
                app: { name: "MyApp" },
                log: { level: "info" },
            });
            var provider = new JsonConfigProvider(file, {
                whitelist: ["db", "app"],
            });
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:port")).toBe("5432");
            expect(provider.get("app:name")).toBe("MyApp");
            expect(provider.get("log:level")).toBeUndefined();
        });

        test("empty whitelist includes all keys", function () {
            var file = writeJson("emptywl.json", { a: 1, b: 2 });
            var provider = new JsonConfigProvider(file, { whitelist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("blacklist filtering", function () {
        test("excludes keys with matching prefixes", function () {
            var file = writeJson("blacklist.json", {
                db: { host: "localhost", password: "secret" },
                app: { name: "MyApp" },
            });
            var provider = new JsonConfigProvider(file, { blacklist: ["db"] });
            provider.load();
            expect(provider.get("db:host")).toBeUndefined();
            expect(provider.get("db:password")).toBeUndefined();
            expect(provider.get("app:name")).toBe("MyApp");
        });

        test("empty blacklist excludes nothing", function () {
            var file = writeJson("emptybl.json", { a: 1, b: 2 });
            var provider = new JsonConfigProvider(file, { blacklist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("combined whitelist + blacklist", function () {
        test("blacklist takes priority over whitelist", function () {
            var file = writeJson("combo.json", {
                db: { host: "localhost", password: "secret" },
                app: { name: "MyApp" },
            });
            var provider = new JsonConfigProvider(file, {
                whitelist: ["db", "app"],
                blacklist: ["db:password"],
            });
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:password")).toBeUndefined();
            expect(provider.get("app:name")).toBe("MyApp");
        });
    });

    describe("noThrow option", function () {
        test("noThrow: true silently skips missing file", function () {
            var provider = new JsonConfigProvider("/nonexistent/config.json", {
                noThrow: true,
            });
            expect(function () {
                provider.load();
            }).not.toThrow();
            expect(provider.get("anything")).toBeUndefined();
        });

        test("noThrow: true with existing file loads normally", function () {
            var file = writeJson("exists.json", { key: "val" });
            var provider = new JsonConfigProvider(file, { noThrow: true });
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("noThrow: true still throws on invalid JSON", function () {
            var filePath = path.join(tmpDir, "bad.json");
            fs.mkdirSync(tmpDir, { recursive: true });
            fs.writeFileSync(filePath, "{ not json", "utf-8");
            var provider = new JsonConfigProvider(filePath, { noThrow: true });
            expect(function () {
                provider.load();
            }).toThrow();
        });

        test("noThrow: false throws on missing file (default)", function () {
            var provider = new JsonConfigProvider("/nonexistent/config.json");
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("noThrow defaults to false when option is omitted", function () {
            var provider = new JsonConfigProvider("/nonexistent/config.json");
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("file path resolution", function () {
        test("resolves relative paths against process.cwd()", function () {
            var file = writeJson("rel.json", { key: "val" });
            var relPath = path.relative(process.cwd(), file);
            var provider = new JsonConfigProvider(relPath);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("accepts absolute paths as-is", function () {
            var file = writeJson("abs.json", { key: "val" });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });
    });

    describe("watch mode", function () {
        test("sets up watcher when watch: true on first load()", function () {
            var file = writeJson("watched.json", { key: "initial" });
            var provider = new JsonConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
        });

        test("unwatch() stops the watcher", function () {
            var file = writeJson("watched2.json", { key: "val" });
            var provider = new JsonConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
            expect(provider._watcher).toBeNull();
        });

        test("unwatch() is safe to call when no watcher is active", function () {
            var file = writeJson("watched3.json", { key: "val" });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(function () {
                provider.unwatch();
            }).not.toThrow();
        });

        test("reloading updates values from changed file", function () {
            var file = writeJson("reload.json", { key: "before" });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, JSON.stringify({ key: "after" }), "utf-8");
            provider.load();
            expect(provider.get("key")).toBe("after");
        });

        test("watcher callback fires on file change", function (done) {
            var file = writeJson("watchcb.json", { key: "before" });
            var provider = new JsonConfigProvider(file, { watch: true });
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, JSON.stringify({ key: "after" }), "utf-8");

            setTimeout(function () {
                try {
                    expect(provider.get("key")).toBe("after");
                    provider.unwatch();
                    done();
                } catch (e) {
                    provider.unwatch();
                    done(e);
                }
            }, 200);
        });

        test("_scheduleReload debounces and calls load()", function () {
            vi.useFakeTimers();
            var file = writeJson("sched.json", { key: "before" });
            var provider = new JsonConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            // Change file contents, then trigger reload via _scheduleReload
            fs.writeFileSync(file, JSON.stringify({ key: "after" }), "utf-8");
            provider._scheduleReload();

            // Value should NOT have changed yet (debounce hasn't fired)
            expect(provider.get("key")).toBe("before");

            // Advance past the 100ms debounce
            vi.advanceTimersByTime(150);
            expect(provider.get("key")).toBe("after");

            vi.useRealTimers();
        });

        test("unwatch clears debounce timeout", function () {
            var file = writeJson("debounce.json", { key: "val" });
            var provider = new JsonConfigProvider(file, { watch: true });
            provider.load();

            // Simulate a pending debounce by setting it directly
            provider._debounce = setTimeout(function () {}, 10000);
            provider.unwatch();
            expect(provider._debounce).toBeNull();
        });
    });
});
