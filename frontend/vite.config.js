// vite.config.js
// The Stellar SDK is a Node.js library. In the browser it needs polyfills
// for Node built-ins like Buffer, crypto, stream, etc.
// vite-plugin-node-polyfills handles all of that automatically.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    // React JSX transform
    react(),

    // Polyfill every Node built-in the Stellar SDK needs
    nodePolyfills({
      // These are the ones @stellar/stellar-sdk actually uses
      include: ["buffer", "crypto", "stream", "util", "events", "path"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
});
