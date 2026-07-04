import { getPackageRollup } from "../../rollup.plugins.mjs";

export default getPackageRollup({
    umdName: "EnvConfigProvider",
    release: process.env.NODE_ENV === "production",
});
