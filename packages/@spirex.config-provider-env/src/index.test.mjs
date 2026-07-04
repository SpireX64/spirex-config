import { describe, test, expect, afterEach } from "vitest";
import { EnvConfigProvider } from "./index.js";

const PREFIX = "SPX_";

describe("EnvConfigProvider", () => {
    describe("no prefix, no stripPrefix", () => {
        afterEach(() => {
            delete process.env.SPX__CASE;
            delete process.env.SPX__EMPTY;
        });

        test("loads all environment variables", () => {
            // Arrange
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("PATH")).toBe(process.env.PATH);
        });

        test("returns undefined for a key that does not exist", () => {
            // Arrange
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("nonexistent_key_999")).toBeUndefined();
        });

        test("throws when get() is called before load()", () => {
            // Arrange
            const provider = new EnvConfigProvider();

            // Act & Assert
            expect(() => provider.get("anything")).toThrow(TypeError);
        });

        test("get() is case-insensitive", () => {
            // Arrange
            process.env.SPX__CASE = "value";
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("SPX:CASE")).toBe("value");
            expect(provider.get("spx:case")).toBe("value");
        });

        test("preserves empty string values", () => {
            // Arrange
            process.env.SPX__EMPTY = "";
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("SPX:EMPTY")).toBe("");
        });
    });

    describe("section mapping", () => {
        afterEach(() => {
            delete process.env.SPX_DB__HOST;
            delete process.env.SPX_A__B__C;
            delete process.env.SPX_FLAT;
        });

        test("replaces __ with : in config keys", () => {
            // Arrange
            process.env.SPX_DB__HOST = "db.local";
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_db:host")).toBe("db.local");
        });

        test("multiple __ segments produce nested sections", () => {
            // Arrange
            process.env.SPX_A__B__C = "deep";
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_a:b:c")).toBe("deep");
        });

        test("keys without __ remain flat", () => {
            // Arrange
            process.env.SPX_FLAT = "flat";
            const provider = new EnvConfigProvider();

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_flat")).toBe("flat");
        });
    });

    describe("prefix, stripPrefix left as default", () => {
        afterEach(() => {
            delete process.env.SPX_HOST;
            delete process.env.SPX_PORT;
            delete process.env.SPX_DB__HOST;
            delete process.env.NOISE_VAL;
        });

        test("filters to keys starting with the prefix", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            process.env.SPX_PORT = "3000";
            process.env.NOISE_VAL = "ignored";
            const provider = new EnvConfigProvider(PREFIX);

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_host")).toBe("localhost");
            expect(provider.get("spx_port")).toBe("3000");
        });

        test("excludes keys without the prefix", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            process.env.NOISE_VAL = "ignored";
            const provider = new EnvConfigProvider(PREFIX);

            // Act
            provider.load();

            // Assert
            expect(provider.get("noise_val")).toBeUndefined();
            expect(provider.get("PATH")).toBeUndefined();
        });

        test("returns undefined for unknown keys with the prefix", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            const provider = new EnvConfigProvider(PREFIX);

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_missing")).toBeUndefined();
        });

        test("throws when no env vars match the prefix", () => {
            // Arrange
            const provider = new EnvConfigProvider(PREFIX);

            // Act
            provider.load();

            // Assert
            expect(() => provider.get("PATH")).toThrow(TypeError);
        });

        test("preserves prefix on section keys", () => {
            // Arrange
            process.env.SPX_DB__HOST = "db.local";
            const provider = new EnvConfigProvider(PREFIX);

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_db:host")).toBe("db.local");
        });
    });

    describe("prefix + stripPrefix=false (explicit)", () => {
        afterEach(() => {
            delete process.env.SPX_HOST;
        });

        test("keeps prefix when stripPrefix is explicitly false", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            const provider = new EnvConfigProvider(PREFIX, false);

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_host")).toBe("localhost");
            expect(provider.get("host")).toBeUndefined();
        });
    });

    describe("prefix + stripPrefix=true", () => {
        afterEach(() => {
            delete process.env.SPX_HOST;
            delete process.env.SPX_PORT;
            delete process.env.SPX_DB__HOST;
            delete process.env.SPX_A__B__C;
            delete process.env.NOISE_VAL;
        });

        test("stores keys without the prefix", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act
            provider.load();

            // Assert
            expect(provider.get("host")).toBe("localhost");
            expect(provider.get("spx_host")).toBeUndefined();
        });

        test("strips prefix then applies section mapping", () => {
            // Arrange
            process.env.SPX_DB__HOST = "db.local";
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act
            provider.load();

            // Assert
            expect(provider.get("db:host")).toBe("db.local");
        });

        test("multiple stripped keys are all accessible", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            process.env.SPX_PORT = "3000";
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act
            provider.load();

            // Assert
            expect(provider.get("host")).toBe("localhost");
            expect(provider.get("port")).toBe("3000");
        });

        test("nested sections after prefix strip", () => {
            // Arrange
            process.env.SPX_A__B__C = "deep";
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act
            provider.load();

            // Assert
            expect(provider.get("a:b:c")).toBe("deep");
        });
    });

    describe("stripPrefix=true without prefix", () => {
        afterEach(() => {
            delete process.env.SPX_HOST;
        });

        test("does not strip anything when prefix is undefined", () => {
            // Arrange
            process.env.SPX_HOST = "localhost";
            const provider = new EnvConfigProvider(undefined, true);

            // Act
            provider.load();

            // Assert
            expect(provider.get("spx_host")).toBe("localhost");
        });
    });

    describe("empty-string prefix", () => {
        test("behaves the same as no prefix", () => {
            // Arrange
            const provider = new EnvConfigProvider("");

            // Act
            provider.load();

            // Assert
            expect(provider.get("PATH")).toBe(process.env.PATH);
        });
    });

    describe("load() called multiple times", () => {
        afterEach(() => {
            delete process.env.SPX_A;
            delete process.env.SPX_B;
            delete process.env.SPX_A__SUB;
        });

        test("picks up newly added vars on reload", () => {
            // Arrange
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act — first load
            process.env.SPX_A = "alpha";
            provider.load();

            // Assert
            expect(provider.get("a")).toBe("alpha");

            // Act — second load
            process.env.SPX_B = "beta";
            provider.load();

            // Assert
            expect(provider.get("b")).toBe("beta");
        });

        test("keeps stale cache when all matching vars are removed", () => {
            // Arrange
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act — first load
            process.env.SPX_A = "alpha";
            provider.load();

            // Assert
            expect(provider.get("a")).toBe("alpha");

            // Act — remove var, load again
            delete process.env.SPX_A;
            provider.load();

            // Assert — old value survives because empty key set skips cache rebuild
            expect(provider.get("a")).toBe("alpha");
        });

        test("updates changed values on reload", () => {
            // Arrange
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act — first load
            process.env.SPX_A = "v1";
            provider.load();

            // Assert
            expect(provider.get("a")).toBe("v1");

            // Act — change value, reload
            process.env.SPX_A = "v2";
            provider.load();

            // Assert
            expect(provider.get("a")).toBe("v2");
        });

        test("rebuilds section keys on reload", () => {
            // Arrange
            const provider = new EnvConfigProvider(PREFIX, true);

            // Act — first load
            process.env.SPX_A__SUB = "sub1";
            provider.load();

            // Assert
            expect(provider.get("a:sub")).toBe("sub1");

            // Act — change value, reload
            process.env.SPX_A__SUB = "sub2";
            provider.load();

            // Assert
            expect(provider.get("a:sub")).toBe("sub2");
        });
    });
});
