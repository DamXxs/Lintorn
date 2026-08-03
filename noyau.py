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

import re
import subprocess
from pathlib import Path

import config
import traductions

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

        deja_vus: set[str] = set()
        for token in re.findall(r"`([^`\n]+)`", texte):
            token = token.strip().rstrip("/").removeprefix("./")
            if not est_un_chemin(token) or token in deja_vus:
                continue
            deja_vus.add(token)
            verifies += 1
            if existe(token, index_noms):
                continue
            ligne = f"{lien(doc.relative_to(config.RACINE).as_posix()) if doc.is_relative_to(config.RACINE) else f'`{doc.name}`'} → `{token}`"
            # Une extension explicite = une affirmation vérifiable. Sans extension,
            # ça peut être du texte → consultatif, on ne bloque pas dessus.
            (certains if re.search(r"\.\w{2,4}(:\d|$)", token) else incertains).append(ligne)

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
        return Resultat("Memoire IA vs code", "INDISPONIBLE",
                        "dossier memoire introuvable sur cette machine", bloquant=False)

    fichiers = sorted(config.MEMOIRE_IA.glob("*.md"))
    if not fichiers:
        return Resultat("Memoire IA vs code", "INDISPONIBLE", "aucun fichier memoire", bloquant=False)

    return _verifier_documents("Memoire IA vs code", fichiers, bloquant_possible=False)


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


CONTROLES_INTERNES = {
    "doc_vs_code": controle_doc,
    "memoire_ia": controle_memoire_ia,
    "regles_maison": controle_regles_maison,
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
