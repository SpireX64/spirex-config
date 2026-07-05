/**
 * Read app metadata from package.json.
 *
 * Loads the project's own package.json and extracts common fields
 * through the @spirex/config typed API. Nested keys like
 * `repository.url` are flattened automatically.
 *
 *   cd packages/@spirex.config-provider-json && node examples/from-package-json.mjs
 */

import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "../src/index.js";

const config = configBuilder()
    .add(new JsonConfigProvider("./package.json"))
    .build();

const appName = config.getString("name");
const appVersion = config.getString("version");
const isPrivate = config.getBoolean("private", false);
const repoUrl = config.getString("repository:url", "n/a");

console.log(`${appName}@${appVersion}`);
console.log(`  private : ${isPrivate}`);
console.log(`  repo    : ${repoUrl}`);
