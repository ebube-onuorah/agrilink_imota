import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project (a stray lockfile in a
  // parent directory otherwise confuses root inference on this machine).
  turbopack: { root: projectRoot },
  // PGlite ships a WASM binary; keep it external so the bundler doesn't inline
  // it. Harmless when the Neon driver is used in production.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
