# /matorn/tools/noyau.py
"""
La mécanique de l'outil. Normalement, tu n'as pas besoin d'y toucher.

  ▸ Pour ajouter un outil    → config.py
  ▸ Pour traduire un code    → traductions.py
  ▸ Pour changer la mécanique → c'est ici

Contenu : la fiche Resultat, le lanceur de commandes, et les deux contrôles
maison (doc-vs-code et règles de CLAUDE.md).
"""

from __future__ import annotations

import datetime
import json
import os
import re
import subprocess
from pathlib import Path

import config
import traductions


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAT LOCAL — ce qui dépend de la MACHINE, pas du projet
# ─────────────────────────────────────────────────────────────────────────────
# Gitignoré : la date du dernier audit complet n'a de sens que sur le poste où
# il a tourné. La partager par git ferait croire à un collègue que SA machine
# est à jour parce qu'une autre l'était.
def lire_etat() -> dict:
    try:
        return json.loads(config.ETAT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def ecrire_etat(cle: str, valeur) -> None:
    etat = lire_etat()
    etat[cle] = valeur
    try:
        config.ETAT.write_text(json.dumps(etat, indent=2), encoding="utf-8")
    except OSError:
        pass    # ne JAMAIS faire échouer un audit parce qu'on n'a pas pu noter la date

# ─────────────────────────────────────────────────────────────────────────────
# LA FICHE DE RÉSULTAT
# ─────────────────────────────────────────────────────────────────────────────
MARQUEUR = {
    "OK": "[ OK ]",
    "ALERTE": "[ !! ]",
    "VERIF": "[ ?? ]",         # rien de cassé, mais un point à confirmer à l'œil
    "ERREUR": "[ERR!]",        # l'outil lui-même est en panne
    "INDISPONIBLE": "[ -- ]",  # outil absent : on prévient, on ne bloque pas
}


class Resultat:
    """Issue d'un contrôle : un statut, un résumé court, un détail complet."""

    def __init__(self, titre: str, statut: str, resume: str, detail: str = "",
                 bloquant: bool = True, detail_markdown: bool = False):
        self.titre = titre
        self.statut = statut
        self.resume = resume
        self.detail = detail.strip()
        self.bloquant = bloquant
        # True = le détail contient du Markdown (liens cliquables) → le rapport
        # ne doit PAS l'enfermer dans un bloc ``` , sinon les liens ne
        # fonctionnent plus.
        self.detail_markdown = detail_markdown

    @property
    def en_echec(self) -> bool:
        """Ce résultat doit-il empêcher un push ?

        VERIF n'y figure PAS : c'est un point à confirmer à l'œil, pas un défaut.
        """
        return self.statut in ("ALERTE", "ERREUR") and self.bloquant


def lien(chemin_racine: str, ligne: int | None = None) -> str:
    """Transforme un chemin en lien Markdown cliquable depuis le rapport.

    Le rapport vit dans `matorn/tools/`, donc la racine du dépôt est deux
    crans au-dessus. VS Code ouvre le fichier au clic, et se place sur la
    bonne ligne grâce à l'ancre `#L42`.
    """
    chemin = chemin_racine.replace("\\", "/")
    ancre = f"#L{ligne}" if ligne else ""
    texte = f"{chemin}:{ligne}" if ligne else chemin
    return f"[`{texte}`](../../{chemin}{ancre})"


# ─────────────────────────────────────────────────────────────────────────────
# LANCER UN OUTIL EXTERNE
# ─────────────────────────────────────────────────────────────────────────────
def lancer(
    titre: str,
    commande: list[str],
    cwd: Path,
    bloquant: bool = True,
    codes_alerte: tuple[int, ...] = (1,),
) -> Resultat:
    """Lance un outil et transforme son code de sortie en Resultat.

    `codes_alerte` distingue DEUX choses que le code de sortie confond :

      0                    → tout va bien
      dans codes_alerte    → l'outil a fait son travail et a TROUVÉ des problèmes
      tout le reste        → l'OUTIL LUI-MÊME a planté

    Sans cette distinction, un ruff cassé (code 2 = erreur interne) ressemblait
    exactement à un ruff ayant trouvé 12 défauts. On serait resté persuadé
    d'être couvert alors que plus rien n'était analysé.
    """
    try:
        proc = subprocess.run(
            commande, cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=600,
        )
    except FileNotFoundError:
        return Resultat(titre, "INDISPONIBLE", f"outil introuvable : {commande[0]}", bloquant=False)
    except subprocess.TimeoutExpired:
        return Resultat(titre, "INDISPONIBLE", "delai depasse (10 min)", bloquant=False)

    sortie = (proc.stdout + proc.stderr).strip()

    if proc.returncode == 0:
        # ⚠️ Les `resume` finissent dans la console — et le hook git tourne sous
        # Git Bash, qui n'affiche pas l'UTF-8 correctement. On les garde en
        # ASCII pur. Le RAPPORT, lui, est en UTF-8 et garde tous les accents.
        return Resultat(titre, "OK", "rien a signaler", sortie, bloquant)

    if proc.returncode in codes_alerte:
        lignes = [ligne for ligne in sortie.splitlines() if ligne.strip()]
        return Resultat(titre, "ALERTE", f"{len(lignes)} ligne(s) de sortie", sortie, bloquant)

    # Code inattendu → c'est l'outil qui est en panne, pas ton code.
    # On garde `bloquant` : un contrôle muet est pire qu'un contrôle rouge,
    # il donne l'illusion d'être couvert.
    return Resultat(
        titre, "ERREUR",
        f"l'outil a plante (code {proc.returncode}) — plus aucune analyse",
        sortie, bloquant,
    )


# ─────────────────────────────────────────────────────────────────────────────
# TRADUCTION DES SORTIES
# ─────────────────────────────────────────────────────────────────────────────
# Sortie brute de ruff (format "concise") :
#   accounts\views.py:7:1: F811 redefinition of unused 'x' from line 4
LIGNE_RUFF = re.compile(
    r"^(?P<fichier>.+?):(?P<ligne>\d+):\d+:\s+(?P<code>[A-Z]+\d+)\s+(?P<message>.*)$"
)


def traduire_ruff(resultat: Resultat) -> Resultat:
    """Réécrit la sortie de ruff en français, avec un résumé par type."""
    dico = traductions.RUFF
    traduites: list[str] = []
    compteur: dict[str, int] = {}

    for ligne in resultat.detail.splitlines():
        trouve = LIGNE_RUFF.match(ligne.strip())
        if not trouve:
            continue
        code = trouve["code"]
        compteur[code] = compteur.get(code, 0) + 1
        # Code non traduit → on garde l'anglais plutôt que de perdre l'info
        explication = dico.get(code, trouve["message"])
        # Ruff tourne depuis backend/ → on repréfixe pour obtenir un chemin
        # depuis la racine du dépôt, sinon le lien ne pointe sur rien.
        fichier = "matorn/backend/" + trouve["fichier"].replace("\\", "/")
        traduites.append(
            f"- {lien(fichier, int(trouve['ligne']))}<br>`{code}` — {explication}"
        )

    if not traduites:
        # Format inattendu (ruff a changé son affichage ?) → on rend le brut.
        # test_LEON.py garde ce cas sous surveillance.
        return resultat

    entete = ["**Résumé par type :**", ""]
    for code, nb in sorted(compteur.items(), key=lambda x: -x[1]):
        entete.append(f"- **{nb}** × `{code}` — {dico.get(code, '(non traduit)')}")
    entete += ["", "**Détail :**", ""]

    resultat.detail = "\n".join(entete + traduites)
    resultat.resume = f"{len(traduites)} alerte(s) reelle(s)"
    resultat.detail_markdown = True
    return resultat


def traduire_deploy(resultat: Resultat) -> Resultat:
    """Réécrit les avertissements de `check --deploy` en français.

    ⚠️ La regex accepte N'IMPORTE QUEL préfixe d'app, pas seulement `security.`.
    Elle ne prenait que `security\\.` jusqu'au 03/08/2026 : les contrôles maison
    du projet (`signatures.E002`…) étaient donc SILENCIEUSEMENT jetés du
    rapport. Un contrôle qu'on croit avoir mais qui n'apparaît jamais est pire
    que pas de contrôle du tout.
    """
    codes = re.findall(r"\((\w+\.[A-Z]\d{3})\)", resultat.detail)
    if not codes:
        return resultat

    lignes = ["A REGLER AVANT LA MISE EN PRODUCTION :"]
    for code in dict.fromkeys(codes):        # dédoublonne en gardant l'ordre
        lignes.append(f"  {code} — {traductions.DEPLOY.get(code, '(non traduit)')}")

    resultat.detail = "\n".join(lignes)
    resultat.resume = f"{len(set(codes))} point(s) a regler avant la prod"
    return resultat


TRADUCTEURS = {"ruff": traduire_ruff, "deploy": traduire_deploy}


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON 1 — la doc dit-elle encore la vérité ?
# ─────────────────────────────────────────────────────────────────────────────
# Le code a ruff, tsc et manage.py check pour se surveiller. La doc, elle, n'a
# RIEN : c'est comme ça que CLAUDE.md a pu affirmer pendant des semaines que
# `api.ts` était en JavaScript, ou citer `utils/generatePdf.ts` — un fichier
# supprimé depuis, présenté comme le pivot d'un chantier à venir.

def indexer_fichiers() -> set[str]:
    """Parcourt le dépôt une fois et retient chaque nom de fichier."""
    noms: set[str] = set()
    for chemin in config.RACINE.rglob("*"):
        if any(partie in config.IGNORES for partie in chemin.parts):
            continue
        if chemin.is_file():
            noms.add(chemin.name)
    return noms


def est_un_chemin(token: str) -> bool:
    """Trie les `backticks` : garde ce qui ressemble à un fichier, jette le code.

    ⚠️ C'est un empilement d'heuristiques, pas une science : chaque règle a été
    ajoutée après un vrai faux positif. Les cas connus sont figés dans
    test_LEON.py pour qu'ils ne reviennent pas.
    """
    if not token or len(token) > 120:
        return False
    # Du code, pas un chemin : `tsc --noEmit`, `Facture.emettre()`, `var(--bg)`…
    if any(c in token for c in " ()<>|$*\"'{}[]=,;`"):
        return False
    # Routes d'API (`/api/archives/`), URL, chemins tronqués (`.../debloquer`)
    if token.startswith(("/", "http", "@", "-", ".venv")) or "..." in token:
        return False
    # Une extension citée seule (« en `.tsx` obligatoirement ») n'est pas un fichier
    if token.startswith(".") and "/" not in token:
        return False
    return "/" in token or token.endswith(config.EXTENSIONS)


def existe(token: str, index_noms: set[str]) -> bool:
    """Le chemin cité correspond-il à quelque chose de réel ?

    `index_noms` est passé en PARAMÈTRE : la fonction ne dépend que de ses
    arguments, donc elle est testable seule et ne peut pas tomber sur un index
    vide (c'était un défaut de la première version).
    """
    token = re.sub(r":\d+(-\d+)?$", "", token)   # `models.py:17-34` → `models.py`

    # Un import TS s'écrit sans extension (`utils/dataFormatters`) → on les essaie
    candidats = [token]
    if not token.endswith(config.EXTENSIONS):
        candidats += [token + ext for ext in (".ts", ".tsx", ".js", ".jsx", ".py")]

    for candidat in candidats:
        if "/" in candidat:
            if any((racine / candidat).exists() for racine in config.RACINES_RESOLUTION):
                return True
        elif candidat in index_noms:
            return True
    return False


def _verifier_documents(titre: str, documents: list, bloquant_possible: bool) -> Resultat:
    """Cœur du contrôle : les chemins cités dans ces documents existent-ils ?

    `bloquant_possible=False` → on rapporte sans jamais bloquer. C'est le cas
    de la mémoire de l'IA : elle contient des INTENTIONS (« on créera la
    commande purger_corbeille ») autant que des faits. Un fichier pas encore
    écrit n'est pas un mensonge, et la mémoire de l'assistant ne doit jamais
    empêcher un push du dev.
    """
    # ⚠️ GARDE-FOU : aucun document à analyser = le contrôle est HORS SERVICE,
    # pas « au vert ». C'est arrivé le 30/07 (les .md avaient été déplacés) :
    # l'outil affichait « OK — 0 chemin vérifié » et ne surveillait plus rien.
    # Un contrôle muet est plus dangereux qu'un contrôle rouge.
    existants = [d for d in documents if d.exists()]
    if not existants:
        return Resultat(
            titre, "INDISPONIBLE",
            "AUCUN document trouve — le controle ne verifie rien !",
            bloquant=False,
        )

    index_noms = indexer_fichiers()
    certains: list[str] = []      # cité AVEC extension et absent → le doc ment
    incertains: list[str] = []    # sans extension → peut être une tournure de phrase
    verifies = 0

    for doc in existants:
        texte = doc.read_text(encoding="utf-8", errors="replace")
        # On ignore les blocs ``` (exemples de code) : seuls les `inline` comptent
        texte = re.sub(r"```.*?```", "", texte, flags=re.DOTALL)

        # ── Document PROSPECTIF ──────────────────────────────────────────────
        # Une note de conception, une roadmap, un ADR ou un post-mortem citent
        # LÉGITIMEMENT des fichiers qui n'existent pas : pas encore (module à
        # écrire) ou plus (fichier supprimé, cité justement parce qu'il a
        # disparu). Sans échappatoire, LEON bloque le push et pousse à écrire
        # ces documents AILLEURS que dans `Notes/` — il fabrique l'angle mort
        # qu'il prétend supprimer. Constaté le 12/08/2026 : ce contrôle a
        # recalé la note de conception qui décrivait sa propre correction.
        #
        #     <!-- leon:prospectif -->   en tête du document
        #
        # → ses chemins introuvables deviennent consultatifs (VERIF), jamais
        #   bloquants. Le contrôle continue de les LISTER : on informe, on
        #   n'interdit pas.
        prospectif = "leon:prospectif" in texte

        deja_vus: set[str] = set()
        for token in re.findall(r"`([^`\n]+)`", texte):
            token = token.strip().rstrip("/").removeprefix("./")
            if not est_un_chemin(token) or token in deja_vus:
                continue
            deja_vus.add(token)
            verifies += 1
            if existe(token, index_noms):
                continue
            # La mémoire vit HORS du dépôt : pas de lien cliquable possible,
            # on se contente de son nom de fichier.
            if doc.is_relative_to(config.RACINE):
                source = lien(doc.relative_to(config.RACINE).as_posix())
            else:
                source = f"`{doc.name}`"
            ligne = f"{source} → `{token}`"
            # Une extension explicite = une affirmation vérifiable. Sans extension,
            # ça peut être du texte → consultatif, on ne bloque pas dessus.
            affirmatif = bool(re.search(r"\.\w{2,4}(:\d|$)", token))
            if affirmatif and not prospectif:
                certains.append(ligne)
            else:
                incertains.append(ligne + (" *(doc prospectif)*" if prospectif else ""))

    resume = f"{verifies} chemin(s) cite(s), {len(certains)} introuvable(s)"
    if incertains:
        resume += f", {len(incertains)} a verifier"
    if not certains and not incertains:
        return Resultat(titre, "OK", resume)

    detail = ""
    if certains:
        detail += "**INTROUVABLES — le document ment :**\n\n"
        detail += "\n".join(f"- {x}" for x in sorted(set(certains)))
    if incertains:
        if certains:
            detail += "\n\n"
        detail += ("**À VÉRIFIER** — cité sans extension : c'est peut-être une "
                   "tournure de phrase, ou un fichier encore à créer.\n\n")
        detail += "\n".join(f"- {x}" for x in sorted(set(incertains)))

    # ALERTE si un chemin est faux · VERIF s'il n'y a que des « à vérifier ».
    # Avant, ce cas retombait sur OK — et `ecrire_rapport` n'écrit pas le
    # détail d'un OK : le résumé annonçait « 1 a verifier » sans jamais dire
    # LEQUEL. L'information était produite puis jetée (trouvé par le dev).
    statut = "ALERTE" if certains else "VERIF"

    return Resultat(
        titre, statut, resume, detail,
        bloquant=bool(certains) and bloquant_possible,
        detail_markdown=True,
    )


def controle_doc() -> Resultat:
    """La doc du dépôt (CLAUDE.md, ARCHITECTURE.md…) — peut bloquer un push."""
    return _verifier_documents("Doc vs code", config.DOCS_A_VERIFIER, bloquant_possible=True)


def controle_memoire_ia() -> Resultat:
    """La mémoire de l'assistant — CONSULTATIF, ne bloque jamais.

    Pourquoi la surveiller quand même : elle vit HORS du dépôt, donc elle n'est
    pas versionnée, personne ne la relit, et rien ne la confronte au code. Un
    chemin périmé y survit indéfiniment — c'est exactement ce qui est arrivé à
    `utils/generatePdf.ts`, présenté comme le pivot du chantier Factur-X alors
    que le fichier avait été supprimé.
    """
    if config.MEMOIRE_IA is None:
        # On dit POURQUOI on ne trouve rien, et comment reprendre la main :
        # un « INDISPONIBLE » sans explication se confond avec un « rien à
        # signaler » au bout de trois lectures.
        return Resultat(
            "Memoire IA vs code", "INDISPONIBLE",
            f"dossier memoire introuvable ({config.MEMOIRE_IA_ORIGINE})"
            " - voir LEON_MEMOIRE dans tools/.env.example",
            bloquant=False,
        )

    fichiers = sorted(config.MEMOIRE_IA.glob("*.md"))
    if not fichiers:
        return Resultat("Memoire IA vs code", "INDISPONIBLE", "aucun fichier memoire", bloquant=False)

    return _verifier_documents("Memoire IA vs code", fichiers, bloquant_possible=False)


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON 3 — la mémoire est-elle encore FRAÎCHE ?
# ─────────────────────────────────────────────────────────────────────────────
# « Memoire IA vs code » répond à : les chemins cités existent-ils ?
# Celui-ci répond à : ce que la mémoire raconte de ces fichiers est-il encore
# d'actualité ? Les deux sont indépendants — la section RGPD de la roadmap avait
# ZÉRO chemin cassé et affirmait quand même le contraire du code, pendant deux
# semaines (12/08/2026).
#
# LE PRINCIPE : une date saisie à la main ment dès qu'on oublie de la changer.
# Git, lui, n'oublie rien. On ne demande donc à l'humain qu'UNE chose — la date
# de sa dernière vérification — et c'est git qui dit si elle a péri.
_RX_VERIFIE_LE = re.compile(r"^\s*verifie_le\s*:\s*(\d{4}-\d{2}-\d{2})\s*$", re.M)


def _pathspecs_cites(texte: str) -> list[str]:
    """Les chemins cités par un document, traduits en **pathspecs git**.

    Deux formes, parce qu'une mémoire emploie les deux :
      - `matorn/backend/factures/models.py` → chemin repo-relatif, tel quel
      - `OrPdfTemplate.tsx` (nom NU)        → `:(glob)**/OrPdfTemplate.tsx`

    ⚠️ Le nom nu est le cas **majoritaire** en mémoire : on y écrit « le
    template `OrPdfTemplate.tsx` », jamais son chemin complet. Une première
    version ne résolvait que les chemins complets — elle trouvait 0 fichier
    sur `project_generateur_pdf.md`, donc 0 commit, donc un contrôle qui
    serait resté VERT à jamais. Trouvé par son propre test le 12/08/2026 :
    le pire des bugs, celui qui ne fait rien de visible.
    """
    texte = re.sub(r"```.*?```", "", texte, flags=re.DOTALL)
    specs: set[str] = set()

    for token in re.findall(r"`([^`\n]+)`", texte):
        token = token.strip().rstrip("/").removeprefix("./")
        if not est_un_chemin(token):
            continue
        token = re.sub(r":\d+(-\d+)?$", "", token)

        if "/" in token:
            for racine in config.RACINES_RESOLUTION:
                cible = racine / token
                if cible.exists():
                    try:
                        specs.add(cible.resolve().relative_to(config.RACINE).as_posix())
                    except ValueError:
                        pass      # hors dépôt : git n'a rien à en dire
                    break
        elif token.endswith(config.EXTENSIONS):
            # git retrouvera le fichier où qu'il soit rangé dans le dépôt
            specs.add(f":(glob)**/{token}")

    return sorted(specs)


# Séparateur de commits dans la sortie de `git log`.
#
# ⚠️ DEUX pièges payés le 12/08/2026, tous deux silencieux :
#   1. PAS un caractère nul : Windows refuse un octet 0 dans un argument de
#      processus (`ValueError: embedded null character`).
#   2. Le préfixe `format:` est OBLIGATOIRE. `--format=<chaîne libre>` est
#      refusé par git (« invalid --pretty format ») : il n'accepte qu'un nom
#      de format connu (oneline, short…) ou `format:` / `tformat:`. Sans le
#      préfixe, git sortait en 128, la fonction avalait l'échec et renvoyait
#      « 0 commit » — donc un contrôle VERT sur une mémoire périmée.
_SENTINELLE = "@@LEON-COMMIT@@"


def _commits_depuis(depuis: str, pathspecs: list[str]) -> tuple[int, list[str] | None]:
    """(nombre de commits, fichiers touchés) depuis cette date.

    `--name-only` combiné à un pathspec ne liste QUE les fichiers concernés :
    c'est git qui filtre, on n'a aucun recoupement à faire nous-mêmes.

    Renvoie `(0, None)` — et non `(0, [])` — quand git est en panne. L'appelant
    DOIT distinguer « rien n'a bougé » de « je n'ai pas pu regarder » : c'est
    précisément la confusion qui a rendu ce contrôle faussement vert.
    """
    try:
        sortie = subprocess.run(
            ["git", "log", f"--since={depuis}", f"--format=format:{_SENTINELLE}",
             "--name-only", "--", *pathspecs],
            cwd=config.RACINE, capture_output=True, text=True, timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return 0, None

    if sortie.returncode != 0:
        return 0, None

    nb = 0
    touches: set[str] = set()
    for ligne in sortie.stdout.splitlines():
        ligne = ligne.strip()
        if ligne == _SENTINELLE:
            nb += 1
        elif ligne:
            touches.add(ligne)
    return nb, sorted(touches)


def controle_fraicheur_memoire() -> Resultat:
    """Une mémoire dont le code cité a bougé depuis sa dernière vérification.

    CONSULTATIF, jamais bloquant : « suspect » ne veut pas dire « faux ». Le
    code peut avoir changé sans invalider ce que la mémoire en dit. Le contrôle
    ne juge pas, il DÉSIGNE quoi relire — et c'est déjà énorme sur un projet
    où l'on n'ouvre jamais spontanément un fichier mémoire vieux de trois
    semaines.
    """
    titre = "Fraicheur memoire (git)"

    if config.MEMOIRE_IA is None:
        return Resultat(titre, "INDISPONIBLE",
                        f"dossier memoire introuvable ({config.MEMOIRE_IA_ORIGINE})",
                        bloquant=False)

    fichiers = sorted(config.MEMOIRE_IA.glob("*.md"))
    if not fichiers:
        return Resultat(titre, "INDISPONIBLE", "aucun fichier memoire", bloquant=False)

    suspectes: list[str] = []
    jamais: list[str] = []
    injoignables: list[str] = []
    fraiches = 0
    hors_perimetre = 0

    for doc in fichiers:
        texte = doc.read_text(encoding="utf-8", errors="replace")

        # ⚠️ On regarde les chemins AVANT la date. Une mémoire qui ne cite aucun
        # fichier — un profil, des préférences de travail — ne peut pas périmer
        # à cause du code : git n'a rien à en dire. Lui réclamer une date de
        # vérification serait du bruit permanent, et un contrôle bruyant finit
        # par ne plus être lu. Elle est HORS PÉRIMÈTRE, pas « en retard ».
        pathspecs = _pathspecs_cites(texte)
        if not pathspecs:
            hors_perimetre += 1
            continue

        trouve = _RX_VERIFIE_LE.search(texte)
        if not trouve:
            jamais.append(doc.name)
            continue

        depuis = trouve.group(1)

        nb, touches = _commits_depuis(depuis, pathspecs)
        if touches is None:
            # git n'a pas répondu : on ne SAIT pas. Surtout ne pas compter
            # cette mémoire comme fraîche — ce serait affirmer sans avoir vu.
            injoignables.append(doc.name)
            continue
        if nb == 0:
            fraiches += 1
            continue

        detail_fichiers = "\n".join(f"    - `{f}`" for f in touches[:6])
        if len(touches) > 6:
            detail_fichiers += f"\n    - *… et {len(touches) - 6} autre(s)*"
        suspectes.append(
            f"- **`{doc.name}`** — vérifiée le {depuis}, **{nb} commit(s) depuis** sur :\n"
            f"{detail_fichiers}"
        )

    resume = f"{fraiches} fraiche(s), {len(suspectes)} suspecte(s)"
    if jamais:
        resume += f", {len(jamais)} sans date"
    if hors_perimetre:
        resume += f", {hors_perimetre} sans code cite"
    if injoignables:
        resume += f", {len(injoignables)} NON VERIFIABLE(S) (git muet)"

    if not suspectes and not jamais and not injoignables:
        return Resultat(titre, "OK", resume, bloquant=False)

    detail = ""
    if suspectes:
        detail += ("**À RELIRE** — du code cité a changé depuis la dernière "
                   "vérification. Ce n'est pas une erreur : c'est un doute.\n\n")
        detail += "\n".join(suspectes)
    if jamais:
        if suspectes:
            detail += "\n\n"
        detail += (
            "**SANS DATE** — ces mémoires n'ont jamais été confrontées au code. "
            "Ajouter `verifie_le: AAAA-MM-JJ` dans leur frontmatter après les "
            "avoir relues :\n\n"
        )
        detail += "\n".join(f"- `{n}`" for n in jamais)
    if injoignables:
        if detail:
            detail += "\n\n"
        detail += (
            "**NON VÉRIFIABLES** — git n'a pas répondu pour ces mémoires. Le "
            "contrôle ne dit rien sur elles : ce n'est **pas** un feu vert.\n\n"
        )
        detail += "\n".join(f"- `{n}`" for n in injoignables)

    # VERIF et pas ALERTE : rien n'est cassé, il y a des choses à regarder.
    return Resultat(titre, "VERIF", resume, detail, bloquant=False, detail_markdown=True)


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON 2 — les règles de CLAUDE.md sont-elles tenues ?
# ─────────────────────────────────────────────────────────────────────────────
def controle_regles_maison() -> Resultat:
    infractions: list[str] = []
    bloquant_touche = False
    lignes_detail: list[str] = []

    for regle in config.REGLES_MAISON:
        par_fichier: dict[str, int] = {}

        for chemin in regle["racine"].rglob("*"):
            if not chemin.is_file() or chemin.suffix not in regle["suffixes"]:
                continue
            if any(partie in config.IGNORES for partie in chemin.parts):
                continue
            relatif = chemin.relative_to(config.RACINE).as_posix()
            if any(exclu in relatif for exclu in regle["exclure"]):
                continue

            nb = len(regle["motif"].findall(chemin.read_text(encoding="utf-8", errors="replace")))
            if nb:
                par_fichier[relatif] = nb

        total = sum(par_fichier.values())
        if not total:
            continue

        if regle["bloquant"]:
            bloquant_touche = True
        infractions.append(f"{regle['nom']} : {total}")

        marque = "BLOQUANT" if regle["bloquant"] else "consultatif"
        lignes_detail += [
            "",
            f"### {regle['nom']} — {total} occurrence(s) *[{marque}]*",
            "",
            f"> {regle['regle']}",
            "",
        ]
        # Les 8 fichiers les plus concernés suffisent à savoir par où commencer.
        # Chemins en LIENS : un clic ouvre le fichier dans l'éditeur.
        pires = sorted(par_fichier.items(), key=lambda x: -x[1])[:8]
        lignes_detail += [f"- **{nb}** × {lien(fichier)}" for fichier, nb in pires]
        if len(par_fichier) > 8:
            lignes_detail.append(f"- *… et {len(par_fichier) - 8} autre(s) fichier(s)*")

    if not infractions:
        return Resultat("Regles maison (CLAUDE.md)", "OK", "toutes les regles sont tenues")

    return Resultat(
        "Regles maison (CLAUDE.md)", "ALERTE",
        " | ".join(infractions), "\n".join(lignes_detail),
        bloquant=bloquant_touche,
        detail_markdown=True,
    )


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON 3 — le garde-fou est-il lui-même en place ?
# ─────────────────────────────────────────────────────────────────────────────
def controle_hook_git() -> Resultat:
    """Le hook pre-push est-il RÉELLEMENT branché sur ce clone ?

    LA FAILLE : `core.hooksPath` vit dans `.git/config`, un fichier que git ne
    versionne PAS. Le hook, lui, est bien dans le dépôt (`tools/hooks/`) et
    voyage avec — mais le RÉGLAGE qui dit à git d'aller l'y chercher, non. Sur
    un clone frais (autre PC, Codespaces, collègue), git regarde dans
    `.git/hooks/`, n'y trouve rien, ne dit rien, et le push part sans le
    moindre contrôle.

    C'est exactement le scénario que LEON traite partout ailleurs comme le plus
    grave : un garde-fou qui ne garde plus rien tout en paraissant sain.

    NON BLOQUANT à dessein : quand le réglage manque, le hook ne tourne pas —
    bloquer un push serait donc de toute façon impossible. Ce contrôle sert aux
    lancements À LA MAIN, le seul moment où l'on peut encore s'en apercevoir.
    """
    titre = "Hook pre-push (LEON)"

    if not (config.HOOKS / "pre-push").is_file():
        return Resultat(titre, "ALERTE",
                        "le fichier hooks/pre-push a disparu du depot",
                        bloquant=False)

    try:
        sortie = subprocess.run(
            ["git", "config", "--get", "core.hooksPath"],
            cwd=config.RACINE, capture_output=True, text=True, timeout=10,
            # check=False EXPRÈS : `git config --get` sort en 1 quand la clé
            # est absente. Or c'est précisément le cas qu'on veut détecter —
            # lever une exception ici masquerait la panne qu'on cherche.
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as erreur:
        return Resultat(titre, "ERREUR", f"git injoignable : {erreur}", bloquant=False)

    actuel = sortie.stdout.strip().replace("\\", "/")
    if actuel == config.HOOKS_ATTENDU:
        return _controle_hook_executable(titre)

    etat = "non configure" if not actuel else f"pointe ailleurs ({actuel})"
    return Resultat(
        titre, "ALERTE",
        f"NON BRANCHE ({etat}) - `git push` ne controle RIEN",
        "`core.hooksPath` vit dans `.git/config`, un fichier que git **ne "
        "versionne pas** : il ne suit donc pas les clones. Tant qu'il n'est "
        "pas posé, `git push` n'exécute aucun contrôle — sans le moindre "
        "message d'avertissement.\n\n"
        "Pour le brancher (une seule fois par clone, depuis la racine) :\n\n"
        "```bash\n"
        f"git config core.hooksPath {config.HOOKS_ATTENDU}\n"
        "```\n\n"
        "ou, strictement équivalent : `python matorn/tools/LEON.py --installer-hook`",
        bloquant=False,
        detail_markdown=True,
    )


def _controle_hook_executable(titre: str) -> Resultat:
    """`core.hooksPath` est bon — reste à savoir si git a le DROIT de lancer.

    LA PANNE VÉCUE (16/08/2026) : git refuse d'exécuter un hook qui n'a pas le
    bit exécutable, et il le fait EN SILENCE — pas de message, pas d'erreur, le
    push part simplement sans contrôle. Le hook avait été créé sous Windows, où
    ce bit n'existe pas (`core.filemode=false`, Git Bash lance tout) ; il est
    donc parti dans le dépôt en 100644. Tant que le projet est resté sous
    Windows, personne n'a rien vu. Au passage sous Linux, le hook est mort ce
    jour-là — et LEON affichait toujours `[ OK ] branche`.

    C'était donc le pire cas possible : pas un rouge, pas même un `[ERR!]`, mais
    un VERT sur un garde-fou mort. Plusieurs jours de push en confiance.

    DEUX vérifications, parce que ce sont deux pannes différentes :
      * le bit sur le DISQUE   -> décide si git lance le hook ICI, maintenant
      * le mode dans l'INDEX   -> décide s'il le lancera sur TOUS les clones
    Réparer l'un sans l'autre laisse la moitié du problème en place : un
    `chmod` seul se perd au prochain clone, un mode git seul ne débloque pas la
    machine courante tant que le fichier n'est pas ressorti du dépôt.
    """
    chemin = config.HOOKS / "pre-push"
    fautes: list[str] = []

    # 1. LE DISQUE. Sauté sous Windows : NTFS n'a pas de bit exécutable, et
    #    `os.access(X_OK)` y répond n'importe quoi. Là-bas, Git Bash lance le
    #    hook quel que soit le mode — le seul vrai risque est le mode git.
    if os.name != "nt" and not os.access(chemin, os.X_OK):
        fautes.append("pas executable sur le disque")

    # 2. L'INDEX GIT. Le mode voyage avec le dépôt : c'est lui qui décide du
    #    sort de Codespaces et de toute machine future.
    mode = _mode_git(chemin)
    if mode is not None and not mode.endswith("755"):
        fautes.append(f"enregistre en {mode} dans git (attendu 100755)")

    if not fautes:
        return Resultat(titre, "OK", "branche et executable - LEON tournera avant chaque push")

    return Resultat(
        titre, "ALERTE",
        f"BRANCHE MAIS MUET - {' + '.join(fautes)}",
        "`core.hooksPath` est bien posé, mais **git n'exécutera pas** ce "
        "fichier : il refuse tout hook dépourvu du bit exécutable, et il le "
        "fait **sans le moindre message**. `git push` repart donc sans aucun "
        "contrôle, avec un voyant au vert.\n\n"
        "Les deux lignes de la réparation (les deux sont nécessaires) :\n\n"
        "```bash\n"
        f"chmod +x {config.HOOKS_ATTENDU}/pre-push\n"
        f"git add {config.HOOKS_ATTENDU}/pre-push\n"
        "```\n\n"
        "`chmod` débloque **cette machine**, `git add` enregistre le mode "
        "`100755` dans le dépôt pour **tous les clones à venir**. Sous Windows, "
        "où `chmod` n'a pas d'effet, la seconde ligne devient "
        f"`git update-index --chmod=+x {config.HOOKS_ATTENDU}/pre-push`.",
        bloquant=False,
        detail_markdown=True,
    )


def _mode_git(chemin: Path) -> str | None:
    """Mode enregistré dans l'index git (`100644`, `100755`), ou None.

    None = question sans réponse fiable (git muet, fichier pas encore suivi) →
    l'appelant ne doit alors RIEN conclure. Un contrôle qui invente un verdict
    quand il n'a pas la donnée est exactement le défaut qu'on corrige ici.
    """
    try:
        # `relative_to` lève ValueError sur un chemin hors dépôt : c'est une
        # question sans réponse, pas une panne — donc None comme le reste.
        relatif = chemin.relative_to(config.RACINE).as_posix()
        sortie = subprocess.run(
            ["git", "ls-files", "-s", "--", relatif],
            cwd=config.RACINE, capture_output=True, text=True, timeout=10, check=False,
        )
    except (OSError, ValueError, subprocess.SubprocessError):
        return None

    premiere = sortie.stdout.strip().split("\n")[0] if sortie.stdout.strip() else ""
    return premiere.split()[0] if premiere else None


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MAISON 5 — les outils LENTS ont-ils tourné récemment ?
# ─────────────────────────────────────────────────────────────────────────────
def controle_audit_complet() -> Resultat:
    """`--rapide` saute vulture et pip-audit. Qui rappelle de les lancer ?

    Personne, jusqu'ici — et c'est comme ça que 3 failles de sécurité connues
    (cryptography, pypdf) ont dormi dans le projet : `pip-audit` ne tourne ni en
    `--rapide`, ni dans le hook pre-push.

    POURQUOI UN RAPPEL DANS L'OUTIL plutôt qu'une tâche planifiée : un
    planificateur qui meurt ne prévient personne. Le rappel, lui, apparaît dans
    l'audit qu'on lance déjà tous les jours. Et il marche sur n'importe quel OS.

    ⚠️ Ce contrôle est le seul dont la valeur DÉCROÎT avec le temps sans que le
    code change : une faille publiée demain concerne un projet figé depuis un an.
    """
    titre = "Audit complet (outils lents)"
    dernier = lire_etat().get("dernier_audit_complet")

    relance = ("Les outils **lents** — `vulture` et surtout **`pip-audit`** — ne "
               "tournent ni en `--rapide`, ni dans le hook pre-push. `pip-audit` "
               "signale les **failles de sécurité connues** de tes dépendances : "
               "elles apparaissent sans que ton code bouge.\n\n"
               "```bash\npython matorn/tools/LEON.py\n```")

    if not dernier:
        return Resultat(titre, "VERIF", "jamais lance sur cette machine",
                        relance, bloquant=False, detail_markdown=True)

    try:
        date = datetime.date.fromisoformat(str(dernier)[:10])
    except ValueError:
        return Resultat(titre, "VERIF", "date illisible dans .leon_etat.json",
                        relance, bloquant=False, detail_markdown=True)

    jours = (datetime.date.today() - date).days
    if jours <= config.JOURS_AUDIT_COMPLET:
        return Resultat(titre, "OK", f"lance il y a {jours} jour(s)", bloquant=False)

    return Resultat(
        titre, "VERIF",
        f"{jours} jours sans audit complet (seuil : {config.JOURS_AUDIT_COMPLET})",
        relance, bloquant=False, detail_markdown=True,
    )


CONTROLES_INTERNES = {
    "doc_vs_code": controle_doc,
    "memoire_ia": controle_memoire_ia,
    "fraicheur_memoire": controle_fraicheur_memoire,
    "regles_maison": controle_regles_maison,
    "hook_git": controle_hook_git,
    "audit_complet": controle_audit_complet,
}


# ─────────────────────────────────────────────────────────────────────────────
# ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────
def executer(rapide: bool = False) -> list[Resultat]:
    """Lance tout ce que config.py déclare, dans l'ordre."""
    resultats: list[Resultat] = []

    for entree in config.COMMANDES:
        if rapide and entree["lent"]:
            # ⚠️ On NE saute PAS en silence : un contrôle absent du rapport
            # laisserait croire qu'il a tourné. C'est grave pour pip-audit
            # (failles de sécurité) — on préfère une ligne explicite.
            resultats.append(Resultat(
                entree["titre"], "INDISPONIBLE",
                "NON EXECUTE (mode --rapide) — relancer sans --rapide",
                bloquant=False,
            ))
            continue
        resultat = lancer(
            entree["titre"], entree["cmd"], entree["cwd"],
            bloquant=entree["bloquant"],
            # Chaque outil a sa propre convention de codes de sortie.
            codes_alerte=entree.get("codes_alerte", (1,)),
        )
        traducteur = TRADUCTEURS.get(entree["traduction"])
        if traducteur and resultat.statut == "ALERTE":
            resultat = traducteur(resultat)
        resultats.append(resultat)

    for nom, actif in config.CONTROLES_INTERNES.items():
        if actif and nom in CONTROLES_INTERNES:
            resultats.append(CONTROLES_INTERNES[nom]())

    return resultats
