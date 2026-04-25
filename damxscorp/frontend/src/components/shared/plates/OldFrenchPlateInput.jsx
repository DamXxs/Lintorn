// /frontend/src/components/OldFrenchPlateInput.jsx
// 🆕 NOUVEAU FICHIER
// Gère les deux formats de plaques pré-SIV françaises :
// Format A : 1234 AB 75  (4 chiffres + 2 lettres + 2 chiffres dept)
// Format B : 123 ABC 75  (3 chiffres + 3 lettres + 2 chiffres dept)

import { useState, useEffect } from "react";
import "./OldFrenchPlateInput.css";

const OldFrenchPlateInput = ({ value = "", onChange, error }) => {

  // On stocke la valeur brute affichée dans le champ (avec espaces)
  const [displayValue, setDisplayValue] = useState("");

  // Si une valeur externe arrive (ex: édition d'un véhicule existant),
  // on l'affiche directement
  useEffect(() => {
    if (value && value !== displayValue) {
      setDisplayValue(value);
    }
  }, [value]);

  // ─── Détection du format selon ce qui est tapé ───────────────────────────
  // Retourne "A", "B", ou null si pas encore déterminable
  const detectFormat = (raw) => {
    // On retire tous les espaces pour analyser les caractères bruts
    const clean = raw.replace(/\s/g, "").toUpperCase();

    // Format A : commence par 4 chiffres → 1234 AB 75
    if (/^\d{4}/.test(clean)) return "A";

    // Format B : commence par 1 à 3 chiffres puis des lettres → 123 ABC 75
    if (/^\d{1,3}[A-Z]/.test(clean)) return "B";

    return null; // Pas encore déterminable
  };

  // ─── Formatage automatique selon le format détecté ───────────────────────
  const formatPlate = (raw) => {
    // On garde uniquement lettres et chiffres, en majuscules
    const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const format = detectFormat(clean);

    if (format === "A") {
      // Format A : 1234 AB 75
      // Découpage : [0-3] chiffres | [4-5] lettres | [6-7] chiffres dept
      const part1 = clean.slice(0, 4);           // "1234"
      const part2 = clean.slice(4, 6);           // "AB"
      const part3 = clean.slice(6, 8);           // "75"

      // On assemble avec des espaces uniquement si la partie suivante existe
      let result = part1;
      if (part2) result += " " + part2;
      if (part3) result += " " + part3;
      return result;
    }

    if (format === "B") {
      // Format B : 123 ABC 75
      // Découpage : on récupère d'abord les chiffres du début
      const chiffresDebut = clean.match(/^\d+/)?.[0] || "";
      const reste = clean.slice(chiffresDebut.length);

      const part1 = chiffresDebut.slice(0, 3);   // "123"
      const part2 = reste.slice(0, 3);            // "ABC"
      const part3 = reste.slice(3, 5);            // "75"

      let result = part1;
      if (part2) result += " " + part2;
      if (part3) result += " " + part3;
      return result;
    }

    // Format pas encore détecté, on retourne juste les caractères propres
    return clean;
  };

  // ─── Validation de la plaque complète ────────────────────────────────────
  const validatePlate = (formatted) => {
    // Format A complet : "1234 AB 75"
    const regexA = /^\d{4} [A-Z]{2} \d{2,3}$/;
    // Format B complet : "123 ABC 75"
    const regexB = /^\d{1,3} [A-Z]{3} \d{2,3}$/;
    return regexA.test(formatted) || regexB.test(formatted);
  };

  // ─── Gestion de la saisie ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const rawInput = e.target.value;

    // Si l'utilisateur efface, on laisse faire sans reformater
    if (rawInput.length < displayValue.length) {
      setDisplayValue(rawInput);
      // On remonte la valeur brute au parent
      onChange({ target: { value: rawInput } });
      return;
    }

    // Sinon on formate
    const formatted = formatPlate(rawInput);
    setDisplayValue(formatted);

    // On remonte la valeur formatée au composant parent
    onChange({ target: { value: formatted } });
  };

  // ─── Affichage ────────────────────────────────────────────────────────────
  const isValid = validatePlate(displayValue);
  const showValid = displayValue.length > 5 && isValid;
  const showError = displayValue.length > 5 && !isValid;

  return (
    <div className="old-plate-input">
      {/* Label discret qui indique le format détecté */}
      <div className="old-plate-input__format-hint">
        {detectFormat(displayValue.replace(/\s/g, "")) === "A" && (
          <span className="old-plate-input__hint">Format : 1234 AB 75</span>
        )}
        {detectFormat(displayValue.replace(/\s/g, "")) === "B" && (
          <span className="old-plate-input__hint">Format : 123 ABC 75</span>
        )}
        {!detectFormat(displayValue.replace(/\s/g, "")) && displayValue.length > 0 && (
          <span className="old-plate-input__hint old-plate-input__hint--neutral">
            Tapez pour détecter le format...
          </span>
        )}
      </div>

      <div className={`old-plate-input__wrapper ${showValid ? "old-plate-input__wrapper--valid" : ""} ${showError || error ? "old-plate-input__wrapper--error" : ""}`}>
        {/* Drapeau français décoratif - comme FrenchPlateInput */}
        <span className="old-plate-input__flag">🇫🇷</span>

        <input
          type="text"
          className="old-plate-input__field"
          value={displayValue}
          onChange={handleChange}
          placeholder="123 ABC 75"
          maxLength={11} // Max : "1234 AB 75" = 10 chars
          autoComplete="off"
          spellCheck={false}
        />

        {/* Indicateur visuel de validité */}
        {showValid && <span className="old-plate-input__check">✓</span>}
      </div>

      {/* Message d'erreur */}
      {(showError || error) && (
        <span className="old-plate-input__error">
          {error || "Format invalide (ex: 1234 AB 75 ou 123 ABC 75)"}
        </span>
      )}
    </div>
  );
};

export default OldFrenchPlateInput;