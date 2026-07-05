import { getPackageRollup } from "../../rollup.plugins.mjs";

const release = process.env.NODE_ENV === "production";

export default [
    ...getPackageRollup({ umdName: "YamlConfigProvider", release }),
    ...getPackageRollup({
        name: "yaml-reader",
        entry: "yaml-reader.js",
        release,
    }),
];
