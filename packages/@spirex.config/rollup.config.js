import { getPackageRollup } from "../../rollup.plugins.mjs";

const release = process.env.NODE_ENV === "production";

export default [
    getPackageRollup({ umdName: "Config", release }),
    getPackageRollup({ umdName: "InMemoryConfig", name: "in-memory", entry: "in-memory.js", release }),
].flat();
