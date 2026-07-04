export interface IConfigProvider {
    get(key: string): string | undefined;
    load(): void;
}

export type TDefValue<T> = T | (() => T);

export interface IConfig {
    section(path: string): IConfigSection;
    getString(key: string, def: TDefValue<string>): string;
    getInteger(key: string, def: TDefValue<number>): number;
    getFloat(key: string, def: TDefValue<number>): number;
    getBoolean(key: string, def: TDefValue<boolean>): boolean;
}

export interface IConfigSection extends IConfig {
    readonly path: string;
}

export interface IConfigBuilder {
    get providers(): IConfigProvider[];
    add(provider: IConfigProvider): this;
    build(): IConfig;
}

export class InMemoryConfigProvider implements IConfigProvider {
    public constructor();
    public constructor(map: ReadonlyMap<string, string>);
    public constructor(record: Readonly<Record<string, string>>);
    public constructor(entries: readonly [string, string][]);

    get(key: string): string | undefined;
    load(): void;

    set(key: string, value: string): void;
}

export function configBuilder(): IConfigBuilder;
