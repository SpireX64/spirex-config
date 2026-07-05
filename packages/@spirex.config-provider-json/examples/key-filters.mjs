/**
 * Filter sections with whitelist / blacklist.
 *
 * Demonstrate prefix-based inclusion and exclusion of config keys.
 * Blacklist takes priority when both filters are combined.
 *
 *   cd packages/@spirex.config-provider-json && node examples/key-filters.mjs
 */

import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "../src/index.js";

// ── Whitelist: only load "db" and "app" sections ──
const whitelisted = configBuilder()
    .add(new JsonConfigProvider("./config.json", { whitelist: ["db", "app"] }))
    .build();

console.log("Whitelist [db, app]:");
console.log("  db:host =", whitelisted.getString("db:host", "MISSING"));
console.log("  app:name =", whitelisted.getString("app:name", "MISSING"));
console.log("  log:level =", whitelisted.getString("log:level", "MISSING"));

// ── Blacklist: exclude credentials ──
const blacklisted = configBuilder()
    .add(
        new JsonConfigProvider("./config.json", {
            blacklist: ["db:password", "secrets"],
        }),
    )
    .build();

console.log("\nBlacklist [db:password, secrets]:");
console.log("  db:host =", blacklisted.getString("db:host", "MISSING"));
console.log("  db:password =", blacklisted.getString("db:password", "MISSING"));

// ── Combined: blacklist takes priority ──
const combined = configBuilder()
    .add(
        new JsonConfigProvider("./config.json", {
            whitelist: ["db", "app"],
            blacklist: ["db:password"],
        }),
    )
    .build();

console.log("\nCombined whitelist + blacklist:");
console.log("  db:host =", combined.getString("db:host", "MISSING"));
console.log("  db:password =", combined.getString("db:password", "MISSING"));
console.log("  app:name =", combined.getString("app:name", "MISSING"));
