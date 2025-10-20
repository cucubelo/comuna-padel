import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpila paquetes de Supabase para que Turbopack sirva correctamente sus fuentes y evite peticiones 404 a /_next/src/*
  transpilePackages: ["@supabase/supabase-js", "@supabase/ssr"],
  
  // Configuración específica para Turbopack
  experimental: {
    turbo: {
      // Configurar resolvers para evitar 404s en rutas dinámicas
      resolveAlias: {
        // Evitar que Turbopack trate de resolver archivos internos
        '@supabase/supabase-js/src': '@supabase/supabase-js',
        '@supabase/ssr/src': '@supabase/ssr',
      },
    },
  },
  
  // Configuración de webpack para fallback en caso de no usar Turbopack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configurar alias para evitar resolución de archivos internos
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/supabase-js/src': '@supabase/supabase-js',
        '@supabase/ssr/src': '@supabase/ssr',
      };
    }
    return config;
  },
};

export default nextConfig;
