"""
Les réglages de Lintorn.

    ▸ Ajouter un outil        → une entrée dans COMMANDES
    ▸ Désactiver un contrôle  → False dans CONTROLES_INTERNES
    ▸ Ajouter une règle maison → une entrée dans REGLES_MAISON
    ▸ Traduire un code        → traductions.py

Aucune logique ici, que des données. Tu ne peux pas casser la mécanique en
éditant ce fichier — au pire un outil ne tourne pas.
"""

import os
import re
import sys
import tomllib
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# CHEMINS — le projet AUDITÉ, et non l'endroit où Lintorn est installé
# ─────────────────────────────────────────────────────────────────────────────
# ⚠️ LE RENVERSEMENT LE PLUS IMPORTANT DU FICHIER.
#
# Tant que Lintorn vivait DANS le projet qu'il auditait, il déduisait la
# racine de sa propre position : `Path(__file__).parents[1]`. Installé par
# `pip`, il vit dans `site-packages/` — cette déduction pointerait vers les
# entrailles du venv et TOUS les contrôles s'effondreraient d'un coup, en
# analysant le code d'autrui tout en paraissant fonctionner.
#
# Désormais le paquet ne sait rien du projet : le projet, c'est LÀ OÙ
# L'UTILISATEUR A LANCÉ LA COMMANDE.

# Dossiers qu'on ne parcourt jamais (volumineux ou générés).
# Déclaré en premier : la découverte ci-dessous s'en sert pour ne pas y plonger.
IGNORES = {"node_modules", "venv", ".venv", ".git", "__pycache__",
           "dist", "build", ".vite", ".tox", "site-packages", ".mypy_cache"}

# Où vit Lintorn lui-même — uniquement pour lire SES ressources (hooks/…).
PAQUET = Path(__file__).resolve().parent


def _racine_projet() -> Path:
    """Le dépôt à auditer : on remonte du dossier courant jusqu'au `.git`.

    Sans dépôt git au-dessus, on garde le dossier courant : Lintorn doit
    pouvoir servir sur un dossier non versionné (le contrôle du hook git se
    déclarera simplement indisponible, ce qui est la vérité).

    `LINTORN_RACINE` force la valeur — indispensable pour les tests, et utile
    en CI ou dans un monorepo.
    """
    force = os.environ.get("LINTORN_RACINE", "").strip()
    if force:
        return Path(force).expanduser().resolve()

    depart = Path.cwd().resolve()
    for candidat in (depart, *depart.parents):
        if (candidat / ".git").exists():
            return candidat
    return depart


RACINE = _racine_projet()


def _trouver(marqueur: str, profondeur: int = 2) -> Path | None:
    """Le dossier contenant `marqueur`, cherché depuis la racine du projet.

    On ne SUPPOSE plus `backend/` et `frontend/`, on les DÉCOUVRE : un projet
    qui range son Django à la racine, dans `api/` ou dans `apps/serveur/`
    fonctionne alors sans la moindre configuration.

    Profondeur limitée à 2 : au-delà on parcourt des arborescences entières
    pour un gain nul, et on risque de tomber sur le `package.json` d'une
    dépendance oubliée par IGNORES.
    """
    if (RACINE / marqueur).is_file():
        return RACINE
    for niveau in range(1, profondeur + 1):
        motif = "/".join(["*"] * niveau) + "/" + marqueur
        for trouve in sorted(RACINE.glob(motif)):
            if not any(part in IGNORES for part in trouve.parts):
                return trouve.parent
    return None


BACKEND = _trouver("manage.py")        # None si le projet n'est pas Django
FRONTEND = _trouver("package.json")    # None s'il n'y a pas de front JS/TS

# Tout ce que Lintorn ÉCRIT va dans ce seul dossier du projet audité — jamais
# dans le paquet installé, qui est en lecture seule et partagé entre projets.
#
# Un dossier unique plutôt que des fichiers éparpillés à la racine : ça ne
# salit pas le projet de l'utilisateur, et une seule ligne suffit dans son
# `.gitignore`. Ça règle aussi un serpent qui se mordait la queue — un
# `rapport.md` posé à la racine était ramassé par le scan de documentation,
# et Lintorn analysait alors son propre rapport.
DOSSIER_LINTORN = RACINE / ".lintorn"
RAPPORT = DOSSIER_LINTORN / "rapport.md"


def _python_du_projet() -> str:
    """Le python du projet audité, avec ses dépendances — pas celui de Lintorn.

    Un `ruff` ou un `pytest` lancé avec le python de Lintorn ne verrait aucune
    des dépendances du projet. On cherche donc son venv, à l'emplacement
    Windows comme à l'emplacement Unix, et on retombe sur le python courant
    quand il n'y en a pas.
    """
    for base in filter(None, (BACKEND, RACINE)):
        for relatif in ("venv/Scripts/python.exe", "venv/bin/python",
                        ".venv/Scripts/python.exe", ".venv/bin/python"):
            candidat = base / relatif
            if candidat.exists():
                return str(candidat)
    return sys.executable


PYTHON = _python_du_projet()
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def _prefixe(chemin: Path | None) -> str | None:
    """`/projet/api` → `"api/"`, relatif à la racine. None si hors projet."""
    if chemin is None:
        return None
    try:
        relatif = chemin.relative_to(RACINE).as_posix()
    except ValueError:
        return None
    return "" if relatif == "." else relatif + "/"


# ⚠️ LES PRÉFIXES QUI RÉCONCILIENT DEUX FAÇONS DE NOMMER UN MÊME FICHIER.
#
# git parle depuis la racine du dépôt      : `api/comptes/vues.py`
# ruff, lui, tourne DANS le backend        : `comptes/vues.py`
#
# Il faut donc pouvoir passer de l'un à l'autre — pour préfixer les liens du
# rapport, et pour reconnaître un fichier poussé dans la sortie d'un outil.
#
# Ces préfixes ont longtemps été ÉCRITS EN DUR. Conséquence chez
# quiconque n'a pas la même arborescence : les liens du rapport pointent dans le
# vide, et surtout le focus du hook pre-push ne reconnaît plus AUCUN fichier —
# il annonce alors « rien de casse dans ce que tu pousses » sans avoir rien pu
# comparer. Un faux vert au moment précis du push.
#
# Tri du PLUS LONG au plus court : `front/src/` doit être essayé avant
# `front/`, sinon le second l'emporte et laisse un `src/` parasite.
PREFIXE_BACKEND = _prefixe(BACKEND) or ""
PREFIXES_PROJET = sorted(
    {p for p in (
        _prefixe(BACKEND),
        _prefixe(FRONTEND / "src") if FRONTEND else None,
        _prefixe(FRONTEND),
    ) if p},
    key=len, reverse=True,
)

# Le hook livré DANS le paquet, et l'endroit où il s'installe dans le projet
# audité. On le pose dans le dépôt (et non dans `.git/hooks/`) pour qu'il
# suive les clones — c'est tout l'intérêt de `core.hooksPath`.
HOOKS_SOURCE = PAQUET / "hooks"
HOOKS_ATTENDU = ".lintorn/hooks"
HOOKS = RACINE / HOOKS_ATTENDU


# ─────────────────────────────────────────────────────────────────────────────
# RÉGLAGES DE MACHINE — `.lintorn/.env` (gitignoré)
# ─────────────────────────────────────────────────────────────────────────────
# Ce qui dépend de LA MACHINE, pas du projet, se règle ici. Modèle fourni :
# `.env.example`. Aucune valeur n'est obligatoire — sans .env, Lintorn se
# débrouille tout seul comme avant.
#
# Lecteur volontairement écrit à la main : Lintorn promet « aucune dépendance,
# stdlib uniquement » (voir l'en-tête de Lintorn.py). Ajouter python-dotenv pour
# 10 lignes trahirait cette promesse — et le hook pre-push doit pouvoir tourner
# avec n'importe quel python, pas seulement celui du venv backend.
def _lire_env(fichier: Path) -> dict:
    valeurs = {}
    if not fichier.is_file():
        return valeurs
    for ligne in fichier.read_text(encoding="utf-8").splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#") or "=" not in ligne:
            continue
        cle, _, valeur = ligne.partition("=")
        valeurs[cle.strip()] = valeur.strip().strip('"').strip("'")
    return valeurs


# L'environnement réel PRIME sur le fichier : on peut toujours surcharger le
# temps d'une commande sans éditer le .env.
#
# Le fichier vit dans `.lintorn/` du projet audité, et non à sa racine : un
# `.env` de racine appartient déjà au projet (Django, Vite…) et le polluer
# avec des réglages d'outillage mélangerait deux choses sans rapport.
ENV = {**_lire_env(DOSSIER_LINTORN / ".env"), **os.environ}


# ─────────────────────────────────────────────────────────────────────────────
# LA CONFIG DU PROJET AUDITÉ — `[tool.lintorn]` de son pyproject.toml
# ─────────────────────────────────────────────────────────────────────────────
# ⚠️ CE QUI APPARTIENT AU PROJET NE DOIT PAS VIVRE DANS L'OUTIL.
#
# Les règles maison, les contrôles activés, la liste blanche de vulture :
# tout cela décrit UN projet. Livré dans le paquet, ça imposait les conventions
# d'un seul projet à tous les autres, et produisait ailleurs des alertes qui ne
# voulaient rien dire.
#
# Pourquoi `pyproject.toml` plutôt qu'un `.env` : la config des contrôles doit
# être VERSIONNÉE et identique pour toute l'équipe (et pour la CI). Un `.env`
# est fait exactement pour l'inverse — ce qui ne se partage pas. Et c'est déjà
# là que ruff, pytest et mypy se configurent : un seul fichier à connaître.
ERREUR_CONFIG: str | None = None


def _charger_toml(fichier: Path) -> dict | None:
    """Le TOML, ou None si absent/illisible (l'erreur est alors signalée).

    Un TOML cassé ne fait PAS planter Lintorn : on le signale par
    `ERREUR_CONFIG` et on repart sur les défauts. Refuser de démarrer pour une
    virgule manquante priverait l'utilisateur de tous les AUTRES contrôles, au
    moment précis où il a besoin qu'on lui dise quoi réparer.
    """
    global ERREUR_CONFIG
    if not fichier.is_file():
        return None
    try:
        with fichier.open("rb") as flux:
            return tomllib.load(flux)
    except (OSError, tomllib.TOMLDecodeError) as erreur:
        nom = fichier.name
        ERREUR_CONFIG = f"{nom} illisible ({erreur}) - defauts appliques"
        return None


def _config_projet() -> dict:
    """La config du projet audité. Deux emplacements, dans cet ordre.

      1. `pyproject.toml` → section `[tool.lintorn]`
      2. `.lintorn/config.toml` → sections à la racine du fichier

    ⚠️ LE SECOND N'EST PAS UN LUXE. `pyproject.toml` est une convention
    PYTHON : un projet JavaScript, un projet Go ou un monorepo n'en a aucun à
    sa racine — le projet qui a vu naître Lintorn non plus, alors qu'il est en
    partie Django. Sans ce repli, ces projets n'auraient tout simplement
    aucune façon de se configurer.
    """
    charge = _charger_toml(RACINE / "pyproject.toml")
    if charge is not None:
        valeur = charge.get("tool", {}).get("lintorn")
        if isinstance(valeur, dict):
            return valeur

    charge = _charger_toml(DOSSIER_LINTORN / "config.toml")
    return charge if isinstance(charge, dict) else {}


PROJET = _config_projet()


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
# ── Liste blanche de vulture ─────────────────────────────────────────────────
# Noms que vulture déclare « inutilisés » alors qu'ils sont IMPOSÉS par une API :
# le framework appelle la fonction avec ces arguments, les retirer casse l'appel.
# 8 fausses alertes sur 8 le 12/08/2026 — un contrôle qui n'a que des faux
# positifs finit par ne plus être lu, donc par ne plus rien protéger.
#
# ⚠️ N'ajoute ici QUE des noms imposés de l'extérieur. Tout ce qu'on y met
# devient invisible pour toujours — la liste blanche est un angle mort choisi.
#
# Sur un projet non-Django, vide cette liste : elle n'a rien d'universel.
# Défaut : les noms imposés par Django, et UNIQUEMENT si Django est détecté.
# Sur un projet qui n'en a pas, la liste est vide — un angle mort ne se
# distribue pas « au cas où ».
_VULTURE_DEFAUT = [
    "sender",        # récepteurs de signaux Django (@receiver)
    "app_configs",   # fonctions de check système (@register)
    "model_admin",   # actions, filtres et vues de l'admin Django
] if BACKEND else []

# Surcharge complète via `vulture_ignores = [...]` dans `[tool.lintorn]`.
VULTURE_IGNORES = PROJET.get("vulture_ignores", _VULTURE_DEFAUT)

# ── Fraîcheur de l'audit complet ─────────────────────────────────────────────
# Les outils LENTS (vulture, pip-audit) ne tournent PAS en `--rapide`, donc pas
# non plus dans le hook pre-push. Sans rappel, ils peuvent ne jamais tourner :
# les 3 failles de sécurité trouvées le 12/08/2026 dormaient depuis un moment.
#
# On préfère un rappel DANS l'outil qu'une tâche planifiée : un planificateur
# qui meurt ne prévient personne (même leçon que `core.hooksPath`).
ETAT = DOSSIER_LINTORN / "etat.json"
JOURS_AUDIT_COMPLET = 30


# ─────────────────────────────────────────────────────────────────────────────
# LES OUTILS, MONTÉS SELON CE QUI EXISTE VRAIMENT
# ─────────────────────────────────────────────────────────────────────────────
# ⚠️ La liste n'est plus figée : chaque entrée n'est ajoutée que si le dossier
# qu'elle vise a été DÉTECTÉ. Sur un projet sans Django, les contrôles Django
# ne s'affichent pas du tout — plutôt que d'apparaître en échec ou, pire, en
# « INDISPONIBLE » permanent que l'utilisateur apprendrait à ignorer.
#
# POUR AJOUTER UN OUTIL : copie une entrée, change les 3 premières lignes.
COMMANDES: list[dict] = []

if BACKEND:
    COMMANDES += [
        {
            "cle": "ruff",
            "titre": "Ruff (lint Python)",
            "cmd": [PYTHON, "-m", "ruff", "check", ".", "--output-format", "concise"],
            "cwd": BACKEND,
            "bloquant": True,
            "traduction": "ruff",
            "lent": False,
        },
        {
            # `requirements.txt` dit-il la verite sur le venv ?
            # Aucun autre controle ne peut le voir : ruff, pytest et Django
            # tournent DANS le venv, donc pour eux tout est installe. Le defaut
            # ne se revele qu'au deploiement, quand il coute le plus cher.
            #
            # Lance par CHEMIN et non par `-m lintorn.dependances` : il doit
            # tourner avec le python du PROJET (celui dont on inspecte le venv),
            # or ce python-la n'a aucune raison d'avoir Lintorn installe.
            "cle": "dependances",
            "titre": "Dependances vs venv",
            "cmd": [PYTHON, str(PAQUET / "dependances.py"), str(BACKEND)],
            "cwd": RACINE,
            "bloquant": True,
            "traduction": None,
            "lent": False,
        },
    ]

COMMANDES_DJANGO = [
    {
        "cle": "django_check",
        "titre": "Django check",
        "cmd": [PYTHON, "manage.py", "check"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "cle": "migrations",
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
        "cle": "donnees_metier",
        "opt_in": True,      # ouvre la BASE DE DONNEES
        "titre": "Donnees vs regles metier",
        "cmd": [PYTHON, "manage.py", "verifier_donnees"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "cle": "tests",
        "opt_in": True,      # EXECUTE le code du projet
        "titre": "Tests (pytest)",
        "cmd": [PYTHON, "-m", "pytest", "-q"],
        "cwd": BACKEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    },
    {
        "cle": "deploy",
        "opt_in": True,      # hurle sur tout projet en dev
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
        "cle": "code_mort",
        "opt_in": True,      # beaucoup de faux positifs au premier contact
        "titre": "Code mort (vulture, consultatif)",
        # ⚠️ Beaucoup de faux positifs : une app Django n'est parfois citée que
        # dans INSTALLED_APPS, un composant qu'en import paresseux.
        # On NE SUPPRIME JAMAIS sur la seule foi de vulture.
        # `--ignore-names` reçoit VULTURE_IGNORES (juste au-dessus) : les noms
        # imposés par Django ne sont pas du code mort.
        "cmd": [PYTHON, "-m", "vulture", ".", "--min-confidence", "80",
                "--exclude", "venv,migrations",
                "--ignore-names", ",".join(VULTURE_IGNORES)],
        "cwd": BACKEND,
        "bloquant": False,
        "traduction": None,
        "lent": True,
        "codes_alerte": (3,),   # vulture : 3 = du code mort a été trouvé
    },
    {
        "cle": "failles",
        "opt_in": True,      # sort sur le RESEAU
        "titre": "Failles connues (pip-audit)",
        "cmd": [PYTHON, "-m", "pip_audit", "--progress-spinner", "off"],
        "cwd": BACKEND,
        "bloquant": False,
        "traduction": None,
        "lent": True,
    },
]

# `manage.py` a été trouvé → le projet EST un projet Django, ces contrôles ont
# donc tous un sens. Sinon aucun d'eux n'est proposé.
if BACKEND:
    COMMANDES += COMMANDES_DJANGO

# TypeScript n'est proposé que s'il y a vraiment du TypeScript : un front en
# JavaScript pur n'a pas de `tsc`, et le contrôle resterait éternellement
# « INDISPONIBLE » — un voyant qu'on apprend à ignorer, donc un voyant mort.
if FRONTEND and (FRONTEND / "tsconfig.json").is_file():
    COMMANDES.append({
        "cle": "typescript",
        "titre": "TypeScript (tsc --noEmit)",
        "cmd": [NPX, "tsc", "--noEmit"],
        "cwd": FRONTEND,
        "bloquant": True,
        "traduction": None,
        "lent": False,
    })


# ─────────────────────────────────────────────────────────────────────────────
# LE PRINCIPE DES DÉFAUTS : ne rien faire que l'utilisateur n'ait demandé
# ─────────────────────────────────────────────────────────────────────────────
# Par défaut, Lintorn NE MODIFIE RIEN, NE SORT PAS sur le réseau et N'EXÉCUTE
# PAS le code du projet. Tout ce qui franchit une de ces trois lignes porte
# `opt_in` et réclame un accord explicite.
#
# POURQUOI, alors que ces contrôles sont les plus utiles : quelqu'un qui
# découvre Lintorn le lance dans un dépôt qu'il connaît mal. Si ça déclenche
# sa suite de tests, ça peut créer des bases, écrire des fichiers, appeler des
# API. Le premier lancement doit être INCAPABLE de faire du dégât — c'est la
# condition pour qu'on ose l'essayer.
#
# Pour les activer, dans le `pyproject.toml` du projet :
#
#     [tool.lintorn.controles]
#     tests = true
#     failles = true
_actifs = PROJET.get("controles", {})
COMMANDES = [
    commande for commande in COMMANDES
    if _actifs.get(commande["cle"], not commande.get("opt_in", False))
]


# ─────────────────────────────────────────────────────────────────────────────
# 2. LES CONTRÔLES MAISON (ceux qu'aucun outil du marché ne fait)
# ─────────────────────────────────────────────────────────────────────────────
# Tous en lecture seule, donc tous actifs par défaut. Pour en couper un :
#
#     [tool.lintorn.controles]
#     memoire_ia = false
_CONTROLES_DEFAUT = {
    "doc_vs_code": True,        # les chemins cités dans la doc du dépôt existent-ils ?
    "memoire_ia": True,         # idem pour la mémoire de l'IA (consultatif)
    "fraicheur_memoire": True,  # le code cité par la mémoire a-t-il bougé depuis ? (git)
    "regles_maison": True,      # les règles maison sont-elles tenues ?
    "hook_git": True,           # le hook pre-push est-il réellement branché ?
    "audit_complet": True,      # les outils lents ont-ils tourné depuis 30 jours ?
}

_surcharges = PROJET.get("controles", {})
CONTROLES_INTERNES = {
    cle: bool(_surcharges.get(cle, defaut))
    for cle, defaut in _CONTROLES_DEFAUT.items()
}

# Les documents du DÉPÔT dont on vérifie qu'ils ne mentent pas.
#
# ⚠️ On les CHERCHE au lieu de les nommer un par un. Le 30/07/2026, le dev a
# déplacé tous les .md dans `Notes/` : les chemins codés en dur ne pointaient
# plus sur rien, et le contrôle affichait « OK — 0 chemin vérifié ». Il ne
# vérifiait plus RIEN tout en étant vert. En scannant les dossiers, un
# rangement ne casse plus le contrôle.
#
# Les emplacements sont des CONVENTIONS répandues, pas ceux d'un projet
# particulier : racine, puis les dossiers de documentation les plus courants.
DOSSIERS_DOC = ("Notes", "notes", "docs", "doc", "documentation", ".github")

DOCS_A_VERIFIER = sorted(
    {*RACINE.glob("*.md"),
     *(fichier
       for dossier in DOSSIERS_DOC
       for fichier in (RACINE / dossier).glob("**/*.md"))}
)


def _dossier_memoire():
    """Retrouve le dossier mémoire de l'IA. Renvoie (chemin | None, origine).

    POURQUOI ON CHERCHE plutôt que d'écrire un chemin figé : le nom du dossier
    est dérivé du chemin absolu du projet, il contient donc le nom de session
    de l'utilisateur. L'écrire en dur reviendrait à (1) publier une information
    personnelle si l'outil est partagé, et (2) casser le contrôle sur toute
    autre machine.

    Trois pistes, dans l'ordre :
      1. `LINTORN_MEMOIRE` dans `tools/.env` — la porte de sortie quand la
         découverte auto échoue (autre PC, dossier déplacé, chemin exotique).
         Le .env étant gitignoré, le chemin personnel ne part jamais au dépôt.
      2. `CLAUDE_CONFIG_DIR` — la variable par laquelle Claude Code lui-même
         déplace sa config ; sans elle, `~/.claude`.
      3. Le dossier du projet, cherché SANS TENIR COMPTE DE LA CASSE.
         ⚠️ Le glob est sensible à la casse sous Linux : un dossier dont le
         nom differe par une majuscule n'aurait jamais été trouvé, et le contrôle serait
         passé « INDISPONIBLE » en silence sur la machine Linux à venir.

    ⚠️ Le nom cherché est celui du DOSSIER RACINE du projet audité, et non
    plus un nom écrit en dur. Claude Code nomme ses dossiers d'après le
    chemin absolu du projet : le nom de la racine s'y retrouve donc toujours.

    Renvoie None si rien n'est trouvé → le contrôle est simplement ignoré.
    L'`origine` sert à dire à l'utilisateur QUELLE piste a servi (ou échoué),
    sans jamais afficher le chemin lui-même.
    """
    explicite = ENV.get("LINTORN_MEMOIRE", "").strip()
    if explicite:
        chemin = Path(explicite).expanduser()
        if chemin.is_dir():
            return chemin, "LINTORN_MEMOIRE (.env)"
        # Configuré MAIS faux : le pire cas silencieux. On le dit.
        return None, "LINTORN_MEMOIRE (.env) pointe sur un dossier inexistant"

    racine_claude = ENV.get("CLAUDE_CONFIG_DIR", "").strip()
    base = (Path(racine_claude).expanduser() if racine_claude
            else Path.home() / ".claude") / "projects"
    if not base.is_dir():
        return None, "aucun dossier Claude sur cette machine"

    nom_projet = RACINE.name.lower()
    for dossier in sorted(base.iterdir()):
        if not dossier.is_dir() or nom_projet not in dossier.name.lower():
            continue
        memoire = dossier / "memory"
        if memoire.is_dir():
            return memoire, "decouverte auto"

    return None, f"aucun dossier memoire trouve pour '{RACINE.name}'"


MEMOIRE_IA, MEMOIRE_IA_ORIGINE = _dossier_memoire()

# Racines depuis lesquelles un chemin cité dans la doc peut être relatif.
# `filter(None, ...)` est indispensable : BACKEND et FRONTEND valent None sur
# un projet qui n'en a pas, et un None ici ferait planter toute résolution.
RACINES_RESOLUTION = [
    chemin for chemin in (
        RACINE,
        BACKEND,
        FRONTEND,
        FRONTEND / "src" if FRONTEND else None,
        BACKEND.parent if BACKEND else None,
    ) if chemin is not None
]

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
#
# ⚠️ AUCUNE RÈGLE N'EST LIVRÉE AVEC L'OUTIL — et c'est délibéré.
#
# Une règle maison décrit LA maison : « importer axios depuis services/api.ts »
# n'a aucun sens ailleurs. Livrées dans le paquet, elles produisaient chez les
# autres des alertes incompréhensibles, ou pire, un vert rassurant sur une
# règle qui ne scannait aucun fichier.
#
# Elles se déclarent donc dans le `pyproject.toml` DU PROJET :
#
#     [[tool.lintorn.regles]]
#     nom      = "Couleurs en dur dans un CSS"
#     regle    = "uniquement des variables de theme (var(--bg)...)"
#     racine   = "front/src"          # relatif à la racine du dépôt
#     suffixes = [".css"]
#     motif    = "#[0-9a-fA-F]{3,8}\\b|\\brgba?\\("
#     exclure  = ["components/shared/plates/"]
#     bloquant = false                # true = interdire la régression
def _regles_du_projet() -> list[dict]:
    """Traduit les `[[tool.lintorn.regles]]` en règles exploitables.

    Une règle mal écrite est IGNORÉE et signalée, jamais fatale : un motif
    regex invalide ne doit pas priver l'utilisateur des douze autres
    contrôles. Et une règle dont le dossier n'existe pas est écartée plutôt
    que laissée à afficher un tranquille « 0 occurrence » — un vert sur un
    contrôle qui ne contrôle rien est précisément ce que Lintorn combat.
    """
    global ERREUR_CONFIG
    regles, soucis = [], []

    for brute in PROJET.get("regles", []):
        nom = str(brute.get("nom", "(sans nom)"))
        try:
            motif = re.compile(brute["motif"])
        except (KeyError, re.error) as erreur:
            soucis.append(f"{nom} : motif invalide ({erreur})")
            continue

        racine = RACINE / str(brute.get("racine", "")).strip("/")
        if not racine.is_dir():
            soucis.append(f"{nom} : dossier '{brute.get('racine')}' introuvable")
            continue

        regles.append({
            "nom": nom,
            "regle": str(brute.get("regle", "")),
            "racine": racine,
            "suffixes": tuple(brute.get("suffixes", ())),
            "motif": motif,
            "exclure": tuple(brute.get("exclure", ())),
            "bloquant": bool(brute.get("bloquant", False)),
        })

    if soucis:
        detail = " | ".join(soucis)
        ERREUR_CONFIG = f"{ERREUR_CONFIG} | {detail}" if ERREUR_CONFIG else detail
    return regles


REGLES_MAISON = _regles_du_projet()
