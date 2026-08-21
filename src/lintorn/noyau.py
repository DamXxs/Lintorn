# Lintorn
"""
La mécanique de l'outil. Normalement, tu n'as pas besoin d'y toucher.

  ▸ Pour ajouter un outil    → config.py
    ▸ Pour traduire un code    → traductions.py  (confort seulement : rien n'est traduit
                                    automatiquement, c'est a toi d'ajouter les traductions)
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

from . import config, traductions


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
        config.ETAT.parent.mkdir(parents=True, exist_ok=True)
        config.ETAT.write_text(json.dumps(etat, indent=2), encoding="utf-8")
    except OSError:
        pass    # ne JAMAIS faire échouer un audit parce qu'on n'a pas pu noter la date

# ─────────────────────────────────────────────────────────────────────────────
# LA FICHE DE RÉSULTAT
# ─────────────────────────────────────────────────────────────────────────────
# Ces deux contrôles ne regardent NI le code NI la documentation : ils
# surveillent Lintorn lui-même (son hook, la date de son dernier passage
# complet). Ils peuvent donc être verts sur un projet où rien d'autre n'a
# tourné — et ne doivent jamais, à eux seuls, faire croire à un audit réussi.
TITRES_OUTILLAGE = ("Hook pre-push (Lintorn)", "Audit complet (outils lents)")

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

    Le rapport vit dans `.lintorn/`, donc la racine du dépôt est UN cran
    au-dessus — d'où le `../`. VS Code ouvre le fichier au clic et se place
    sur la bonne ligne grâce à l'ancre `#L42`.

    ⚠️ Ce nombre de crans suit l'emplacement du rapport. Il valait `../../`
    du temps où le rapport vivait deux niveaux plus bas : déplacer le rapport
    sans corriger ici casse SILENCIEUSEMENT tous les liens du rapport, qui
    restent cliquables mais ne mènent nulle part.
    """
    chemin = chemin_racine.replace("\\", "/")
    ancre = f"#L{ligne}" if ligne else ""
    texte = f"{chemin}:{ligne}" if ligne else chemin
    return f"[`{texte}`](../{chemin}{ancre})"


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
            # check=False EXPRES : le code de sortie est la DONNEE qu'on
            # analyse, pas un incident. Lever ici masquerait le resultat.
            check=False,
        )
    except FileNotFoundError:
        return Resultat(titre, "INDISPONIBLE", f"outil introuvable : {commande[0]}", bloquant=False)
    except subprocess.TimeoutExpired:
        return Resultat(titre, "INDISPONIBLE", "delai depasse (10 min)", bloquant=False)

    sortie = (proc.stdout + proc.stderr).strip()

    # ⚠️ `python -m outil` quand l'outil n'est PAS installé : python existe, il
    # démarre, et sort en 1 avec « No module named x ». Pour le code de sortie
    # c'est indiscernable de « l'outil a tourné et trouvé 1 problème ».
    #
    # Sans ce cas, Lintorn annonçait « 1 alerte de lint » à quiconque n'avait
    # pas ruff — un rouge sur du code qu'il n'avait jamais lu. Trouvé par
    # Lintorn sur son propre depot, le jour ou il a su s'auditer.
    if "No module named" in sortie:
        manquant = sortie.rsplit("No module named", 1)[-1].strip().strip("'\"")
        return Resultat(
            titre, "INDISPONIBLE",
            f"{manquant} n'est pas installe - `lintorn --installer-outils`",
            sortie, bloquant=False,
        )

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
        # Ruff tourne DANS le backend → on repréfixe pour obtenir un chemin
        # depuis la racine du dépôt, sinon le lien ne pointe sur rien.
        # ⚠️ Préfixe DÉDUIT de la détection, jamais écrit en dur : codé en
        # dur, tous les liens du rapport pointaient dans le vide dès que le
        # projet n'avait pas l'arborescence de celui d'origine.
        fichier = config.PREFIXE_BACKEND + trouve["fichier"].replace("\\", "/")
        traduites.append(
            f"- {lien(fichier, int(trouve['ligne']))}<br>`{code}` — {explication}"
        )

    if not traduites:
        # Format inattendu (ruff a changé son affichage ?) → on rend le brut.
        # test_Lintorn.py garde ce cas sous surveillance.
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
    Restreinte à `security\\.`, elle jetterait SILENCIEUSEMENT les contrôles
    publiés par les applications du projet (`monapp.E002`…) hors du
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
# CONTRÔLE MAISON 3 — la mémoire est-elle encore FRAÎCHE ?
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
# CONTRÔLE MAISON 2 — les règles de CLAUDE.md sont-elles tenues ?
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
# CONTRÔLE MAISON — les règles ÉNONCÉES sont-elles seulement CONTRÔLÉES ?
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

    C'est exactement le scénario que Lintorn traite partout ailleurs comme le plus
    grave : un garde-fou qui ne garde plus rien tout en paraissant sain.

    NON BLOQUANT à dessein : quand le réglage manque, le hook ne tourne pas —
    bloquer un push serait donc de toute façon impossible. Ce contrôle sert aux
    lancements À LA MAIN, le seul moment où l'on peut encore s'en apercevoir.
    """
    titre = "Hook pre-push (Lintorn)"

    if not (config.HOOKS / "pre-push").is_file():
        # ⚠️ « a disparu » etait le PREMIER message vu par un nouvel
        # utilisateur, et il etait faux : le hook n'avait jamais ete installe.
        # Un outil qui accuse au premier lancement perd la confiance qu'il
        # lui faut pour etre cru la fois d'apres.
        return Resultat(
            titre, "INDISPONIBLE",
            "hook pas encore installe - `lintorn --installer-hook`",
            "Sans le hook, `git push` ne lance aucun controle — et sans le "
            "moindre message. Une seule commande, une fois par clone :\n\n"
            "```bash\nlintorn --installer-hook\n```",
            bloquant=False,
            detail_markdown=True,
        )

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
        "ou, strictement équivalent : `lintorn --installer-hook`",
        bloquant=False,
        detail_markdown=True,
    )


def _controle_hook_executable(titre: str) -> Resultat:
    """`core.hooksPath` est bon — reste à savoir si git a le DROIT de lancer.

    LA PANNE : git refuse d'exécuter un hook qui n'a pas le bit exécutable,
    et il le fait EN SILENCE — pas de message, pas d'erreur, le
    push part simplement sans contrôle. Le hook avait été créé sous Windows, où
    ce bit n'existe pas (`core.filemode=false`, Git Bash lance tout) ; il est
    donc parti dans le dépôt en 100644. Tant que le projet est resté sous
    Windows, personne n'a rien vu. Au passage sous Linux, le hook est mort ce
    jour-là — et Lintorn affichait toujours `[ OK ] branche`.

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
        return Resultat(titre, "OK", "branche et executable - Lintorn tournera avant chaque push")

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

    Personne, jusqu'ici — et c'est comme ça que des failles de sécurité connues
    ont dormi dans le projet : `pip-audit` ne tourne ni en
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
               "```bash\nlintorn\n```")

    if not dernier:
        return Resultat(titre, "VERIF", "jamais lance sur cette machine",
                        relance, bloquant=False, detail_markdown=True)

    try:
        date = datetime.date.fromisoformat(str(dernier)[:10])
    except ValueError:
        return Resultat(titre, "VERIF", "date illisible dans .lintorn_etat.json",
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
    "regles_declarees": controle_regles_declarees,
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
