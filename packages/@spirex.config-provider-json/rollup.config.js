import { getPackageRollup } from "../../rollup.plugins.mjs";

export default getPackageRollup({
    umdName: "JsonConfigProvider",
    release: process.env.NODE_ENV === "production",
});
