import { getPackageRollup } from "../../rollup.plugins.mjs";

export default getPackageRollup({
    umdName: "Config",
    release: process.env.NODE_ENV === "production",
});
