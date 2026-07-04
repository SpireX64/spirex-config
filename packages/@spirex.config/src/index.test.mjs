import { describe, test, expect, vi } from "vitest";
import { configBuilder, InMemoryConfigProvider } from "./index";

function mockProvider(get) {
    return {
        load: vi.fn(),
        get: vi.fn(get),
    };
}

describe("@spirex/config", () => {
    describe("Builder", () => {
        test("Create config builder", () => {
            // Act ----------
            var builder = configBuilder();

            // Assert -------
            expect(builder).instanceOf(Object);
            expect(builder.providers).instanceOf(Array);
            expect(builder.providers).toHaveLength(0);
        });

        test("Add config provider", () => {
            // Arrange -----
            var builder = configBuilder();
            var provider = mockProvider();

            // Act ---------
            var chainRef = builder.add(provider);

            // Assert ------
            expect(chainRef).toBe(builder);
            expect(builder.providers).toContain(provider);
            expect(provider.load).not.toHaveBeenCalled();
            expect(provider.get).not.toHaveBeenCalled();
        });

        test("Build config", () => {
            // Arrange -----
            var provider = mockProvider();
            var builder = configBuilder().add(provider);

            // Act ---------
            var config = builder.build();

            // Assert ------
            expect(config).toBeInstanceOf(Object);
            expect(provider.load).toHaveBeenCalledOnce();
            expect(provider.get).not.toHaveBeenCalled();
        });
    });

    describe("Configuration", () => {
        test("Get not provided value", () => {
            // Arrange --------
            var key = "foo";
            var provider = mockProvider();
            var config = configBuilder().add(provider).build();

            // Act ------------
            var error;
            try {
                config.getString(key);
            } catch (e) {
                error = e;
            }

            // Assert ---------
            expect(error).instanceOf(Error);
            expect(error.message).toContain(key);
            expect(provider.get).toHaveBeenCalledExactlyOnceWith(key);
        });

        test("Get default value", () => {
            // Arrange --------
            var key = "foo";
            var defaultValue = 42;
            var provider = mockProvider();
            var config = configBuilder().add(provider).build();

            // Act -------------
            var value = config.getInteger(key, defaultValue);

            // Arrange ---------
            expect(provider.get).toHaveBeenCalledExactlyOnceWith(key);
            expect(value).eq(defaultValue);
        });

        test("Get default value via getter", () => {
            // Arrange --------
            var key = "foo";
            var defaultValue = 42;
            var defaultValueGetter = vi.fn(() => defaultValue);
            var provider = mockProvider();
            var config = configBuilder().add(provider).build();

            // Act -------------
            var value = config.getInteger(key, defaultValueGetter);

            // Arrange ---------
            expect(provider.get).toHaveBeenCalledExactlyOnceWith(key);
            expect(defaultValueGetter).toHaveBeenCalledOnce();
            expect(value).eq(defaultValue);
        });

        test("Get integer value", () => {
            // Arrange -------
            var key = "foo";
            var providedValue = "123";
            var expectedValue = 123;

            var provider = mockProvider(() => providedValue);
            var config = configBuilder().add(provider).build();

            // Act -----------
            var value = config.getInteger(providedValue);

            // Assert --------
            expect(Number.isInteger(value)).is.true;
            expect(value).eq(expectedValue);
        });

        test("Get float value", () => {
            // Arrange -------
            var key = "foo";
            var providedValue = "3.14";
            var expectedValue = 3.14;

            var provider = mockProvider(() => providedValue);
            var config = configBuilder().add(provider).build();

            // Act -----------
            var value = config.getFloat(providedValue);

            // Assert --------
            expect(Number.isInteger(value)).is.false;
            expect(value).eq(expectedValue);
        });

        test.each([
            ["true", true],
            ["TRUE", true],
            ["yes", true],
            ["Y", true],
            ["1", true],
            ["0", false],
            ["F", false],
            ["", false],
            ["No", false],
        ])("Get boolean value (%s)", (providedValue, expected) => {
            // Arrange --------
            var key = "foo";
            var provider = mockProvider(() => providedValue);
            var config = configBuilder().add(provider).build();

            // Act ------------
            var value = config.getBoolean(key);

            // Assert ---------
            // expect(value).instanceOf(Boolean);
            expect(value).eq(expected);
        });

        test("Get string value", () => {
            // Arrange --------
            var key = "foo";
            var expectedValue = "bar";
            var provider = mockProvider(() => expectedValue);
            var config = configBuilder().add(provider).build();

            // Act ------------
            var value = config.getString(key);

            // Assert ---------
            expect(value).eq(expectedValue);
        });
    });

    describe("Section", () => {
        test("Get config section", () => {
            // Arrange -------
            var sectionPath = "foo";
            var provider = mockProvider();
            var config = configBuilder().add(provider).build();

            // Act -----------
            var section = config.section(sectionPath);

            // Assert --------
            expect(section.path).eq(sectionPath);
        });

        test("Get config sub-section", () => {
            // Arrange -------
            var sectionPath = "foo";
            var subSectionPath = "bar";
            var provider = mockProvider();
            var config = configBuilder().add(provider).build();
            var section = config.section(sectionPath);

            // Act -----------
            var subSection = section.section(subSectionPath);

            // Assert --------
            expect(subSection.path).eq(`${sectionPath}:${subSectionPath}`);
        });

        test("Get value via config section", () => {
            // Arrange -------
            var sectionPath = "foo";
            var key = "bar";
            var provider = mockProvider(() => "test");
            var config = configBuilder().add(provider).build();
            var section = config.section(sectionPath);

            // Act -----------
            var value = section.getString(key);

            // Assert --------
            expect(provider.get).toHaveBeenCalledExactlyOnceWith(
                `${sectionPath}:${key}`,
            );
        });
    });
});
