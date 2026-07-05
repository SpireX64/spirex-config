/**
 * Watch a JSON file for live changes.
 *
 * When watch: true, the provider uses fs.watch to monitor the file
 * and automatically reloads on modification. Call unwatch() to stop.
 *
 *   cd packages/@spirex.config-provider-json && node examples/watch-file.mjs
 */

import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "../src/index.js";

const provider = new JsonConfigProvider("./config.json", { watch: true });

const config = configBuilder().add(provider).build();

let host = config.getString("db:host");

console.log("Initial value:", host);
console.log("Edit config.json and changes will be picked up automatically.");
console.log("Press Ctrl+C to exit.\n");

// Print value every 2 seconds to observe live reloads
const timer = setInterval(() => {
    const current = config.getString("db:host");
    if (current !== host) {
        host = current;
        console.log(`[${new Date().toISOString()}] db:host changed → ${host}`);
    }
}, 2000);

// Cleanup on exit
process.on("SIGINT", () => {
    clearInterval(timer);
    provider.unwatch();
    console.log("\nShut down.");
    process.exit(0);
});
