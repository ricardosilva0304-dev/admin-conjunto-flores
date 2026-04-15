import type { NextConfig } from "next";

const securityHeaders = [
  // Evita que la app se cargue dentro de un <iframe> (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },

  // El navegador no intenta adivinar el Content-Type (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Solo envía el origen en el Referer, nunca la URL completa
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Deshabilita funciones del navegador que la app no necesita
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // Fuerza HTTPS por 1 año (actívalo solo cuando tengas SSL en producción)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },

  // Content-Security-Policy: restringe de dónde puede cargar recursos la app.
  // 'unsafe-inline' es necesario por Tailwind CSS en dev. En producción puedes
  // usar nonces o hashes para eliminarlo.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: el propio origen + inline (Tailwind/Next) + Supabase Realtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      // Estilos: el propio origen + inline (Tailwind)
      "style-src 'self' 'unsafe-inline'",
      // Imágenes: el propio origen + data URIs (logos inline)
      "img-src 'self' data: blob:",
      // Fuentes: el propio origen
      "font-src 'self'",
      // Conexiones de red: Supabase (API + Realtime WebSocket)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Frames: ninguno
      "frame-src 'none'",
      // Workers: el propio origen (Next.js)
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;