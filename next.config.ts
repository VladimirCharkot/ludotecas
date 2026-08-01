import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // El admin de Tina es un SPA estático que se compila en public/admin.
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      // Los módulos de la sala de escape son HTML plano servido desde public/.
      {
        source: "/sala-de-escape/cables",
        destination: "/sala-de-escape/cables/index.html",
      },
    ]
  },
}

export default nextConfig
