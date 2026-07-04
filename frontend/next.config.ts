import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // Proxy all /api/* calls to the FastAPI backend
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Proxy Swagger UI docs
      {
        source: "/docs",
        destination: `${BACKEND_URL}/docs`,
      },
      {
        source: "/openapi.json",
        destination: `${BACKEND_URL}/openapi.json`,
      },
      // Proxy redoc
      {
        source: "/redoc",
        destination: `${BACKEND_URL}/redoc`,
      },
    ];
  },
};

export default nextConfig;
