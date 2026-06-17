import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Emit a minimal self-contained server bundle for Docker deployment.
  output: "standalone",
};

export default nextConfig;
