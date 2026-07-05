import { describe, test, expect, afterEach, beforeEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { YamlConfigProvider } from "./index.js";

var tmpDir = path.resolve(process.cwd(), ".tmp-test-yaml");

var writeYaml = function (name, content) {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    var filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
};

var cleanup = function () {
    if (fs.existsSync(tmpDir))
        fs.rmSync(tmpDir, { recursive: true, force: true });
};

describe("YamlConfigProvider", function () {
    beforeEach(cleanup);
    afterEach(cleanup);

    describe("file loading", function () {
        test("loads and reads values from YAML file", function () {
            var file = writeYaml("simple.yaml", 'name: MyApp\nversion: "1.0"');
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("name")).toBe("MyApp");
            expect(provider.get("version")).toBe("1.0");
        });

        test("returns undefined for missing keys", function () {
            var file = writeYaml("simple.yaml", "x: y");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("nonexistent")).toBeUndefined();
        });

        test("returns undefined when get() called before load()", function () {
            var file = writeYaml("simple.yaml", "x: y");
            var provider = new YamlConfigProvider(file);
            expect(provider.get("x")).toBeUndefined();
        });

        test("throws when file does not exist", function () {
            var provider = new YamlConfigProvider(
                "/nonexistent/path/config.yaml",
            );
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("throws when YAML is malformed", function () {
            var file = writeYaml("bad.yaml", "{ bad: yaml: here }");
            var provider = new YamlConfigProvider(file);
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("noThrow option", function () {
        test("noThrow: true silently skips missing file", function () {
            var provider = new YamlConfigProvider("/nonexistent/config.yaml", {
                noThrow: true,
            });
            expect(function () {
                provider.load();
            }).not.toThrow();
            expect(provider.get("anything")).toBeUndefined();
        });

        test("noThrow: true with existing file loads normally", function () {
            var file = writeYaml("exists.yaml", "key: val");
            var provider = new YamlConfigProvider(file, { noThrow: true });
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("noThrow: false throws on missing file (default)", function () {
            var provider = new YamlConfigProvider("/nonexistent/config.yaml");
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("noThrow defaults to false when option is omitted", function () {
            var provider = new YamlConfigProvider("/nonexistent/config.yaml");
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("whitelist filtering", function () {
        test("only includes keys with matching prefixes", function () {
            var file = writeYaml(
                "whitelist.yaml",
                "db:\n  host: localhost\n  port: 5432\n" +
                    "app:\n  name: MyApp\n" +
                    "log:\n  level: info",
            );
            var provider = new YamlConfigProvider(file, {
                whitelist: ["db", "app"],
            });
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:port")).toBe("5432");
            expect(provider.get("app:name")).toBe("MyApp");
            expect(provider.get("log:level")).toBeUndefined();
        });

        test("empty whitelist includes all keys", function () {
            var file = writeYaml("emptywl.yaml", "a: 1\nb: 2");
            var provider = new YamlConfigProvider(file, { whitelist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("blacklist filtering", function () {
        test("excludes keys with matching prefixes", function () {
            var file = writeYaml(
                "blacklist.yaml",
                "db:\n  host: localhost\n  password: secret\n" +
                    "app:\n  name: MyApp",
            );
            var provider = new YamlConfigProvider(file, { blacklist: ["db"] });
            provider.load();
            expect(provider.get("db:host")).toBeUndefined();
            expect(provider.get("db:password")).toBeUndefined();
            expect(provider.get("app:name")).toBe("MyApp");
        });

        test("empty blacklist excludes nothing", function () {
            var file = writeYaml("emptybl.yaml", "a: 1\nb: 2");
            var provider = new YamlConfigProvider(file, { blacklist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("combined whitelist + blacklist", function () {
        test("blacklist takes priority over whitelist", function () {
            var file = writeYaml(
                "combo.yaml",
                "db:\n  host: localhost\n  password: secret\n" +
                    "app:\n  name: MyApp",
            );
            var provider = new YamlConfigProvider(file, {
                whitelist: ["db", "app"],
                blacklist: ["db:password"],
            });
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:password")).toBeUndefined();
            expect(provider.get("app:name")).toBe("MyApp");
        });
    });

    describe("file path resolution", function () {
        test("resolves relative paths against process.cwd()", function () {
            var file = writeYaml("rel.yaml", "key: val");
            var relPath = path.relative(process.cwd(), file);
            var provider = new YamlConfigProvider(relPath);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("accepts absolute paths as-is", function () {
            var file = writeYaml("abs.yaml", "key: val");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("accepts .yml extension", function () {
            var file = writeYaml("config.yml", "key: val");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });
    });

    describe("watch mode", function () {
        test("sets up watcher when watch: true on first load()", function () {
            var file = writeYaml("watched.yaml", "key: initial");
            var provider = new YamlConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
        });

        test("unwatch() stops the watcher", function () {
            var file = writeYaml("watched2.yaml", "key: val");
            var provider = new YamlConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
            expect(provider._watcher).toBeNull();
        });

        test("unwatch() is safe to call when no watcher is active", function () {
            var file = writeYaml("watched3.yaml", "key: val");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(function () {
                provider.unwatch();
            }).not.toThrow();
        });

        test("reloading updates values from changed file", function () {
            var file = writeYaml("reload.yaml", "key: before");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key: after", "utf-8");
            provider.load();
            expect(provider.get("key")).toBe("after");
        });

        test("_onFileChanged calls _scheduleReload", function () {
            var file = writeYaml("onchanged.yaml", "key: val");
            var provider = new YamlConfigProvider(file);
            provider.load();

            var reloadSpy = vi.spyOn(provider, "_scheduleReload");
            provider._onFileChanged();
            expect(reloadSpy).toHaveBeenCalled();

            reloadSpy.mockRestore();
        });

        test("watcher callback fires on file change", function (done) {
            var file = writeYaml("watchcb.yaml", "key: before");
            var provider = new YamlConfigProvider(file, { watch: true });
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key: after", "utf-8");

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
            var file = writeYaml("sched.yaml", "key: before");
            var provider = new YamlConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key: after", "utf-8");
            provider._scheduleReload();

            expect(provider.get("key")).toBe("before");

            vi.advanceTimersByTime(150);
            expect(provider.get("key")).toBe("after");

            vi.useRealTimers();
        });

        test("unwatch clears debounce timeout", function () {
            var file = writeYaml("debounce.yaml", "key: val");
            var provider = new YamlConfigProvider(file, { watch: true });
            provider.load();

            provider._debounce = setTimeout(function () {}, 10000);
            provider.unwatch();
            expect(provider._debounce).toBeNull();
        });
    });
});
