const path = require("path");

module.exports = {
  webpack: {
    alias: {
      // "@" pointe vers le dossier src/
      // Exemple : import MonCompo from "@/components/shared/MonCompo"
      "@": path.resolve(__dirname, "src"),
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PROXY DEV SERVER
  // Quand React tourne sur :3000, les appels vers /api/* sont redirigés vers
  // Django sur :8000. Ça fonctionne en local ET sur GitHub Codespaces.
  // ──────────────────────────────────────────────────────────────────────────
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,   // obligatoire pour Codespaces / environnement distant
        secure: false,        // autorise le HTTP en dev
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
