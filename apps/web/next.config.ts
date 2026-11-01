import type { NextConfig } from "next";

const config: NextConfig = {
  // Os pacotes do monorepo são TypeScript puro; o Next compila direto do código-fonte.
  transpilePackages: ["@financas/core", "@financas/ui"],
};

export default config;
