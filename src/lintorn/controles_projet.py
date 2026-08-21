# Lintorn
"""Les controles qui jugent LE PROJET.

Sa documentation, la memoire de son assistant IA, ses regles maison.
Ce sont ceux qu'aucun outil du marche ne fait a ta place.

Les controles qui surveillent Lintorn LUI-MEME vivent a cote,
dans `controles_outillage.py`.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from . import config
from .base import Resultat, lien

# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE DE DOCUMENTATION — la doc dit-elle encore la vérité ?
# ─────────────────────────────────────────────────────────────────────────────
# Le code a ruff, tsc et les tests pour le surveiller. La documentation, elle,
# n'a RIEN : personne ne vérifie qu'elle décrit encore le projet. Elle affirme
# donc tranquillement qu'un fichier existe alors qu'il a été supprimé, ou qu'un
# module est écrit dans un langage qu'il a quitté depuis longtemps.
#
# C'est sans gravité tant qu'un humain la lit en diagonale. Ça ne l'est plus
# quand un assistant IA la lit intégralement et agit dessus.

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
    test_Lintorn.py pour qu'ils ne reviennent pas.
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


def existe(token: str, index_noms: set[str], depuis: Path | None = None) -> bool:
    """Le chemin cité correspond-il à quelque chose de réel ?

    `index_noms` est passé en PARAMÈTRE : la fonction ne dépend que de ses
    arguments, donc elle est testable seule et ne peut pas tomber sur un index
    vide (c'était un défaut de la première version).

    ⚠️ `depuis` = le dossier du DOCUMENT qui cite ce chemin, et il est
    indispensable. Un document écrit presque toujours ses liens relativement à
    lui-même : `advanced/nosql.md` cité depuis `docs/fr/` désigne
    `docs/fr/advanced/nosql.md`, pas un fichier à la racine du dépôt.
    Sans cette racine supplémentaire, une documentation organisée en
    sous-dossiers se retrouve massivement — et faussement — signalée comme
    cassée. Constaté sur un projet réel : 474 faux positifs d'un coup, soit
    un quart des chemins cités. À ce niveau de bruit, plus personne ne lit.
    """
    token = re.sub(r":\d+(-\d+)?$", "", token)   # `models.py:17-34` → `models.py`

    # Un import TS s'écrit sans extension (`utils/dataFormatters`) → on les essaie
    candidats = [token]
    if not token.endswith(config.EXTENSIONS):
        candidats += [token + ext for ext in (".ts", ".tsx", ".js", ".jsx", ".py")]

    # Le dossier du document passe EN PREMIER : c'est la lecture la plus
    # naturelle d'un lien écrit dans un document.
    racines = ([depuis] if depuis else []) + list(config.RACINES_RESOLUTION)

    for candidat in candidats:
        if "/" in candidat:
            if any((racine / candidat).exists() for racine in racines):
                return True
        elif candidat in index_noms:
            return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# LE GENRE D'UN DOCUMENT : décrit-il CE projet, ou parle-t-il d'autre chose ?
# ─────────────────────────────────────────────────────────────────────────────
# Trois genres citent des fichiers absents sans mentir pour autant :
#
#   1. la note prospective — marquée à la main
#   2. le JOURNAL DE VERSIONS — il cite ce qui existait A L'EPOQUE
#   3. le TUTORIEL — il apprend au lecteur à créer des fichiers CHEZ LUI
#
# MESURÉ SUR FASTAPI, 1693 documents. Sans cette distinction : 460 chemins
# bloquants au premier lancement — un mur qui fait fermer l'outil. Avec la
# seule échappatoire existante (`docs_exclus = ["docs/*"]`) : 98 % de la
# documentation cessait d'être lue, pour un « OK » sur 2 chemins. Le remède
# était pire que le mal : c'est le faux vert que Lintorn combat partout.
#
# LE SIGNAL. La répartition est nette, et bimodale : 146 documents n'ont AUCUN
# chemin absent, 207 les ont TOUS absents. Un document décrit ce projet, ou il
# parle d'autre chose — rarement les deux. D'où la règle, énonçable en une
# phrase : **si la majorité de ce qu'un document cite n'existe pas ici, il ne
# décrit pas ce projet.**
#
# ⚠️ SEUIL DELIBEREMENT ROND. « Plus de la moitié » se justifie tout seul.
#    L'ajuster jusqu'à ce qu'un projet précis passe au vert reviendrait à
#    truquer la mesure — et à casser ailleurs. Vérifié : sur Lintorn et sur
#    Matorn, ZERO document requalifié, aucune trouvaille perdue.
_RX_JOURNAL = re.compile(r"(change ?log|release[-_ ]notes?|history|news)", re.I)
_SEUIL_AUTRE_GENRE = 0.5


def _genre_du_document(doc, texte: str, cites: int, absents: int) -> str:
    """Ce qui autorise ce document à citer des fichiers absents, ou "" sinon."""
    if "lintorn:prospectif" in texte:
        return "doc prospectif"
    if _RX_JOURNAL.search(doc.name):
        return "journal de versions"
    # `cites >= 2` : sur une seule citation, un taux de 100 % ne veut rien dire.
    # C'est précisément le cas d'un vrai pourrissement de doc — un fichier
    # renommé, cité une fois. On ne l'excuse pas.
    if cites >= 2 and absents / cites > _SEUIL_AUTRE_GENRE:
        return f"{absents}/{cites} absents : ne decrit pas ce projet"
    return ""


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
    autre_genre = 0               # documents requalifiés : tutoriel, journal…
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
        # disparu). Sans échappatoire, Lintorn bloque le push et pousse à écrire
        # ces documents AILLEURS que dans les dossiers scannés — il fabrique
        # alors l'angle mort qu'il prétend supprimer. Sans échappatoire, il
        # recale jusqu'à la note qui décrit sa propre correction.
        #
        #     <!-- lintorn:prospectif -->   en tête du document
        #
        # → ses chemins introuvables deviennent consultatifs (VERIF), jamais
        #   bloquants. Le contrôle continue de les LISTER : on informe, on
        #   n'interdit pas.
        # On collecte les trouvailles de CE document avant de trancher : le
        # genre ne se connait qu'une fois le document entierement lu.
        deja_vus: set[str] = set()
        cites = 0
        doc_certains: list[str] = []
        doc_incertains: list[str] = []

        for token in re.findall(r"`([^`\n]+)`", texte):
            token = token.strip().rstrip("/").removeprefix("./")
            if not est_un_chemin(token) or token in deja_vus:
                continue
            deja_vus.add(token)
            verifies += 1
            cites += 1
            if existe(token, index_noms, depuis=doc.parent):
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
            if re.search(r"\.\w{2,4}(:\d|$)", token):
                doc_certains.append(ligne)
            else:
                doc_incertains.append(ligne)

        absents = len(doc_certains) + len(doc_incertains)
        genre = _genre_du_document(doc, texte, cites, absents)
        if genre:
            # Requalifie : on LISTE toujours, on ne bloque plus.
            autre_genre += 1
            incertains += [f"{ligne} *({genre})*"
                           for ligne in doc_certains + doc_incertains]
        else:
            certains += doc_certains
            incertains += doc_incertains

    # ⚠️ SECOND GARDE-FOU, jumeau de celui du haut. Les documents existent,
    # mais aucun ne cite le moindre chemin : il n'y a rien eu a verifier, et
    # afficher « OK » laisserait croire que la documentation a ete controlee.
    #
    # C'est le meme mensonge que « 0 document trouve » traite plus haut, sauf
    # qu'il survient un cran plus loin — une doc qui parle sans jamais citer
    # de fichier entre backticks. Vu sur un projet Go dont le README n'en
    # contenait aucun : le controle affichait OK sans avoir rien lu.
    if verifies == 0:
        return Resultat(
            titre, "INDISPONIBLE",
            f"{len(existants)} document(s) lu(s), AUCUN chemin cite - rien a verifier",
            "Lintorn ne verifie que ce qui est ecrit entre backticks : "
            "`services/api.ts` est une affirmation verifiable, alors que le "
            "meme nom en pleine phrase n'est qu'un mot.\n\n"
            "Si ta documentation cite des fichiers, mets-les entre backticks "
            "et ce controle prendra vie.",
            bloquant=False,
            detail_markdown=True,
        )

    resume = f"{verifies} chemin(s) cite(s), {len(certains)} introuvable(s)"
    if incertains:
        resume += f", {len(incertains)} a verifier"
    # ⚠️ ANNONCE OBLIGATOIRE. Requalifier 170 documents sans le dire serait
    # exactement le silence que Lintorn combat : l'utilisateur croirait sa doc
    # entierement controlee. On chiffre ce qu'on a mis de cote.
    if autre_genre:
        resume += f", {autre_genre} doc(s) d'un autre genre"
    if not certains and not incertains:
        return Resultat(titre, "OK", resume)

    detail = ""
    if certains:
        detail += "**INTROUVABLES — le document ment :**\n\n"
        detail += "\n".join(f"- {x}" for x in sorted(set(certains)))
    if incertains:
        if certains:
            detail += "\n\n"
        detail += ("**À VÉRIFIER** — cité sans extension (peut-être une tournure de "
                   "phrase, ou un fichier à créer), ou cité par un document qui ne "
                   "décrit pas ce projet : tutoriel, journal de versions, note "
                   "prospective. La raison est indiquée à chaque ligne.\n\n")
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
    chemin périmé y survit donc indéfiniment — et l'assistant continue de le
    citer avec assurance, longtemps après la disparition du fichier.
    """
    if config.MEMOIRE_IA is None:
        # On dit POURQUOI on ne trouve rien, et comment reprendre la main :
        # un « INDISPONIBLE » sans explication se confond avec un « rien à
        # signaler » au bout de trois lectures.
        return Resultat(
            "Memoire IA vs code", "INDISPONIBLE",
            f"dossier memoire introuvable ({config.MEMOIRE_IA_ORIGINE})"
            " - voir LINTORN_MEMOIRE dans .lintorn/.env",
            bloquant=False,
        )

    fichiers = sorted(config.MEMOIRE_IA.glob("*.md"))
    if not fichiers:
        return Resultat("Memoire IA vs code", "INDISPONIBLE", "aucun fichier memoire", bloquant=False)

    return _verifier_documents("Memoire IA vs code", fichiers, bloquant_possible=False)


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE MEMOIRE — la mémoire est-elle encore FRAÎCHE ?
# ─────────────────────────────────────────────────────────────────────────────
# « Memoire IA vs code » répond à : les chemins cités existent-ils ?
# Celui-ci répond à : ce que la mémoire raconte de ces fichiers est-il encore
# d'actualité ? Les deux sont indépendants — une mémoire peut n'avoir aucun
# chemin casse et affirmer malgré tout le contraire du code.
#
# LE PRINCIPE : une date saisie à la main ment dès qu'on oublie de la changer.
# Git, lui, n'oublie rien. On ne demande donc à l'humain qu'UNE chose — la date
# de sa dernière vérification — et c'est git qui dit si elle a péri.
_RX_VERIFIE_LE = re.compile(r"^\s*verifie_le\s*:\s*(\d{4}-\d{2}-\d{2})\s*$", re.M)


def _pathspecs_cites(texte: str) -> list[str]:
    """Les chemins cités par un document, traduits en **pathspecs git**.



    ⚠️ Le nom nu est le cas **majoritaire** en mémoire : on y écrit « le
     `NOM DU FICHIER` », jamais son chemin complet. Une première
    version ne résolvait que les chemins complets — elle trouvait 0 fichier
    sur `nom_du_fichier.md`, donc 0 commit, donc un contrôle qui
    serait resté VERT à jamais. Trouvé par son propre test :
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
# ⚠️ DEUX pièges, tous deux silencieux :
#   1. PAS un caractère nul : Windows refuse un octet 0 dans un argument de
#      processus (`ValueError: embedded null character`).
#   2. Le préfixe `format:` est OBLIGATOIRE. `--format=<chaîne libre>` est
#      refusé par git (« invalid --pretty format ») : il n'accepte qu'un nom
#      de format connu (oneline, short…) ou `format:` / `tformat:`. Sans le
#      préfixe, git sortait en 128, la fonction avalait l'échec et renvoyait
#      « 0 commit » — donc un contrôle VERT sur une mémoire périmée.
_SENTINELLE = "@@Lintorn-COMMIT@@"


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
# CONTRÔLE DES REGLES — les règles de CLAUDE.md sont-elles tenues ?
# ─────────────────────────────────────────────────────────────────────────────
def controle_regles_maison() -> Resultat:
    # Aucune règle déclarée → on le DIT au lieu d'afficher « toutes les regles
    # sont tenues ». Un vert sur zéro règle est un mensonge par omission :
    # l'utilisateur croit couvert quelque chose qu'il n'a jamais défini.
    if not config.REGLES_MAISON:
        return Resultat(
            "Regles maison", "INDISPONIBLE",
            "aucune regle declaree - voir .lintorn/regles.toml",
            bloquant=False,
        )

    infractions: list[str] = []
    bloquant_touche = False
    lignes_detail: list[str] = []

    for regle in config.REGLES_MAISON:
        par_fichier: dict[str, int] = {}

        # On rassemble d'abord, on filtre ensuite : `hors_gitignore` interroge
        # git UNE fois pour toute la liste, au lieu d'un processus par fichier.
        candidats = [
            chemin for chemin in regle["racine"].rglob("*")
            if chemin.is_file()
            and chemin.suffix in regle["suffixes"]
            and not any(partie in config.IGNORES for partie in chemin.parts)
        ]

        for chemin in config.hors_gitignore(candidats):
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
        return Resultat("Regles maison", "OK", "toutes les regles sont tenues")

    return Resultat(
        "Regles maison", "ALERTE",
        " | ".join(infractions), "\n".join(lignes_detail),
        bloquant=bloquant_touche,
        detail_markdown=True,
    )


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE DE COUVERTURE — les règles ÉNONCÉES sont-elles seulement CONTRÔLÉES ?
# ─────────────────────────────────────────────────────────────────────────────
# « Regles maison » répond à : les règles que j'ai CONFIGURÉES sont-elles tenues ?
# Celui-ci répond à la question d'avant : les règles que j'ai ÉCRITES dans ma
# doc ont-elles seulement un contrôle en face ?
#
# LE PROBLÈME QU'IL RÈGLE. Une règle vit dans CLAUDE.md parce qu'on l'y a
# écrite pour l'assistant. Rien ne la relie au `regles.toml`. L'écart entre
# « ce que je déclare à l'IA » et « ce que je fais respecter » grandit donc en
# silence : personne ne relit une doc pour y chercher ce qui MANQUE ailleurs.
#
# CE QU'IL NE FAIT PAS, ET POURQUOI. Il ne fabrique aucune regex à partir des
# phrases trouvées. « jamais de couleur en dur » ne dit pas s'il faut traquer
# `#fff`, `rgba(`, `hsl()`, ni s'il faut épargner les commentaires : c'est une
# décision technique, pas une traduction. Une regex devinée produirait des faux
# positifs — et un faux positif est ce qui tue la confiance dans l'outil. On
# SIGNALE le trou ; on laisse l'humain écrire la détection.
_RX_BACKTICK = re.compile(r"`([^`\n]{2,80})`")

# Une règle DIT quelque chose d'impératif. Sans ce filtre, toute ligne citant
# un fichier passerait pour une règle.
_RX_IMPERATIF = re.compile(
    r"\b(jamais|uniquement|toujours|doit|doivent|interdit|interdite|obligatoire"
    r"|unique|seule?|impérativement|imperativement|ne pas|proscrit)\b",
    re.I,
)

# La FORME sépare ce qui prescrit de ce qui décrit. Mesuré sur un vrai projet :
# sans ce filtre, 92 lignes remontaient — notes d'architecture et comptes rendus
# d'audit compris, qui *racontent* le système au passé. Avec, 25 lignes, toutes
# de vraies règles. Un projet énonce ses règles dans un TABLEAU de conventions
# ou derrière un marqueur explicite ; il raconte le reste en prose.
_RX_TABLEAU = re.compile(r"^\s*\|.*\|\s*$")
_RX_MARQUEUR_REGLE = re.compile(r"\*\*\s*(r[eè]gle|convention|interdit|obligatoire)", re.I)


def _signe(texte: str) -> str:
    r"""Réduit un texte à ses lettres et chiffres, en minuscules.

    Permet de rapprocher `axios.create()` (dans la doc) de `axios\.create\(`
    (une regex du regles.toml) sans se battre avec les échappements : les deux
    donnent « axioscreate ».
    """
    return re.sub(r"[^0-9a-zà-ÿ]+", "", texte.lower())


def regles_enoncees() -> list[tuple[str, int, str, list[str]]]:
    """Les règles ÉNONCÉES dans les fichiers d'instructions IA.

    Rendu : (document, ligne, phrase, identifiants entre backticks).

    ⚠️ UNE SEULE implémentation, partagée par le contrôle et par l'esquisse
    de `--init`. Deux lecteurs séparés finiraient par diverger, et `--init`
    proposerait des brouillons pour des règles que le contrôle ne compte
    pas : l'outil se contredirait tout seul.
    """
    trouvees: list[tuple[str, int, str, list[str]]] = []

    for document in config.DOCS_IA:
        try:
            lignes = document.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        relatif = document.relative_to(config.RACINE).as_posix()

        for numero, ligne in enumerate(lignes, start=1):
            jetons = _RX_BACKTICK.findall(ligne)
            if not jetons or not _RX_IMPERATIF.search(ligne):
                continue
            if not (_RX_TABLEAU.match(ligne) or _RX_MARQUEUR_REGLE.search(ligne)):
                continue
            phrase = " ".join(ligne.strip().strip("|").split())
            trouvees.append((relatif, numero, phrase, jetons))

    return trouvees


def regles_sans_controle() -> list[tuple[str, int, str, list[str]]]:
    """Celles qu'aucun `[[regles]]` ne fait respecter.

    Deux façons d'être couverte, de la plus sûre à la plus souple :

    1. `source = "CLAUDE.md:23"` dans le regles.toml — un lien EXPLICITE,
       posé par `--init` ou à la main. Aucune ambiguïté possible.
    2. sinon, un identifiant de la ligne se retrouve dans le nom ou le motif
       d'une règle configurée. Heuristique, volontairement indulgente : mieux
       vaut taire une règle déjà surveillée que crier au trou sur une règle
       qui l'est — un contrôle qui crie trop est un contrôle qu'on n'ouvre
       plus.

    ⚠️ Un `source` qui ne correspond plus — la doc a bougé d'une ligne — fait
    RÉAPPARAÎTRE la règle comme non couverte. C'est le bon sens d'échec : on
    ré-alerte au lieu de masquer en silence.
    """
    sources = {
        str(regle["source"]) for regle in config.REGLES_MAISON if regle.get("source")
    }

    # La « signature » de ce qui DÉTECTE : le nom et le motif, rien d'autre.
    #
    # ⚠️ Le champ `regle` en est volontairement ABSENT. C'est de la prose, et
    # elle cite souvent la doc (« CLAUDE.md : … ») : une règle parlant de
    # `.claude/` s'y appariait par simple coïncidence de sous-chaîne
    # (« claude » ⊂ « claudemd ») et passait pour couverte. Un faux
    # « couvert » est pire qu'un faux trou : il fait disparaître du rapport
    # une règle que rien ne surveille.
    signature = _signe(" ".join(
        f"{regle['nom']} {regle['motif'].pattern}" for regle in config.REGLES_MAISON
    ))

    restantes = []
    for relatif, numero, phrase, jetons in regles_enoncees():
        if f"{relatif}:{numero}" in sources:
            continue
        signes = [_signe(jeton) for jeton in jetons]
        if any(len(signe) >= 4 and signe in signature for signe in signes):
            continue
        restantes.append((relatif, numero, phrase, jetons))

    return restantes


def controle_regles_declarees() -> Resultat:
    # On ne lit QUE les fichiers d'instructions IA. La doc générale décrit le
    # système ; seul le fichier d'instructions engage le projet sur des règles.
    if not config.DOCS_IA:
        return Resultat(
            "Regles enoncees vs controlees", "INDISPONIBLE",
            f"aucun fichier d'instructions IA ({', '.join(config.FICHIERS_IA)})"
            " - voir fichiers_ia dans .lintorn/config.toml",
            bloquant=False,
        )

    enoncees = regles_enoncees()
    if not enoncees:
        return Resultat(
            "Regles enoncees vs controlees", "INDISPONIBLE",
            "aucune regle reperee (une regle = une ligne de tableau, ou marquee"
            " **Regle**, qui impose quelque chose en citant du code entre `backticks`)",
            bloquant=False,
        )

    sans_controle = regles_sans_controle()
    total, trou = len(enoncees), len(sans_controle)
    if not trou:
        return Resultat(
            "Regles enoncees vs controlees", "OK",
            f"{total} regle(s) enoncee(s), toutes ont un controle",
        )

    detail = [
        f"**{trou} regle(s) sur {total}** sont ecrites dans la doc sans qu'aucun",
        "`[[regles]]` du `.lintorn/regles.toml` ne les fasse respecter.",
        "",
        "Ce n'est pas une infraction : c'est un ecart entre ce que le projet",
        "**declare** et ce qu'il **verifie**. A chaque ligne, deux issues — ecrire",
        "la regle dans `regles.toml`, ou retirer la phrase de la doc si elle a vieilli.",
        "",
        "`lintorn --esquisser-regles` prepare les blocs `[[regles]]` a completer.",
        "",
    ]
    for chemin, numero, phrase, _ in sans_controle[:12]:
        court = phrase if len(phrase) <= 110 else phrase[:107] + "…"
        detail += [f"- {lien(chemin, numero)}", f"  > {court}", ""]
    if trou > 12:
        detail.append(f"*… et {trou - 12} autre(s).*")

    # VERIF, jamais ALERTE : rien n'est cassé, c'est un point à trancher à l'œil.
    # Bloquer un push la-dessus punirait quelqu'un qui a simplement DOCUMENTÉ
    # une intention — l'inverse du comportement qu'on veut encourager.
    return Resultat(
        "Regles enoncees vs controlees", "VERIF",
        f"{total} enoncee(s), {total - trou} controlee(s), {trou} SANS controle",
        "\n".join(detail), bloquant=False, detail_markdown=True,
    )
