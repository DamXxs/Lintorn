#!/usr/bin/env python3
"""
Lintorn — le contrôle de santé d'un projet, et de la mémoire que lit l'IA.

Il regarde tout le monde, tout le temps, et il ne laisse rien passer.

    lintorn                    # tout
    lintorn --rapide           # sans les outils lents
    lintorn --doc              # uniquement : la doc ment-elle ?
    lintorn --fichiers a.py b.css
                                                   # + un focus sur ces fichiers
    lintorn --installer-hook   # branche le hook pre-push
                                                   #   (à faire UNE fois par clone)
    lintorn --maj-securite     # ce que pip-audit propose (simulation)
    lintorn --maj-securite --appliquer
                                                   # installe et repingle vraiment

OÙ TOUCHER QUOI
    config.py        les outils à lancer, ce qu'on vérifie, les règles maison
    traductions.py   les messages en français
    noyau.py         la mécanique
    Lintorn.py          (ce fichier) le point d'entrée, le rapport, l'affichage

CE QU'IL SURVEILLE, EN PLUS DU CODE
    Le lint et les tests ne voient que le CODE. Lintorn regarde aussi les
    DONNÉES (`manage.py verifier_donnees`) : une base peut être fausse alors
    que le code est juste — Aucun test unitaire ne voyait ces cas-là.

PRINCIPE — le rapport est un FAIT SUR LE CODE, pas une mémoire : il est ÉCRASÉ
à chaque exécution, jamais fusionné, jamais trié. Un fait sur le code périme dès
que le code change et se recalcule en quelques secondes.

Aucune dépendance : stdlib uniquement.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from datetime import datetime

from . import __version__, config, noyau
from .noyau import MARQUEUR, Resultat


# ─────────────────────────────────────────────────────────────────────────────
# MISE À JOUR DES PAQUETS VULNÉRABLES
# ─────────────────────────────────────────────────────────────────────────────
def _version_tuple(version: str) -> tuple:
    """Compare 6.15.0 et 6.9.0 correctement (une comparaison de CHAÎNES dirait
    que 6.9.0 est plus récent que 6.15.0)."""
    return tuple(int(m) if m.isdigit() else 0 for m in re.split(r"[.\-+]", version))


def maj_securite(appliquer: bool) -> int:
    """Met à jour les paquets que pip-audit signale. SIMULATION par défaut.

    POURQUOI PAS D'AUTOMATIQUE : monter une version de `cryptography` ou de
    `pypdf`, c'est toucher à la chaîne de signature. Ça se décide, ça se teste,
    ça ne se subit pas au détour d'un audit.

    `requirements.txt` est versionné : en cas de pépin, `git checkout
    <backend>/requirements.txt` annule la partie fichier, et
    `pip install -r requirements.txt` remet le venv d'aplomb.
    """
    print("Interrogation de pip-audit (quelques secondes)...")
    try:
        sortie = subprocess.run(
            [config.PYTHON, "-m", "pip_audit", "-f", "json",
             "--progress-spinner", "off"],
            cwd=config.BACKEND, capture_output=True, text=True, timeout=300,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as erreur:
        print(f"Echec : pip-audit injoignable ({erreur})")
        return 1

    try:
        rapport = json.loads(sortie.stdout)
    except ValueError:
        print("Echec : sortie de pip-audit illisible.")
        print((sortie.stdout or sortie.stderr)[:400])
        return 1

    plan, sans_correctif = [], []
    for paquet in rapport.get("dependencies", []):
        vulns = paquet.get("vulns") or []
        if not vulns:
            continue
        corrections = {v for vuln in vulns for v in (vuln.get("fix_versions") or [])}
        if not corrections:
            sans_correctif.append(paquet["name"])
            continue
        cible = max(corrections, key=_version_tuple)
        plan.append((paquet["name"], paquet["version"], cible,
                     sorted(v["id"] for v in vulns)))

    if not plan and not sans_correctif:
        print("Aucune faille connue. Rien a faire.")
        return 0

    if plan:
        print(f"\n{len(plan)} paquet(s) a mettre a jour :\n")
        for nom, actuelle, cible, ids in plan:
            print(f"  {nom:<16} {actuelle:>9}  ->  {cible:<9}  {', '.join(ids)}")
    if sans_correctif:
        print("\n/!\\ Faille SANS correctif publie (a surveiller, rien a installer) : "
              + ", ".join(sans_correctif))

    if not appliquer:
        print("\nSIMULATION - rien n'a ete touche. Pour appliquer :")
        print("    lintorn --maj-securite --appliquer")
        return 0

    print("\nInstallation...")
    reussis = []
    for nom, _, cible, _ in plan:
        resultat = subprocess.run(
            [config.PYTHON, "-m", "pip", "install", f"{nom}=={cible}"],
            cwd=config.BACKEND, capture_output=True, text=True, check=False,
        )
        if resultat.returncode == 0:
            reussis.append((nom, cible))
            print(f"  OK   {nom} {cible}")
        else:
            print(f"  ECHEC {nom} -> {cible}")
            print("       " + (resultat.stderr or "").strip().splitlines()[-1][:120])

    if reussis:
        # On ne repingle QUE ce qui s'est réellement installé : un
        # requirements.txt qui annonce une version absente du venv est pire
        # qu'un requirements.txt périmé.
        fichier = config.BACKEND / "requirements.txt"
        texte = fichier.read_text(encoding="utf-8")
        for nom, cible in reussis:
            texte = re.sub(rf"(?im)^{re.escape(nom)}==\S+[ \t]*$", f"{nom}=={cible}", texte)
        fichier.write_text(texte, encoding="utf-8")
        print(f"\nrequirements.txt repingle sur {len(reussis)} paquet(s).")

    print("\nA FAIRE MAINTENANT - une montee de version peut casser :")
    print("    cd <backend> && venv/Scripts/python.exe -m pytest -q")
    print("    lintorn")
    return 0 if len(reussis) == len(plan) else 1


AIDE = """lintorn — audite le code d'un projet ET la memoire que lit l'assistant IA.

USAGE
    lintorn                      audit complet
    lintorn --rapide             sans les outils lents (ce que lance le hook)
    lintorn --doc                uniquement : la documentation ment-elle ?
    lintorn --fichiers a.py b.ts + un focus sur ces fichiers

MISE EN PLACE
    lintorn --init               genere .lintorn/config.toml pour ce projet
    lintorn --esquisser-regles   prepare un [[regles]] par regle de ta doc
                                 qui n'a pas encore de controle
    lintorn --installer-hook     installe le hook pre-push
    lintorn --installer-outils   installe ruff, pytest, vulture, pip-audit
                                 dans le venv du projet (demande confirmation)

SECURITE
    lintorn --maj-securite       ce que pip-audit propose (simulation)
    lintorn --maj-securite --appliquer      installe et repingle vraiment

DIVERS
    lintorn --version            la version installee
    lintorn --help               ce message

CONFIGURATION
    .lintorn/config.toml, ou [tool.lintorn] dans pyproject.toml.
    Par defaut Lintorn n'execute pas ton code, n'ouvre pas ta base et ne sort
    pas sur le reseau : ces controles s'activent explicitement.

    https://github.com/DamXxs/Lintorn"""


# ─────────────────────────────────────────────────────────────────────────────
# PREMIER DÉMARRAGE SUR UN PROJET
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
# ESQUISSER LES RÈGLES DÉJÀ ÉCRITES DANS LA DOC
# ─────────────────────────────────────────────────────────────────────────────
# Le projet ENONCE ses regles dans son fichier d'instructions IA. Les
# RECOPIER a la main dans le config.toml est du travail bete, et c'est la
# que la plupart des gens abandonnent.
#
# ⚠️ LES ESQUISSES SONT COMMENTEES, JAMAIS ACTIVES. `re.compile("")` reussit,
#    et un motif vide matche partout : une esquisse active compterait des
#    milliers de fausses infractions des le premier audit. Un brouillon doit
#    etre inerte tant que l'humain n'y a pas mis la main.
_RX_MARKDOWN = re.compile(r"[`*_]+")
_RX_SUFFIXE = re.compile(r"\.[A-Za-z][A-Za-z0-9]{0,4}$")


def _nom_de_regle(phrase: str) -> str:
    """Un nom court. Dans un tableau, la premiere cellule EST le sujet."""
    cellules = [c.strip() for c in phrase.split("|") if c.strip()]
    brut = cellules[0] if cellules else phrase
    propre = " ".join(_RX_MARKDOWN.sub("", brut).replace('"', "'").split())
    if not propre:
        return "regle sans nom"
    return propre[:57] + "..." if len(propre) > 60 else propre


def _suffixes_probables(jetons: list[str]) -> list[str]:
    """Les extensions citees par la regle. Vide plutot que devine de travers."""
    trouves = []
    for jeton in jetons:
        fin = _RX_SUFFIXE.search(jeton.split("/")[-1].strip())
        if fin and fin.group(0).lower() not in trouves:
            trouves.append(fin.group(0).lower())
    return sorted(trouves)


def _esquisses_regles(deja_ecrit: str = "") -> list[str]:
    """Un bloc `[[regles]]` commente par regle enoncee mais non controlee.

    `deja_ecrit` : le contenu actuel du config.toml. Une regle dont le
    `source` y figure deja est sautee — sans quoi deux passages
    empileraient deux fois les memes brouillons.
    """
    manquantes = [
        (chemin, numero, phrase, jetons)
        for chemin, numero, phrase, jetons in noyau.regles_sans_controle()
        if f'"{chemin}:{numero}"' not in deja_ecrit
    ]
    if not manquantes:
        return []

    lignes = [
        "",
        "# ── Esquisses : tes regles de doc qui n'ont pas encore de controle ───",
        "# Lintorn les a reperees, mais il NE PEUT PAS deviner comment les",
        "# detecter : « jamais de couleur en dur » ne dit pas s'il faut traquer",
        "# #fff, rgba( ou hsl(, ni s'il faut epargner les commentaires. C'est une",
        "# decision technique, et une regex devinee ne produirait que des faux",
        "# positifs — de quoi cesser de faire confiance au rapport.",
        "#",
        "# Decommente celles qui comptent, ecris leur `motif`, jette les autres.",
        "#",
        "# `source` evite de RECOPIER la phrase ici : la regle reste enoncee a un",
        "# seul endroit, et Lintorn sait qu'elle a desormais un controle.",
    ]
    for chemin, numero, phrase, jetons in manquantes:
        suffixes = _suffixes_probables(jetons)
        rendu = ", ".join(f'"{suffixe}"' for suffixe in suffixes)
        indice = "" if suffixes else "   # <- a preciser : .py, .ts, .css..."
        lignes += [
            "",
            f"# {phrase[:100]}",
            "# [[regles]]",
            f'# source   = "{chemin}:{numero}"',
            f'# nom      = "{_nom_de_regle(phrase)}"',
            '# racine   = "."          # <- restreins au dossier concerne',
            f"# suffixes = [{rendu}]{indice}",
            "# motif    = ''            # <- A ECRIRE : ce qui repere une VIOLATION",
            "# bloquant = false         # true quand la regle est deja tenue partout",
        ]
    return lignes


def _contenu_regles_toml(esquisses: list[str]) -> str:
    """L'en-tete de `regles.toml`, suivi des esquisses ou d'un exemple."""
    lignes = [
        "# Les regles maison de ce projet.",
        "#   https://github.com/DamXxs/Lintorn",
        "#",
        "# Un fichier a part parce qu'il VIT : il grossit, on l'edite souvent,",
        "# on le relit a plusieurs. `config.toml`, a cote, est un reglage qu'on",
        "# ecrit une fois. Les deux se versionnent.",
        "#",
        "# Lintorn ne peut PAS deviner une regle maison : c'est une decision,",
        "# elle n'est ecrite nulle part dans le code.",
        "#",
        "# bloquant = true  -> regle DEJA respectee, on empeche la regression",
        "# bloquant = false -> dette existante, on mesure sans bloquer",
    ]
    if esquisses:
        lignes += esquisses
    else:
        lignes += [
            "",
            "# Voici la forme, a remplir :",
            "#",
            "# [[regles]]",
            '# nom      = "Couleurs en dur dans un CSS"',
            '# regle    = "uniquement des variables de theme"',
            '# racine   = "src"',
            '# suffixes = [".css"]',
            "# motif    = '#[0-9a-fA-F]{3,8}\\b'",
            "# exclure  = []",
            "# bloquant = false",
        ]
    return "\n".join(lignes) + "\n"


def esquisser_regles() -> int:
    """Ajoute au config.toml un brouillon par regle non controlee.

    POURQUOI UNE COMMANDE A PART, et pas seulement dans `--init` : `--init`
    ne tourne QU'UNE FOIS, au debut, quand la doc du projet est souvent
    encore vide. Les regles s'ecrivent apres, au fil des mois. Reservee a
    `--init`, la fonctionnalite ne servirait qu'aux projets neufs — jamais a
    ceux qui en ont le plus besoin.
    """
    cible = config.FICHIER_REGLES
    deja = cible.read_text(encoding="utf-8") if cible.is_file() else ""
    cible.parent.mkdir(parents=True, exist_ok=True)
    _poser_gitignore_interne(cible.parent)

    esquisses = _esquisses_regles(deja)
    if not esquisses:
        print("Rien a esquisser. Soit chaque regle de ta doc a deja un controle,")
        print("soit ses brouillons sont deja dans le fichier. Detail : lintorn")
        return 0

    try:
        cible.parent.mkdir(parents=True, exist_ok=True)
        if deja:
            with cible.open("a", encoding="utf-8") as fichier:
                fichier.write("\n".join(esquisses) + "\n")
        else:
            cible.write_text(_contenu_regles_toml(esquisses), encoding="utf-8")
    except OSError as erreur:
        print(f"Echec : {erreur}")
        return 1

    nombre = sum(1 for ligne in esquisses if ligne == "# [[regles]]")
    print(f"Ajoute a {cible.relative_to(config.RACINE)} : {nombre} esquisse(s), commentee(s).")
    print()
    print("A FAIRE MAINTENANT :")
    print("    1. ouvre le fichier : garde ce qui compte, jette le reste")
    print("    2. pour chaque regle gardee : decommente, puis ecris le `motif`")
    print("    3. `lintorn` pour verifier")
    return 0


# Le `.gitignore` que `--init` pose DANS `.lintorn/`.
#
# POURQUOI LA, ET PAS DANS CELUI DU PROJET. Editer le `.gitignore` de
# quelqu'un est intrusif, et pose une question insoluble a la relance : que
# faire si l'utilisateur a modifie les lignes ? Un fichier a nous, dans un
# dossier a nous, se supprime avec le dossier et ne touche a rien d'autre.
#
# Et surtout : l'etape « ajoute ces deux lignes a ton .gitignore » se recopiait
# mal. Un utilisateur a copie la ligne de PROSE, backticks compris, et oublie
# la negation — sa configuration s'est retrouvee ignoree, sans aucun message.
# Une etape qu'on supprime est une etape qu'on ne peut plus rater.
#
# ⚠️ Ce fichier ne peut RIEN si une regle parente exclut le dossier entier
#    (`.lintorn/` avec la barre finale) : git n'y descend meme pas. C'est le
#    seul cas d'echec, et `--init` le detecte pour le dire.
_GITIGNORE_INTERNE = """\
# Ecrit par `lintorn --init`.
#
# Les sorties de Lintorn se regenerent a chaque audit : elles n'ont rien a
# faire dans un depot. La CONFIG, elle, se versionne — c'est une decision
# d'equipe, pas un artefact de ta machine.
*
!.gitignore
!config.toml
!regles.toml
"""


# La ligne qui prouve que ce `.gitignore` est le NOTRE. Sans elle, on
# risquerait de modifier celui qu'un dev a ecrit a la main.
_SIGNATURE_GITIGNORE = "# Ecrit par `lintorn --init`."

# Les fichiers que Lintorn veut voir VERSIONNES dans `.lintorn/`.
_A_VERSIONNER = ("!.gitignore", "!config.toml", "!regles.toml")


def _poser_gitignore_interne(dossier) -> str:
    """Pose `.lintorn/.gitignore`, ou complete celui qu'on a deja pose.

    N'ecrase JAMAIS celui d'un humain : on ne touche qu'a un fichier portant
    notre propre signature.

    ⚠️ Le COMPLETER n'est pas un luxe. `regles.toml` est arrive apres. Sans
    cette mise a jour, tout projet configure avant lui verrait son fichier de
    regles ignore par git, donc absent du depot — silencieusement, ce qui est
    la panne que Lintorn combat partout ailleurs.
    """
    fichier = dossier / ".gitignore"
    if not fichier.exists():
        try:
            fichier.write_text(_GITIGNORE_INTERNE, encoding="utf-8")
        except OSError as erreur:
            return f"NON ecrit ({erreur})"
        return "ecrit - les sorties restent hors du depot, la config s'y versionne"

    try:
        contenu = fichier.read_text(encoding="utf-8")
    except OSError as erreur:
        return f"illisible ({erreur})"

    if _SIGNATURE_GITIGNORE not in contenu:
        return "ecrit a la main, laisse tel quel"

    manquants = [ligne for ligne in _A_VERSIONNER if ligne not in contenu]
    if not manquants:
        return "deja a jour"
    try:
        with fichier.open("a", encoding="utf-8") as flux:
            flux.write("\n".join(manquants) + "\n")
    except OSError as erreur:
        return f"NON complete ({erreur})"
    return f"complete : {', '.join(manquants)}"


def init(ecraser: bool = False) -> int:
    """Écrit un `.lintorn/config.toml` taillé pour CE projet.

    POURQUOI GÉNÉRER PLUTÔT QUE FOURNIR UN EXEMPLE FIGÉ : Lintorn vient de
    détecter ce que le projet contient. Un modèle générique obligerait
    l'utilisateur à commenter les trois quarts des lignes avant de démarrer —
    et c'est exactement à ce moment-là qu'on referme un outil.

    Ce qu'il NE PEUT PAS deviner : les règles maison. « Importer axios depuis
    services/api.ts » n'est écrit nulle part dans le code, c'est une décision.
    D'où un exemple commenté, à remplir.
    """
    cible = config.DOSSIER_LINTORN / "config.toml"
    if cible.exists() and not ecraser:
        print(f"{cible.relative_to(config.RACINE)} existe deja.")
        print("Relance avec --force pour l'ecraser.")
        return 1

    detecte = []
    if config.PY_RACINE:
        detecte.append(f"Python ({config.PY_RACINE.name})")
    if config.BACKEND:
        detecte.append(f"Django ({config.BACKEND.name})")
    if config.FRONTEND:
        suffixe = " + TypeScript" if (config.FRONTEND / "tsconfig.json").is_file() else ""
        detecte.append(f"JS{suffixe} ({config.FRONTEND.name})")

    lignes = [
        "# Configuration de Lintorn pour ce projet.",
        "#   https://github.com/DamXxs/Lintorn",
        "#",
        f"# Genere par `lintorn --init`. Detecte : {', '.join(detecte) or 'rien de connu'}.",
        "",
        "# ── Le perimetre ─────────────────────────────────────────────────────",
        "# Lintorn n'audite que ce qui appartient au depot : tout fichier ecarte",
        "# par ton .gitignore sort du perimetre — brouillons, notes personnelles,",
        "# sorties d'outils. Rien a regler ici, c'est ton .gitignore qui decide.",
        "#",
        "# ⚠️ Un fichier DEJA SUIVI par git reste audite, meme si une regle du",
        "#    .gitignore le vise : une regle n'agit que sur ce qui n'est PAS",
        "#    encore suivi. Pour le sortir vraiment, il faut le desindexer :",
        "#        git rm -r --cached <fichier>",
        "#",
        "# Pour ecarter en plus des documents VERSIONNES :",
        '#     docs_exclus = ["docs/*", "CHANGELOG.md"]',
        "",
        "# ── Les controles ────────────────────────────────────────────────────",
        "# Par defaut Lintorn n'execute pas ton code, n'ouvre pas ta base et ne",
        "# sort pas sur le reseau. Passe a `true` ce que tu veux activer.",
        "[controles]",
    ]

    invasifs = [
        ("tests", "pytest — EXECUTE le code du projet", bool(config.PY_RACINE)),
        ("donnees_metier", "manage.py verifier_donnees — ouvre la BASE", bool(config.BACKEND)),
        ("deploy", "check --deploy — bruyant tant qu'on est en dev", bool(config.BACKEND)),
        ("code_mort", "vulture — consultatif, beaucoup de faux positifs", bool(config.PY_RACINE)),
        ("failles", "pip-audit — sort sur le RESEAU", bool(config.PY_RACINE)),
    ]
    for cle, role, pertinent in invasifs:
        prefixe = "" if pertinent else "# "
        lignes.append(f"{prefixe}{cle:<15}= false   # {role}")

    lignes += [
        "",
        "# ── Tes regles maison ────────────────────────────────────────────────",
        "# Elles vivent a cote, dans `regles.toml` : ce fichier-ci est un",
        "# reglage qu'on ecrit une fois, elles sont une liste qui grossit.",
        "# Les deux se versionnent.",
    ]

    lignes += [
        "",
        "# ── De la doc a NE PAS verifier ──────────────────────────────────────",
        "# Un tutoriel (« creez un fichier `myapp.py` ») et un changelog citent",
        "# des fichiers qui n'existent pas dans le projet : c'est normal, et les",
        "# verifier ne produit que du bruit. `*` traverse les dossiers.",
        "#",
        "# docs_exclus = [\"docs/*\", \"CHANGELOG.md\"]",
        "",
        "# ── Une doc qui cite des fichiers absents ────────────────────────────",
        "# Une roadmap ou une note de conception cite legitimement des fichiers",
        "# pas encore ecrits, ou supprimes. Mets ce marqueur n'importe ou dedans",
        "# et ses chemins morts seront LISTES au lieu de bloquer :",
        "#",
        "#     <!-- lintorn:prospectif -->",
        "",
        "# ── Tes propres outils ───────────────────────────────────────────────",
        "# Tout outil qui repond par un code de sortie a sa place ici.",
        "# ⚠️ Ces commandes sont EXECUTEES : ne lance pas Lintorn dans un depot",
        "#    en qui tu n'as pas confiance.",
        "#",
        "# [[commandes]]",
        '# cle      = "mypy"',
        '# titre    = "Types (mypy)"',
        '# cmd      = ["python", "-m", "mypy", "."]',
        '# cwd      = "."',
        "# bloquant = false",
        "",
    ]

    try:
        cible.parent.mkdir(parents=True, exist_ok=True)
        cible.write_text("\n".join(lignes), encoding="utf-8")
    except OSError as erreur:
        print(f"Echec : {erreur}")
        return 1

    garde = _poser_gitignore_interne(cible.parent)

    # `regles.toml` est ecrit MEME vide de regles : un fichier absent laisse
    # croire que la fonctionnalite n'existe pas. Present et commente, il
    # montre la forme a remplir.
    esquisses = _esquisses_regles()
    regles = config.FICHIER_REGLES
    if not regles.exists():
        try:
            regles.write_text(_contenu_regles_toml(esquisses), encoding="utf-8")
        except OSError as erreur:
            print(f"Echec sur regles.toml : {erreur}")
            return 1

    relatif = cible.relative_to(config.RACINE)
    nombre = sum(1 for ligne in esquisses if ligne == "# [[regles]]")
    resume_regles = (f"{nombre} regle(s) de ta doc, en esquisse a completer"
                     if nombre else "la forme a remplir, en commentaire")
    print(f"Projet detecte : {', '.join(detecte) or 'rien de connu'}")
    print(f"Ecrit          : {relatif}")
    print(f"Ecrit          : {regles.relative_to(config.RACINE)} - {resume_regles}")
    print(f"Ecrit          : {relatif.parent / '.gitignore'} - {garde}")
    print()
    print("A FAIRE MAINTENANT :")
    print(f"    1. ouvre {relatif} et active les controles que tu veux")
    if nombre:
        print(f"    2. ouvre {regles.relative_to(config.RACINE)} : garde ce qui compte,")
        print("       decommente, et ecris le `motif` de chaque regle gardee")
        print("    3. `lintorn` pour un premier rapport")
    else:
        print("    2. `lintorn` pour un premier rapport")

    # Contre-epreuve : on ne se contente pas d'avoir ECRIT le garde-fou, on
    # demande a git s'il produit l'effet voulu. Sans ca, un utilisateur dont
    # le .gitignore exclut le dossier entier croirait sa config versionnee.
    caches = [f.name for f in (cible, regles) if not config.hors_gitignore([f])]
    if caches:
        print()
        print(f"ATTENTION : git ignore {' et '.join(caches)}, ces fichiers ne")
        print("partiront pas sur le depot. Une regle de ton .gitignore exclut")
        print("le DOSSIER entier :")
        print()
        print("    .lintorn/     exclut le dossier : git n'y descend pas, et")
        print("                  aucune exception interne ne peut le rattraper")
        print("    .lintorn/*    exclut son CONTENU : les exceptions marchent")
        print()
        print("Remplace la premiere forme par la seconde, ou retire la regle :")
        print("le .gitignore pose dans .lintorn/ suffit desormais a lui seul.")
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# INSTALLATION DES OUTILS EXTERNES
# ─────────────────────────────────────────────────────────────────────────────
# Chaque outil : le module à importer, le paquet pip, ce qu'il apporte.
OUTILS = [
    ("ruff",      "ruff",      "lint Python"),
    ("pytest",    "pytest",    "tests"),
    ("vulture",   "vulture",   "code mort (consultatif)"),
    ("pip_audit", "pip-audit", "failles de securite connues"),
]


def _outils_manquants() -> list[tuple[str, str, str]]:
    """Ceux que le python DU PROJET ne sait pas importer."""
    manquants = []
    for module, paquet, role in OUTILS:
        trouve = subprocess.run(
            [config.PYTHON, "-c", f"import {module}"],
            capture_output=True, text=True, check=False,
        )
        if trouve.returncode != 0:
            manquants.append((module, paquet, role))
    return manquants


def installer_outils(sans_demander: bool = False) -> int:
    """Installe les outils que Lintorn appelle, DANS le venv du projet.

    ⚠️ POURQUOI PAS DE SIMPLES `dependencies` DANS pyproject.toml : ces outils
    doivent tourner dans le venv du PROJET AUDITÉ. Déclarés comme dépendances
    de Lintorn, ils s'installeraient dans le venv de Lintorn — invisibles pour
    `config.PYTHON`, et pytest n'y verrait ni Django ni les modèles du projet.

    On installe donc là où ça compte, et jamais sans demander : ajouter des
    paquets au venv de quelqu'un est une modification de son environnement.
    """
    if sys.executable == config.PYTHON and config.BACKEND is None:
        print("Aucun venv de projet detecte : refus d'installer dans le python courant.")
        print("Cree un venv dans ton projet, puis relance.")
        return 1

    manquants = _outils_manquants()
    if not manquants:
        print("Tous les outils sont deja installes. Rien a faire.")
        return 0

    print(f"Venv cible : {config.PYTHON}\n")
    print(f"{len(manquants)} outil(s) manquant(s) :\n")
    for _, paquet, role in manquants:
        print(f"    {paquet:<12} {role}")

    # L'effet de bord se dit AVANT, pas après : ces paquets apparaîtront dans
    # `pip freeze`, donc le contrôle « Dependances vs venv » les signalera
    # aussitôt comme « installes mais pas declares ».
    # ⚠️ Un avertissement qui ne dit pas COMMENT le suivre ne sert a rien : on
    # donne les deux chemins exacts, pas un conseil en l'air.
    print("\nA SAVOIR : ces paquets apparaitront ensuite comme 'non declares'")
    print("dans le controle Dependances vs venv. Deux facons de regler ca :")
    print()
    requirements = (config.PY_RACINE / "requirements.txt") if config.PY_RACINE else None
    if requirements and requirements.is_file():
        try:
            ou = requirements.relative_to(config.RACINE).as_posix()
        except ValueError:
            ou = str(requirements)
        print(f"  1. les declarer  -> ajouter ces lignes dans {ou} :")
        for _, paquet, _ in manquants:
            print(f"                          {paquet}")
    else:
        print("  1. les declarer  -> aucun requirements.txt trouve ; si tu en")
        print("                      crees un, ajoute-les dedans")
    print()
    print("  2. ou couper le controle -> dans .lintorn/config.toml :")
    print("                          [controles]")
    print("                          dependances = false")

    if not sans_demander:
        try:
            reponse = input("\nInstaller maintenant ? [o/N] ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\nAnnule.")
            return 1
        if reponse not in ("o", "oui", "y", "yes"):
            print("Annule - rien n'a ete installe.")
            return 1

    print()
    echecs = []
    for _, paquet, _ in manquants:
        resultat = subprocess.run(
            [config.PYTHON, "-m", "pip", "install", paquet],
            capture_output=True, text=True, check=False,
        )
        if resultat.returncode == 0:
            print(f"  OK    {paquet}")
        else:
            echecs.append(paquet)
            print(f"  ECHEC {paquet}")
            derniere = (resultat.stderr or "").strip().splitlines()
            if derniere:
                print(f"        {derniere[-1][:120]}")

    # `tsc` vient de npm, pas de pip : on ne peut que l'annoncer.
    if config.FRONTEND and (config.FRONTEND / "tsconfig.json").is_file():
        print("\nTypeScript : `tsc` vient de npm, pas de pip.")
        print(f"    cd {config.FRONTEND.name} && npm install")

    return 1 if echecs else 0


# ─────────────────────────────────────────────────────────────────────────────
# INSTALLATION DU HOOK
# ─────────────────────────────────────────────────────────────────────────────
def installer_hook() -> int:
    """Branche le hook pre-push sur CE clone. Idempotent, sans effet de bord.

    Le réglage `core.hooksPath` n'est pas versionné : il doit être reposé sur
    chaque clone. Plutôt que de laisser l'utilisateur retenir la commande git,
    Lintorn la joue lui-même — et son contrôle « Hook pre-push » dit quand c'est
    nécessaire.
    """
    # 1. COPIER le hook du paquet vers le projet.
    #
    # ⚠️ Cette étape n'existait pas tant que Lintorn vivait DANS le projet :
    # le hook y était déjà, seul `core.hooksPath` manquait. Installé par pip,
    # le hook vit dans le paquet — poser le réglage sans copier le fichier
    # laissait `core.hooksPath` pointer sur un dossier VIDE, soit exactement
    # la panne muette que ce contrôle est censé détecter.
    try:
        config.HOOKS.mkdir(parents=True, exist_ok=True)
        cible = config.HOOKS / "pre-push"
        shutil.copyfile(config.HOOKS_SOURCE / "pre-push", cible)
        # Sans le bit exécutable, git ignore le hook EN SILENCE. `copyfile` ne
        # transporte pas les permissions : on les pose explicitement plutôt que
        # d'espérer qu'elles aient suivi.
        cible.chmod(cible.stat().st_mode | 0o111)
    except OSError as erreur:
        print(f"Echec : impossible d'installer le hook ({erreur})")
        return 1

    # 2. Dire à git d'aller le chercher là.
    try:
        subprocess.run(
            ["git", "config", "core.hooksPath", config.HOOKS_ATTENDU],
            cwd=config.RACINE, check=True, capture_output=True, text=True,
        )
    except (OSError, subprocess.SubprocessError) as erreur:
        print(f"Echec : impossible de configurer git ({erreur})")
        return 1

    print(f"Hook installe : {config.HOOKS_ATTENDU}/pre-push")
    print(f"Hook branche  : core.hooksPath = {config.HOOKS_ATTENDU}")
    print("Lintorn tournera desormais avant chaque git push.")
    print(f"Pense a versionner {config.HOOKS_ATTENDU}/ pour qu'il suive les clones.")
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# FOCUS SUR LES FICHIERS D'UN PUSH
# ─────────────────────────────────────────────────────────────────────────────
def _alias(chemin_git: str) -> list[str]:
    """Toutes les façons dont un même fichier peut apparaître dans un rapport.

    git parle en chemins depuis la racine du dépôt :
        api/comptes/vues.py
    mais ruff tourne DANS le backend et écrit :
        comptes/vues.py
    On compare donc sur plusieurs formes du même chemin.

    ⚠️ Les préfixes viennent de la DÉTECTION (`config.PREFIXES_PROJET`), ils
    ne sont plus écrits en dur. Avec des préfixes figés, le focus ne
    reconnaissait aucun fichier sur un autre projet — et annonçait « aucun
    defaut connu dedans » sans avoir rien pu comparer, juste avant le push.
    """
    chemin = chemin_git.replace("\\", "/")
    formes = [chemin]
    for prefixe in config.PREFIXES_PROJET:
        if chemin.startswith(prefixe):
            formes.append(chemin[len(prefixe):])
    return formes


def focus_sur(resultats: list[Resultat], fichiers: list[str]) -> Resultat:
    """Ne garde, dans tous les rapports, que ce qui touche CES fichiers.

    C'est ce qui transforme « 638 couleurs en dur dans le projet » en
    « 3 couleurs en dur dans ce que tu viens de pousser ». Sans ça, un rapport
    global est illisible : on ne sait pas si le défaut vient de ce push ou
    traîne depuis six mois.
    """
    formes = [forme for fichier in fichiers for forme in _alias(fichier)]
    touches: list[str] = []

    for resultat in resultats:
        if resultat.statut == "OK" or not resultat.detail:
            continue
        for ligne in resultat.detail.splitlines():
            propre = ligne.strip()
            # ⚠️ Les outils écrivent les chemins avec le séparateur de l'OS :
            # sous Windows, ruff sort `api\outils\noyau.py`. Les formes
            # calculées par `_alias`, elles, sont en slashs — git ne parle que
            # cette langue. Sans normaliser AVANT de comparer, plus rien ne
            # correspond sous Windows : le focus annonce « aucun defaut connu
            # dedans » au moment précis où l'on pousse. Un faux vert.
            compare = propre.replace("\\", "/")
            if propre and any(forme in compare for forme in formes):
                touches.append(f"[{resultat.titre}] {propre}")

    if not touches:
        return Resultat(
            "Defauts dans les fichiers pousses", "OK",
            f"{len(fichiers)} fichier(s) pousse(s), aucun defaut connu dedans",
            bloquant=False,
        )

    return Resultat(
        "Defauts dans les fichiers pousses", "ALERTE",
        f"{len(touches)} defaut(s) dans {len(fichiers)} fichier(s) pousse(s)",
        "\n".join(f"- {t}" for t in touches),
        bloquant=False,   # informatif : le blocage reste décidé par les contrôles eux-mêmes
    )


# ─────────────────────────────────────────────────────────────────────────────
# RAPPORT
# ─────────────────────────────────────────────────────────────────────────────
def ecrire_rapport(resultats: list[Resultat]) -> None:
    horodatage = datetime.now().strftime("%d/%m/%Y %H:%M")
    lignes = [
        f"# Le rapport de Lintorn — {config.RACINE.name}",
        "",
        f"> Généré le {horodatage} par `lintorn`.",
        "> **Fichier régénéré à chaque exécution — ne rien y écrire à la main.**",
        "",
        "| Contrôle | Statut | Résumé |",
        "|---|---|---|",
    ]
    lignes += [f"| {r.titre} | {MARQUEUR[r.statut]} | {r.resume} |" for r in resultats]

    for r in resultats:
        if r.statut == "OK" or not r.detail:
            continue
        # 12 000 caractères : au-delà, un outil bavard rendrait le rapport
        # illisible. La coupure est signalée pour ne pas tromper le lecteur.
        detail = r.detail
        if len(detail) > 12000:
            detail = detail[:12000] + "\n… (sortie tronquée)"

        lignes += ["", f"## {MARQUEUR[r.statut]} {r.titre}", ""]
        if r.detail_markdown:
            # Détail déjà en Markdown (liens cliquables) : surtout PAS de bloc
            # ``` , qui afficherait le code source des liens au lieu des liens.
            lignes.append(detail)
        else:
            lignes += ["```", detail, "```"]

    # Le dossier .lintorn/ n'existe pas au premier lancement sur un projet.
    config.RAPPORT.parent.mkdir(parents=True, exist_ok=True)
    config.RAPPORT.write_text("\n".join(lignes) + "\n", encoding="utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    args = sys.argv[1:]

    # ⚠️ AVANT TOUT LE RESTE. `--help` est le premier reflexe de quiconque
    # decouvre une commande ; il declenchait un audit complet du depot
    # courant. `--version` faisait pareil. Deux drapeaux qu'on n'a pas le
    # droit de rater sur un outil publie.
    if {"-h", "--help", "--aide"} & set(args):
        print(AIDE)
        return 0

    if {"-V", "--version"} & set(args):
        print(f"lintorn {__version__}")
        return 0

    if "--installer-hook" in args:
        return installer_hook()

    if "--installer-outils" in args:
        return installer_outils(sans_demander="--oui" in args)

    if "--init" in args:
        return init(ecraser="--force" in args)

    if "--esquisser-regles" in args:
        return esquisser_regles()

    if "--maj-securite" in args:
        return maj_securite(appliquer="--appliquer" in args)

    fichiers: list[str] = []
    if "--fichiers" in args:
        fichiers = [a for a in args[args.index("--fichiers") + 1:] if not a.startswith("--")]

    if "--doc" in args:
        resultats = [noyau.controle_doc()]
    else:
        complet = "--rapide" not in args
        resultats = noyau.executer(rapide=not complet)
        if complet:
            # Les outils lents ont tourné : on note la date pour que le contrôle
            # « Audit complet » cesse de réclamer. Écrit APRÈS coup — un audit
            # interrompu ne doit pas compter comme fait.
            noyau.ecrire_etat("dernier_audit_complet",
                              datetime.now().isoformat(timespec="seconds"))

    if fichiers:
        resultats.append(focus_sur(resultats, fichiers))

    ecrire_rapport(resultats)

    # ⚠️ Sur un projet sans config, les messages renvoyaient vers
    # `.lintorn/config.toml` — un fichier qui n'existe PAS tant que `--init`
    # n'a pas tourne. On envoyait donc l'utilisateur vers un fichier fantome
    # sans jamais lui dire comment le creer.
    manque_config = not config.PROJET and not (config.DOSSIER_LINTORN / "config.toml").exists()

    # Console volontairement en ASCII : le hook git tourne sous Git Bash, qui
    # n'affiche pas l'UTF-8 correctement. Le rapport, lui, garde les accents.
    print("\n=== Lintorn - RAPPORT AUDIT ===")
    for r in resultats:
        print(f"{MARQUEUR[r.statut]} {r.titre:<34} {r.resume}")

    echecs = [r for r in resultats if r.en_echec]
    print(f"\nLe rapport de Lintorn : {config.RAPPORT.relative_to(config.RACINE).as_posix()}")

    if manque_config:
        print("\nCe projet n'a pas encore de configuration Lintorn.")
        print("    lintorn --init      # regles maison, controles, outils a lancer")
    if echecs:
        print(f"Lintorn signale {len(echecs)} controle(s) bloquant(s) en alerte :")
        for r in echecs:
            print(f"    - {r.titre}")
        return 1
    # ⚠️ LE FAUX VERT DU DERNIER ETAGE.
    #
    # « Tous les controles sont au vert » est techniquement exact quand aucun
    # n'est en alerte — y compris quand AUCUN n'a pu tourner. Sur un projet
    # dont Lintorn ne connait ni le langage ni la doc, il affichait donc un
    # feu vert triomphal apres n'avoir strictement rien verifie.
    #
    # Un verdict global doit refleter ce qui a ete CONTROLE, pas seulement
    # l'absence d'alerte.
    a_tourne = [
        r for r in resultats
        if r.statut in ("OK", "ALERTE", "ERREUR")
        and r.titre not in noyau.TITRES_OUTILLAGE
    ]
    if not a_tourne:
        print("AUCUN controle n'a pu tourner sur ce projet.")
        print("Ce n'est PAS un feu vert : Lintorn n'a rien verifie du tout.")
        print("    lintorn --init             # lui dire quoi surveiller ici")
        print("    lintorn --installer-outils # si le projet est en Python")
        return 0

    print("Lintorn n'a rien a signaler : tous les controles bloquants sont au vert.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
