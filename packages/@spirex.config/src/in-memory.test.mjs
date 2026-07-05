import { describe, test, expect } from "vitest";
import { InMemoryConfigProvider } from "./in-memory";

describe("InMemoryConfigProvider", () => {
    describe("Create in-memory provider", () => {
        test("Empty", () => {
            // Act ----------
            var provider = new InMemoryConfigProvider();
            provider.load();

            // Assert -------
            expect(provider.get("any")).toBeUndefined();
        });

        test("Get before load returns undefined", () => {
            // Act ----------
            var provider = new InMemoryConfigProvider();

            // Assert -------
            expect(provider.get("any")).toBeUndefined();
        });

        test("From object", () => {
            // Arrange -------
            var source = { foo: "bar" };

            // Act -----------
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert --------
            expect(provider.get("foo")).eq("bar");
        });

        test("From map", () => {
            // Arrange -------
            var sourceMap = new Map();
            sourceMap.set("foo", "bar");

            // Act -----------
            var provider = new InMemoryConfigProvider(sourceMap);
            provider.load();

            // Assert --------
            expect(provider.get("foo")).eq("bar");
        });

        test("From object entries", () => {
            // Arrange -------
            var entries = [["foo", "bar"]];

            // Act -----------
            var provider = new InMemoryConfigProvider(entries);
            provider.load();

            // Assert --------
            expect(provider.get("foo")).eq("bar");
        });

        test("From array with non-entry elements", () => {
            // Arrange
            var mixed = ["notAnEntry", ["foo", "bar"]];

            // Act
            var provider = new InMemoryConfigProvider(mixed);
            provider.load();

            // Assert
            expect(provider.get("foo")).eq("bar");
        });
    });

    describe("Set value", () => {
        test("When provider is empty", () => {
            // Arrange ---------
            var provider = new InMemoryConfigProvider();
            provider.load();

            // Act ------------
            provider.set("foo", "bar");

            // Assert ---------
            expect(provider.get("foo")).eq("bar");
        });

        test("Override exist value", () => {
            // Arrange -------
            var provider = new InMemoryConfigProvider({
                foo: "bar",
            });
            provider.load();

            // Act -----------
            provider.set("foo", "qwe");

            // Assert --------
            expect(provider.get("foo")).eq("qwe");
        });

        test("Set before load initializes cache", () => {
            // Arrange ---------
            var provider = new InMemoryConfigProvider();

            // Act ------------
            provider.set("foo", "bar");

            // Assert ---------
            expect(provider.get("foo")).eq("bar");
        });

        test("Set null value is skipped", () => {
            // Arrange ---------
            var provider = new InMemoryConfigProvider();
            provider.load();
            provider.set("foo", "bar");

            // Act ------------
            provider.set("foo", null);

            // Assert ---------
            expect(provider.get("foo")).eq("bar");
        });

        test("Set undefined value is skipped", () => {
            // Arrange ---------
            var provider = new InMemoryConfigProvider();
            provider.load();
            provider.set("foo", "bar");

            // Act ------------
            provider.set("foo", undefined);

            // Assert ---------
            expect(provider.get("foo")).eq("bar");
        });

        test("Set empty array produces no entries", () => {
            // Arrange ---------
            var provider = new InMemoryConfigProvider();
            provider.load();

            // Act ------------
            provider.set("foo", []);

            // Assert ---------
            expect(provider.get("foo")).toBeUndefined();
        });
    });

    describe("Nested structure", () => {
        test("Deeply nested object in constructor", () => {
            // Arrange
            var source = { foo: { bar: { qwe: "hello" } } };

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("foo:bar:qwe")).eq("hello");
            expect(provider.get("foo")).toBeUndefined();
            expect(provider.get("foo:bar")).toBeUndefined();
        });

        test("Mixed shallow and nested object", () => {
            // Arrange
            var source = {
                app: "MyApp",
                db: { host: "localhost", port: "5432" },
            };

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("app")).eq("MyApp");
            expect(provider.get("db:host")).eq("localhost");
            expect(provider.get("db:port")).eq("5432");
        });

        test("Nested object via set", () => {
            // Arrange
            var provider = new InMemoryConfigProvider();
            provider.load();

            // Act
            provider.set("foo", { bar: { qwe: "hello" } });

            // Assert
            expect(provider.get("foo:bar:qwe")).eq("hello");
        });

        test("Null values are skipped", () => {
            // Arrange
            var source = { foo: { bar: null, qwe: "hello" } };

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("foo:bar")).toBeUndefined();
            expect(provider.get("foo:qwe")).eq("hello");
        });

        test("Empty nested object produces no entries", () => {
            // Arrange
            var source = { foo: { bar: {} } };

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("foo:bar")).toBeUndefined();
            expect(provider.get("foo")).toBeUndefined();
        });

        test("Arrays are stored as leaf values", () => {
            // Arrange
            var source = { foo: { list: ["a", "b", "c"] } };

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("foo:list")).toEqual(["a", "b", "c"]);
        });

        test("Nested object inside Map source", () => {
            // Arrange
            var source = new Map([
                ["foo", { bar: { qwe: "hello" } }],
            ]);

            // Act
            var provider = new InMemoryConfigProvider(source);
            provider.load();

            // Assert
            expect(provider.get("foo:bar:qwe")).eq("hello");
        });
    });

    describe("Object.entries deep structure", () => {
        test("Deeply nested entries in constructor", () => {
            // Arrange
            var entries = [
                ["foo", [
                    ["bar", [
                        ["qwe", 42],
                    ]],
                ]],
            ];

            // Act
            var provider = new InMemoryConfigProvider(entries);
            provider.load();

            // Assert
            expect(provider.get("foo:bar:qwe")).eq(42);
            expect(provider.get("foo")).toBeUndefined();
            expect(provider.get("foo:bar")).toBeUndefined();
        });

        test("Mixed shallow and nested entries", () => {
            // Arrange
            var entries = [
                ["app", "MyApp"],
                ["db", [
                    ["host", "localhost"],
                    ["port", "5432"],
                ]],
            ];

            // Act
            var provider = new InMemoryConfigProvider(entries);
            provider.load();

            // Assert
            expect(provider.get("app")).eq("MyApp");
            expect(provider.get("db:host")).eq("localhost");
            expect(provider.get("db:port")).eq("5432");
        });

        test("Deep entries via set", () => {
            // Arrange
            var provider = new InMemoryConfigProvider();
            provider.load();

            // Act
            provider.set("foo", [
                ["bar", [
                    ["qwe", "hello"],
                ]],
            ]);

            // Assert
            expect(provider.get("foo:bar:qwe")).eq("hello");
        });

        test("Leaf arrays are preserved (not treated as entries)", () => {
            // Arrange
            var entries = [["items", ["a", "b", "c"]]];

            // Act
            var provider = new InMemoryConfigProvider(entries);
            provider.load();

            // Assert
            expect(provider.get("items")).toEqual(["a", "b", "c"]);
        });

        test("Empty nested entries produce no entries", () => {
            // Arrange
            var entries = [["foo", []]];

            // Act
            var provider = new InMemoryConfigProvider(entries);
            provider.load();

            // Assert
            expect(provider.get("foo")).toBeUndefined();
        });
    });
});
