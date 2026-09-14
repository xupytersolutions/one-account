import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 6 default output (node_modules/.prisma + @prisma/client) is Vercel-safe.
  // No custom outputFileTracingIncludes needed - next handles @prisma/client automatically.
  // Keep serverExternalPackages so Turbopack doesn't bundle native .so.node bindings.
  serverExternalPackages: ["@prisma/client", "prisma"],
  transpilePackages: ["@repo/ui", "@repo/shared"],
  turbopack: {},
  images: {}
};

export default nextConfig;
