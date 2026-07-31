# /matorn/tools/config.py
"""
TON fichier de réglages. C'est ici — et seulement ici — que tu décides
quels outils tournent et ce qui est vérifié.

    ▸ Ajouter un outil        → une entrée dans COMMANDES
    ▸ Désactiver un contrôle  → False dans CONTROLES_INTERNES
    ▸ Ajouter une règle maison → une entrée dans REGLES_MAISON
    ▸ Traduire un code        → traductions.py

Aucune logique ici, que des données. Tu ne peux pas casser la mécanique en
éditant ce fichier — au pire un outil ne tourne pas.
"""

import re
import sys
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# CHEMINS — déduits de l'emplacement de ce fichier, jamais écrits en dur
# ─────────────────────────────────────────────────────────────────────────────
TOOLS = Path(__file__).resolve().parent
RACINE = TOOLS.parents[1]              # le dépôt git
BACKEND = TOOLS.parent / "backend"
FRONTEND = TOOLS.parent / "frontend"
RAPPORT = TOOLS / "rapport_LEON.md"

# Le venv n'est pas au même endroit sous Windows et sous Linux (Codespaces).
_win = BACKEND / "venv" / "Scripts" / "python.exe"
_nix = BACKEND / "venv" / "bin" / "python"
PYTHON = str(_win if _win.exists() else _nix if _nix.exists() else sys.executable)
NPX = "npx.cmd" if sys.platform == "win32" else "npx"

# Dossiers qu'on ne parcourt jamais (volumineux ou générés)
IGNORES = {"node_modules", "venv", ".git", "__pycache__", "dist", "build", ".vite"}


# ─────────────────────────────────────────────────────────────────────────────
# 1. LES OUTILS À LANCER
# ─────────────────────────────────────────────────────────────────────────────
# Chaque entrée = un programme externe.
#
#   titre       ce qui s'affiche dans le rapport
#   cmd         la commande, découpée en morceaux (pas une seule chaîne !)
#   cwd         depuis quel dossier la lancer
#   bloquant    True  = un problème ici annule le push
#               False = on informe, on ne bloque pas
#   traduction  None, ou une clé de traductions.PAR_OUTIL
#   lent        True = ignoré avec l'option --rapide (et par le hook git)
#   codes_alerte  (optionnel) les codes de sortie qui veulent dire « j'ai TROUVÉ
#               des problèmes », par opposition à « je suis en panne ».
#               ⚠️ La convention « 1 = trouvé » n'est PAS universelle :
#               vulture répond 3. Sans cette précision, l'audit croyait
#               l'outil planté alors qu'il faisait son travail (30/07/2026).
#               Défaut : (1,)
#
# POUR AJOUTER UN OUTIL : copie une entrée, change les 3 premières lignes.
COMMANDES = [
    {
        "titre": "Ruff (lint backend)",
        "cmd": [PYTHON, "-m", "ruff", "check", ".", "--output-format", "concise"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": "ruff",
        "lent": False,
    },
    {
        # `requirements.txt` dit-il la verite sur le venv ?
        # Aucun autre controle ne peut le voir : ruff, pytest et Django
        # tournent DANS le venv, donc pour eux tout est installe. Le defaut ne
        # se revele qu'au deploiement, quand il coute le plus cher.
        "titre": "Dependances vs venv",
        "cmd": [PYTHON, str(TOOLS / "dependances.py")],
        "cwd": RACINE,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "titre": "Django check",
        "cmd": [PYTHON, "manage.py", "check"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "titre": "Migrations manquantes",
        "cmd": [PYTHON, "manage.py", "makemigrations", "--check", "--dry-run"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        # Remplace l'ancien "Fixtures vs modeles" : les fixtures JSON ont
        # disparu du projet le 31/07/2026 (la demo se construit par
        # `seeddemo`). Ce controle regarde les DONNEES elles-memes : sequence
        # de numerotation continue, lignes d'OR nommees et chiffrees, totaux
        # synchronises avec leurs lignes, signatures coherentes.
        # Il attrape ce que ni ruff ni les tests ne peuvent voir : du code
        # juste qui a produit des donnees fausses.
        "titre": "Donnees vs regles metier",
        "cmd": [PYTHON, "manage.py", "verifier_donnees"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "titre": "Tests (pytest)",
        "cmd": [PYTHON, "-m", "pytest", "-q"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "titre": "TypeScript (tsc --noEmit)",
        "cmd": [NPX, "tsc", "--noEmit"],
        "cwd": FRONTEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "titre": "Django check --deploy",
        # --fail-level WARNING : sans ça la commande sort en 0 malgré ses
        # avertissements de sécurité, et le contrôle passerait au vert pour rien.
        "cmd": [PYTHON, "manage.py", "check", "--deploy", "--fail-level", "WARNING"],
        "cwd": BACKEND,
        "bloquant": False,      # normal en dev, doit être vert le jour de la prod
        "traduction": "deploy",
        "lent": False,
    },
    {
        "titre": "Code mort (vulture, consultatif)",
        # ⚠️ Beaucoup de faux positifs : une app Django n'est parfois citée que
        # dans INSTALLED_APPS, un composant qu'en import paresseux.
        # On NE SUPPRIME JAMAIS sur la seule foi de vulture.
        "cmd": [PYTHON, "-m", "vulture", ".", "--min-confidence", "80",
                "--exclude", "venv,migrations"],
        "cwd": BACKEND,
        "bloquant": False,
        "traduction": None,
        "lent": True,
        "codes_alerte": (3,),   # vulture : 3 = du code mort a été trouvé
    },
    {
        "titre": "Failles connues (pip-audit)",
        "cmd": [PYTHON, "-m", "pip_audit", "--progress-spinner", "off"],
        "cwd": BACKEND,
        "bloquant": False,
        "traduction": None,
        "lent": True,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# 2. LES CONTRÔLES MAISON (ceux qu'aucun outil du marché ne fait)
# ─────────────────────────────────────────────────────────────────────────────
# Mets False pour en désactiver un.
CONTROLES_INTERNES = {
    "doc_vs_code": True,      # les chemins cités dans la doc du dépôt existent-ils ?
    "memoire_ia": True,       # idem pour la mémoire de l'IA (consultatif)
    "regles_maison": True,    # les règles de CLAUDE.md sont-elles tenues ?
}

# Les documents du DÉPÔT dont on vérifie qu'ils ne mentent pas.
#
# ⚠️ On les CHERCHE au lieu de les nommer un par un. Le 30/07/2026, le dev a
# déplacé tous les .md dans `Notes/` : les chemins codés en dur ne pointaient
# plus sur rien, et le contrôle affichait « OK — 0 chemin vérifié ». Il ne
# vérifiait plus RIEN tout en étant vert. En scannant les dossiers, un
# rangement ne casse plus le contrôle.
DOCS_A_VERIFIER = sorted(
    {*RACINE.glob("*.md"), *(RACINE / "Notes").glob("*.md")}
)


def _dossier_memoire():
    """Retrouve le dossier mémoire de l'IA, sans écrire de chemin en dur.

    POURQUOI CETTE FONCTION plutôt qu'un chemin figé : le nom du dossier est
    dérivé du chemin absolu du projet, il contient donc le nom de session de
    l'utilisateur. L'écrire en dur reviendrait à (1) publier une information
    personnelle si l'outil est partagé, et (2) casser le contrôle sur toute
    autre machine. On cherche donc le dossier au lieu de le supposer.

    Renvoie None si rien n'est trouvé → le contrôle est simplement ignoré,
    sans jamais afficher de chemin.
    """
    base = Path.home() / ".claude" / "projects"
    if not base.is_dir():
        return None
    for dossier in sorted(base.glob("*Matorn*")):
        memoire = dossier / "memory"
        if memoire.is_dir():
            return memoire
    return None


MEMOIRE_IA = _dossier_memoire()

# Racines depuis lesquelles un chemin cité dans la doc peut être relatif.
RACINES_RESOLUTION = [RACINE, TOOLS.parent, BACKEND, FRONTEND, FRONTEND / "src"]

EXTENSIONS = (".py", ".ts", ".tsx", ".js", ".jsx", ".css", ".json",
              ".md", ".toml", ".ini", ".cfg", ".html")


# ─────────────────────────────────────────────────────────────────────────────
# 3. LES RÈGLES MAISON — celles écrites dans CLAUDE.md
# ─────────────────────────────────────────────────────────────────────────────
# Une règle qu'aucun outil ne mesure finit toujours par être contournée sans
# que personne ne s'en aperçoive.
#
#   motif     une expression régulière : ce qu'on cherche
#   exclure   des bouts de chemin où la règle ne s'applique pas
#   bloquant  True pour une règle DÉJÀ respectée (on empêche la régression)
#             False pour une dette existante (on mesure, on ne bloque pas)
REGLES_MAISON = [
    {
        "nom": "Couleurs en dur dans un CSS",
        "regle": "CLAUDE.md : uniquement des variables de thème (var(--bg)…)",
        "racine": FRONTEND / "src",
        "suffixes": (".css",),
        "motif": re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\("),
        # Exception assumée et documentée : les plaques d'immatriculation
        # reproduisent des objets réels, leurs couleurs ne suivent pas le thème.
        "exclure": ("components/shared/plates/",),
        "bloquant": False,
    },
    {
        "nom": "alert() / window.confirm() natifs",
        "regle": "Roadmap : à remplacer par des toasts maison",
        "racine": FRONTEND / "src",
        "suffixes": (".ts", ".tsx"),
        "motif": re.compile(r"\balert\(|\bwindow\.confirm\("),
        "exclure": (),
        "bloquant": False,
    },
    {
        "nom": "axios.create() hors de services/api.ts",
        "regle": "CLAUDE.md : une SEULE instance axios dans tout le projet",
        "racine": FRONTEND / "src",
        "suffixes": (".ts", ".tsx"),
        "motif": re.compile(r"axios\.create\("),
        "exclure": ("services/api.ts",),
        "bloquant": True,
    },
    {
        "nom": "SoftDeleteMixin importé depuis archives/",
        "regle": "CLAUDE.md : l'importer depuis mixins.models, jamais archives",
        "racine": BACKEND,
        "suffixes": (".py",),
        "motif": re.compile(r"from archives(\.models)? import"),
        "exclure": ("archives/",),
        "bloquant": True,
    },
]
