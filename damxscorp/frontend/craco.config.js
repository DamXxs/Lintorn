const path = require("path");

module.exports = {
  webpack: {
    alias: {
      // "@" pointe vers le dossier src/
      // Exemple : import MonCompo from "@/components/shared/MonCompo"
      "@": path.resolve(__dirname, "src"),
    },
  },
};
