#!/usr/bin/env python3
"""
audit.py — Contrôle de santé du projet Matorn.

Lance les outils d'analyse déjà installés, ajoute un contrôle maison
(la doc ment-elle sur le code ?) et écrit un rapport RÉGÉNÉRÉ.

    python matorn/tools/audit.py            # tout
    python matorn/tools/audit.py --rapide   # sans pip-audit ni vulture (les 2 lents)
    python matorn/tools/audit.py --doc      # uniquement le contrôle de doc

PRINCIPE — le rapport est un FAIT SUR LE CODE, pas une mémoire :
il est ÉCRASÉ à chaque exécution, jamais fusionné, jamais trié. Un fait sur le
code périme dès que le code change, et il se recalcule en 10 secondes : on ne
le stocke donc nulle part ailleurs qu'ici.

Aucune dépendance : stdlib uniquement.
"""

from __future__ import annotations

import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# CHEMINS — déduits de l'emplacement du script (matorn/tools/audit.py)
# ─────────────────────────────────────────────────────────────────────────────
TOOLS = Path(__file__).resolve().parent
RACINE = TOOLS.parents[1]              # le dépôt git
BACKEND = TOOLS.parent / "backend"
FRONTEND = TOOLS.parent / "frontend"
RAPPORT = TOOLS / "rapport_audit.md"

# Le venv n'est pas au même endroit sous Windows et sous Linux (Codespaces).
_win = BACKEND / "venv" / "Scripts" / "python.exe"
_nix = BACKEND / "venv" / "bin" / "python"
PYTHON = str(_win if _win.exists() else _nix if _nix.exists() else sys.executable)
NPX = "npx.cmd" if sys.platform == "win32" else "npx"

# Dossiers qu'on ne parcourt jamais (volumineux ou générés)
IGNORES = {"node_modules", "venv", ".git", "__pycache__", "dist", "build", ".vite"}

# Documents dont on vérifie qu'ils ne mentent pas.
# La mémoire de Claude vit HORS du dépôt → chemin optionnel, ignoré s'il n'existe pas.
DOCS = [
    RACINE / "CLAUDE.md",
    RACINE / "ARCHITECTURE.md",
    RACINE / "audit_structurel.md",
    Path.home() / ".claude" / "projects"
    / "C--Users-MagiFamilly-Documents-Matorn" / "memory" / "MEMORY.md",
]

# Racines depuis lesquelles un chemin cité dans la doc peut être relatif.
RACINES_RESOLUTION = [RACINE, TOOLS.parent, BACKEND, FRONTEND, FRONTEND / "src"]

EXTENSIONS = (".py", ".ts", ".tsx", ".js", ".jsx", ".css", ".json",
              ".md", ".toml", ".ini", ".cfg", ".html")

# ─────────────────────────────────────────────────────────────────────────────
# TRADUCTION DES CODES RUFF
# ─────────────────────────────────────────────────────────────────────────────
# Ruff ne parle qu'anglais et ne sera jamais traduit (choix de ses auteurs).
# On le fait donc ici : chaque code devient une phrase qui dit LE PROBLÈME et,
# quand c'est utile, POURQUOI c'en est un. Un code inconnu garde son texte
# d'origine — on ne perd jamais d'information.
TRADUCTIONS = {
    # — pyflakes : les vraies erreurs de logique —
    "F401": "Import inutilisé : ce module est importé mais jamais utilisé. La ligne peut sauter.",
    "F811": "Déjà défini plus haut : ce nom est importé ou défini deux fois. La 1re version ne sert à rien.",
    "F841": "Variable créée puis jamais utilisée : soit c'est un oubli, soit c'est du code mort.",
    "F821": "Nom inconnu : ce nom n'est défini nulle part. Faute de frappe ou import manquant.",

    # — pycodestyle : mise en forme qui compte —
    "E402": "Import placé au milieu du fichier au lieu du début. Souvent le signe d'un ajout fait à la va-vite.",
    "E501": "Ligne trop longue (plus de 120 caractères) : illisible sans faire défiler.",
    "E722": "`except:` tout nu : attrape TOUTES les erreurs, même Ctrl+C. Toujours préciser laquelle.",
    "E741": "Nom de variable ambigu : `l`, `I` et `O` se confondent avec 1 et 0 à l'écran.",

    # — bugbear : les pièges classiques —
    "B904": ("Erreur relancée sans `from` : on perd la trace de l'erreur d'origine. "
             "Écrire `raise MonErreur(...) from err` (ou `from None` si on veut la masquer exprès)."),
    "B006": ("Valeur par défaut modifiable (`[]` ou `{}`) : elle est créée UNE fois et PARTAGÉE "
             "entre tous les appels. Un ajout dans le 1er appel se retrouve dans le suivant."),
    "B008": "Appel de fonction dans une valeur par défaut : exécuté une seule fois, au chargement du module.",

    # — flake8-django : les pièges propres à Django —
    "DJ001": ("`null=True` sur un champ texte : ça crée DEUX sortes de vide (NULL en base et "
              "la chaîne vide \"\"). Django recommande `blank=True` seul → un seul vide possible."),
    "DJ008": "Modèle sans `__str__` : il s'affichera « Objet (3) » dans l'admin au lieu de son nom.",
    "DJ012": "Ordre des blocs du modèle : champs d'abord, puis `Meta`, puis `__str__`, puis les méthodes.",
}


# ─────────────────────────────────────────────────────────────────────────────
# EXÉCUTION D'UN OUTIL EXTERNE
# ─────────────────────────────────────────────────────────────────────────────
class Resultat:
    """Issue d'un contrôle : un statut, un résumé court, un détail complet."""

    def __init__(self, titre: str, statut: str, resume: str, detail: str = "", bloquant: bool = True):
        self.titre = titre
        self.statut = statut          # "OK" | "ALERTE" | "INDISPONIBLE"
        self.resume = resume
        self.detail = detail.strip()
        self.bloquant = bloquant


def lancer(titre: str, commande: list[str], cwd: Path, bloquant: bool = True) -> Resultat:
    """Lance un outil et transforme son code de sortie en Resultat."""
    try:
        proc = subprocess.run(
            commande, cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=600,
        )
    except FileNotFoundError:
        return Resultat(titre, "INDISPONIBLE", f"outil introuvable : {commande[0]}", bloquant=False)
    except subprocess.TimeoutExpired:
        return Resultat(titre, "INDISPONIBLE", "délai dépassé (10 min)", bloquant=False)

    sortie = (proc.stdout + proc.stderr).strip()
    if proc.returncode == 0:
        return Resultat(titre, "OK", "rien à signaler", sortie, bloquant)

    lignes = [ligne for ligne in sortie.splitlines() if ligne.strip()]
    return Resultat(titre, "ALERTE", f"{len(lignes)} ligne(s) de sortie", sortie, bloquant)


# ─────────────────────────────────────────────────────────────────────────────
# RUFF, MAIS EN FRANÇAIS
# ─────────────────────────────────────────────────────────────────────────────
# Sortie brute de ruff (format "concise") :
#   accounts\views.py:7:1: F811 redefinition of unused 'x' from line 4
# Ce qu'on en fait :
#   accounts/views.py:7   F811  Déjà défini plus haut : ...
LIGNE_RUFF = re.compile(r"^(?P<fichier>.+?):(?P<ligne>\d+):\d+:\s+(?P<code>[A-Z]+\d+)\s+(?P<message>.*)$")


def controle_ruff() -> Resultat:
    resultat = lancer(
        "Ruff (lint backend)",
        [PYTHON, "-m", "ruff", "check", ".", "--output-format", "concise"],
        BACKEND,
    )
    if resultat.statut != "ALERTE":
        return resultat

    traduites: list[str] = []
    compteur: dict[str, int] = {}
    for ligne in resultat.detail.splitlines():
        trouve = LIGNE_RUFF.match(ligne.strip())
        if not trouve:
            continue
        code = trouve["code"]
        compteur[code] = compteur.get(code, 0) + 1
        # Code non traduit → on garde l'anglais plutôt que de perdre l'info
        explication = TRADUCTIONS.get(code, trouve["message"])
        fichier = trouve["fichier"].replace("\\", "/")
        traduites.append(f"{fichier}:{trouve['ligne']}\n    {code} — {explication}")

    if not traduites:
        return resultat   # format inattendu : on rend la sortie brute

    # Résumé en tête : combien de chaque sorte, du plus fréquent au moins fréquent
    entete = ["RESUME PAR TYPE :"]
    for code, nb in sorted(compteur.items(), key=lambda x: -x[1]):
        entete.append(f"  {nb:>3} x {code} — {TRADUCTIONS.get(code, '(non traduit)')}")
    entete.append("")
    entete.append("DETAIL :")

    resultat.detail = "\n".join(entete + traduites)
    resultat.resume = f"{len(traduites)} alerte(s) reelle(s)"
    return resultat


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON — la doc dit-elle encore la vérité ?
# ─────────────────────────────────────────────────────────────────────────────
# Le code a ruff, tsc et manage.py check pour se surveiller. La doc, elle, n'a
# RIEN : c'est comme ça que `CLAUDE.md` a pu affirmer pendant des semaines que
# `api.ts` était en JavaScript ou parler de `ThemeContext.jsx`. Ici on extrait
# tout ce qui ressemble à un chemin dans les `backticks` et on vérifie que ça
# existe encore.

_INDEX_NOMS: set[str] = set()   # tous les noms de fichiers du dépôt (rempli au 1er appel)


def indexer_fichiers() -> set[str]:
    """Parcourt le dépôt une fois et retient chaque nom de fichier."""
    noms: set[str] = set()
    for chemin in RACINE.rglob("*"):
        if any(partie in IGNORES for partie in chemin.parts):
            continue
        if chemin.is_file():
            noms.add(chemin.name)
    return noms


def est_un_chemin(token: str) -> bool:
    """Trie les `backticks` : garde ce qui ressemble à un fichier, jette le code."""
    if not token or len(token) > 120:
        return False
    # Du code, pas un chemin : `tsc --noEmit`, `Facture.emettre()`, `var(--bg)`…
    if any(c in token for c in " ()<>|$*\"'{}[]=,;`"):
        return False
    # Routes d'API (`/api/archives/`), URL, chemins tronqués (`.../debloquer`)
    if token.startswith(("/", "http", "@", "-", ".venv")) or "..." in token:
        return False
    # Une extension citée toute seule (« en `.tsx` obligatoirement ») n'est pas un fichier
    if token.startswith(".") and "/" not in token:
        return False
    return "/" in token or token.endswith(EXTENSIONS)


def existe(token: str) -> bool:
    """Le chemin cité correspond-il à quelque chose de réel ?"""
    # `factures/models.py:17-34` → on coupe le numéro de ligne
    token = re.sub(r":\d+(-\d+)?$", "", token)

    # Un import TS s'écrit sans extension (`utils/dataFormatters`) → on les essaie
    candidats = [token]
    if not token.endswith(EXTENSIONS):
        candidats += [token + ext for ext in (".ts", ".tsx", ".js", ".jsx", ".py")]

    for candidat in candidats:
        if "/" in candidat:
            if any((racine / candidat).exists() for racine in RACINES_RESOLUTION):
                return True
        else:
            if candidat in _INDEX_NOMS:
                return True
    return False


def verifier_docs() -> Resultat:
    global _INDEX_NOMS
    _INDEX_NOMS = indexer_fichiers()

    certains: list[str] = []      # cité AVEC extension et absent → la doc ment
    incertains: list[str] = []    # sans extension → peut être une tournure de phrase
    verifies = 0

    for doc in DOCS:
        if not doc.exists():
            continue
        texte = doc.read_text(encoding="utf-8", errors="replace")
        # On ignore les blocs ``` (exemples de code) : seuls les `inline` comptent
        texte = re.sub(r"```.*?```", "", texte, flags=re.DOTALL)

        deja_vus: set[str] = set()
        for token in re.findall(r"`([^`\n]+)`", texte):
            token = token.strip().rstrip("/").removeprefix("./")
            if not est_un_chemin(token) or token in deja_vus:
                continue
            deja_vus.add(token)
            verifies += 1
            if existe(token):
                continue
            ligne = f"{doc.name} -> `{token}`"
            # Une extension explicite = une affirmation vérifiable. Sans extension,
            # ça peut être du texte (« la fonction generer_numero_facture/devis »)
            # → consultatif, on ne bloque pas dessus.
            (certains if re.search(r"\.\w{2,4}(:\d|$)", token) else incertains).append(ligne)

    resume = f"{verifies} chemin(s) cite(s), {len(certains)} introuvable(s)"
    if incertains:
        resume += f", {len(incertains)} a verifier"
    if not certains and not incertains:
        return Resultat("Doc vs code", "OK", resume)

    detail = ""
    if certains:
        detail += "INTROUVABLES (la doc ment) :\n" + "\n".join(f"- {x}" for x in sorted(set(certains)))
    if incertains:
        detail += "\n\nA VERIFIER (peut etre une tournure de phrase) :\n"
        detail += "\n".join(f"- {x}" for x in sorted(set(incertains)))

    statut = "ALERTE" if certains else "OK"
    return Resultat("Doc vs code", statut, resume, detail, bloquant=bool(certains))


# ─────────────────────────────────────────────────────────────────────────────
# LA LISTE DES CONTRÔLES
# ─────────────────────────────────────────────────────────────────────────────
def controles(rapide: bool) -> list[Resultat]:
    resultats = [
        # — Bloquants : si ça casse, on ne commite pas —
        controle_ruff(),
        lancer("Django check", [PYTHON, "manage.py", "check"], BACKEND),
        lancer("Migrations manquantes",
               [PYTHON, "manage.py", "makemigrations", "--check", "--dry-run"], BACKEND),
        lancer("TypeScript (tsc --noEmit)", [NPX, "tsc", "--noEmit"], FRONTEND),
        verifier_docs(),

        # — Informatif : normal en dev, doit être vert le jour de la prod —
        # --fail-level WARNING : sans ça, `check --deploy` sort en 0 malgré ses
        # avertissements de sécurité → le contrôle passerait au vert pour rien.
        lancer("Django check --deploy",
               [PYTHON, "manage.py", "check", "--deploy", "--fail-level", "WARNING"],
               BACKEND, bloquant=False),
    ]

    if not rapide:
        resultats += [
            # — Consultatif : beaucoup de faux positifs, on NE SUPPRIME JAMAIS
            #   sur la seule foi de vulture (une app Django n'est parfois citée
            #   que dans INSTALLED_APPS, un composant qu'en import paresseux) —
            lancer("Code mort (vulture, consultatif)",
                   [PYTHON, "-m", "vulture", ".", "--min-confidence", "80",
                    "--exclude", "venv,migrations"], BACKEND, bloquant=False),
            lancer("Failles connues (pip-audit)",
                   [PYTHON, "-m", "pip_audit", "--progress-spinner", "off"],
                   BACKEND, bloquant=False),
        ]
    return resultats


# ─────────────────────────────────────────────────────────────────────────────
# RAPPORT
# ─────────────────────────────────────────────────────────────────────────────
MARQUEUR = {"OK": "[ OK ]", "ALERTE": "[ !! ]", "INDISPONIBLE": "[ -- ]"}


def ecrire_rapport(resultats: list[Resultat]) -> None:
    horodatage = datetime.now().strftime("%d/%m/%Y %H:%M")
    lignes = [
        "# Rapport d'audit — Matorn",
        "",
        f"> Généré le {horodatage} par `matorn/tools/audit.py`.",
        "> **Fichier régénéré à chaque exécution — ne rien y écrire à la main.**",
        "",
        "| Contrôle | Statut | Résumé |",
        "|---|---|---|",
    ]
    for r in resultats:
        lignes.append(f"| {r.titre} | {MARQUEUR[r.statut]} | {r.resume} |")

    for r in resultats:
        if r.statut == "OK" or not r.detail:
            continue
        lignes += ["", f"## {r.titre}", "", "```", r.detail[:12000], "```"]

    RAPPORT.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def main() -> int:
    args = sys.argv[1:]
    if "--doc" in args:
        resultats = [verifier_docs()]
    else:
        resultats = controles(rapide="--rapide" in args)

    ecrire_rapport(resultats)

    # Console volontairement en ASCII : la sortie est parfois lue par un shell
    # qui n'encode pas l'UTF-8 (le rapport, lui, garde les accents).
    print("\n=== AUDIT MATORN ===")
    for r in resultats:
        print(f"{MARQUEUR[r.statut]} {r.titre:<32} {r.resume}")

    echecs = [r for r in resultats if r.statut == "ALERTE" and r.bloquant]
    print(f"\nRapport complet : {RAPPORT.relative_to(RACINE).as_posix()}")
    if echecs:
        print(f"{len(echecs)} controle(s) bloquant(s) en alerte.")
        return 1
    print("Tous les controles bloquants sont au vert.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
