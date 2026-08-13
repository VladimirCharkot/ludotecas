import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // El admin de Tina es un SPA estático que se compila en public/admin.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }]
  },
}

export default nextConfig
