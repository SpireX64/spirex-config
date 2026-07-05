import { describe, test, expect, afterEach, beforeEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { IniConfigProvider } from "./index.js";

var tmpDir = path.resolve(process.cwd(), ".tmp-test-ini");

var writeIni = function (name, content) {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    var filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
};

var cleanup = function () {
    if (fs.existsSync(tmpDir))
        fs.rmSync(tmpDir, { recursive: true, force: true });
};

describe("IniConfigProvider", function () {
    beforeEach(cleanup);
    afterEach(cleanup);

    describe("file loading", function () {
        test("loads and reads values from INI file", function () {
            var file = writeIni("simple.ini", "name=MyApp\nversion=1.0");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(provider.get("name")).toBe("MyApp");
            expect(provider.get("version")).toBe("1.0");
        });

        test("returns undefined for missing keys", function () {
            var file = writeIni("simple.ini", "x=y");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(provider.get("nonexistent")).toBeUndefined();
        });

        test("returns undefined when get() called before load()", function () {
            var file = writeIni("simple.ini", "x=y");
            var provider = new IniConfigProvider(file);
            expect(provider.get("x")).toBeUndefined();
        });

        test("throws when file does not exist", function () {
            var provider = new IniConfigProvider(
                "/nonexistent/path/config.ini",
            );
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("throws when file does not exist and noThrow: false", function () {
            var provider = new IniConfigProvider(
                "/nonexistent/path/config.ini",
            );
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("noThrow option", function () {
        test("noThrow: true silently skips missing file", function () {
            var provider = new IniConfigProvider("/nonexistent/config.ini", {
                noThrow: true,
            });
            expect(function () {
                provider.load();
            }).not.toThrow();
            expect(provider.get("anything")).toBeUndefined();
        });

        test("noThrow: true with existing file loads normally", function () {
            var file = writeIni("exists.ini", "key=val");
            var provider = new IniConfigProvider(file, { noThrow: true });
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("noThrow: false throws on missing file (default)", function () {
            var provider = new IniConfigProvider("/nonexistent/config.ini");
            expect(function () {
                provider.load();
            }).toThrow(/not found/);
        });

        test("noThrow defaults to false when option is omitted", function () {
            var provider = new IniConfigProvider("/nonexistent/config.ini");
            expect(function () {
                provider.load();
            }).toThrow();
        });
    });

    describe("whitelist filtering", function () {
        test("only includes keys with matching prefixes", function () {
            var file = writeIni(
                "whitelist.ini",
                "[db]\nhost=localhost\nport=5432\n" +
                    "[app]\nname=MyApp\n" +
                    "[log]\nlevel=info",
            );
            var provider = new IniConfigProvider(file, {
                whitelist: ["db", "app"],
            });
            provider.load();
            expect(provider.get("db:host")).toBe("localhost");
            expect(provider.get("db:port")).toBe("5432");
            expect(provider.get("app:name")).toBe("MyApp");
            expect(provider.get("log:level")).toBeUndefined();
        });

        test("empty whitelist includes all keys", function () {
            var file = writeIni("emptywl.ini", "a=1\nb=2");
            var provider = new IniConfigProvider(file, { whitelist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("blacklist filtering", function () {
        test("excludes keys with matching prefixes", function () {
            var file = writeIni(
                "blacklist.ini",
                "[db]\nhost=localhost\npassword=secret\n" + "[app]\nname=MyApp",
            );
            var provider = new IniConfigProvider(file, { blacklist: ["db"] });
            provider.load();
            expect(provider.get("db:host")).toBeUndefined();
            expect(provider.get("db:password")).toBeUndefined();
            expect(provider.get("app:name")).toBe("MyApp");
        });

        test("empty blacklist excludes nothing", function () {
            var file = writeIni("emptybl.ini", "a=1\nb=2");
            var provider = new IniConfigProvider(file, { blacklist: [] });
            provider.load();
            expect(provider.get("a")).toBe("1");
            expect(provider.get("b")).toBe("2");
        });
    });

    describe("combined whitelist + blacklist", function () {
        test("blacklist takes priority over whitelist", function () {
            var file = writeIni(
                "combo.ini",
                "[db]\nhost=localhost\npassword=secret\n" + "[app]\nname=MyApp",
            );
            var provider = new IniConfigProvider(file, {
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
            var file = writeIni("rel.ini", "key=val");
            var relPath = path.relative(process.cwd(), file);
            var provider = new IniConfigProvider(relPath);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });

        test("accepts absolute paths as-is", function () {
            var file = writeIni("abs.ini", "key=val");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("val");
        });
    });

    describe("watch mode", function () {
        test("sets up watcher when watch: true on first load()", function () {
            var file = writeIni("watched.ini", "key=initial");
            var provider = new IniConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
        });

        test("unwatch() stops the watcher", function () {
            var file = writeIni("watched2.ini", "key=val");
            var provider = new IniConfigProvider(file, { watch: true });
            provider.load();
            expect(provider._watcher).not.toBeNull();
            provider.unwatch();
            expect(provider._watcher).toBeNull();
        });

        test("unwatch() is safe to call when no watcher is active", function () {
            var file = writeIni("watched3.ini", "key=val");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(function () {
                provider.unwatch();
            }).not.toThrow();
        });

        test("reloading updates values from changed file", function () {
            var file = writeIni("reload.ini", "key=before");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key=after", "utf-8");
            provider.load();
            expect(provider.get("key")).toBe("after");
        });

        test("watcher callback fires on file change", function (done) {
            var file = writeIni("watchcb.ini", "key=before");
            var provider = new IniConfigProvider(file, { watch: true });
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key=after", "utf-8");

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
            var file = writeIni("sched.ini", "key=before");
            var provider = new IniConfigProvider(file);
            provider.load();
            expect(provider.get("key")).toBe("before");

            fs.writeFileSync(file, "key=after", "utf-8");
            provider._scheduleReload();

            // Not yet — debounce hasn't fired
            expect(provider.get("key")).toBe("before");

            vi.advanceTimersByTime(150);
            expect(provider.get("key")).toBe("after");

            vi.useRealTimers();
        });

        test("unwatch clears debounce timeout", function () {
            var file = writeIni("debounce.ini", "key=val");
            var provider = new IniConfigProvider(file, { watch: true });
            provider.load();

            provider._debounce = setTimeout(function () {}, 10000);
            provider.unwatch();
            expect(provider._debounce).toBeNull();
        });
    });
});
