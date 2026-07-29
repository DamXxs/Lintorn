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
    "ERREUR": "[ERR!]",        # l'outil lui-même est en panne
    "INDISPONIBLE": "[ -- ]",  # outil absent : on prévient, on ne bloque pas
}


class Resultat:
    """Issue d'un contrôle : un statut, un résumé court, un détail complet."""

    def __init__(self, titre: str, statut: str, resume: str, detail: str = "", bloquant: bool = True):
        self.titre = titre
        self.statut = statut
        self.resume = resume
        self.detail = detail.strip()
        self.bloquant = bloquant

    @property
    def en_echec(self) -> bool:
        """Ce résultat doit-il empêcher un push ?"""
        return self.statut in ("ALERTE", "ERREUR") and self.bloquant


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
        fichier = trouve["fichier"].replace("\\", "/")
        traduites.append(f"{fichier}:{trouve['ligne']}\n    {code} — {explication}")

    if not traduites:
        # Format inattendu (ruff a changé son affichage ?) → on rend le brut.
        # test_audit.py garde ce cas sous surveillance.
        return resultat

    entete = ["RESUME PAR TYPE :"]
    for code, nb in sorted(compteur.items(), key=lambda x: -x[1]):
        entete.append(f"  {nb:>3} x {code} — {dico.get(code, '(non traduit)')}")
    entete += ["", "DETAIL :"]

    resultat.detail = "\n".join(entete + traduites)
    resultat.resume = f"{len(traduites)} alerte(s) reelle(s)"
    return resultat


def traduire_deploy(resultat: Resultat) -> Resultat:
    """Réécrit les avertissements de `check --deploy` en français."""
    codes = re.findall(r"\((security\.\w+)\)", resultat.detail)
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
    test_audit.py pour qu'ils ne reviennent pas.
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


def controle_doc() -> Resultat:
    index_noms = indexer_fichiers()
    certains: list[str] = []      # cité AVEC extension et absent → la doc ment
    incertains: list[str] = []    # sans extension → peut être une tournure de phrase
    verifies = 0

    for doc in config.DOCS_A_VERIFIER:
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
            if existe(token, index_noms):
                continue
            ligne = f"{doc.name} -> `{token}`"
            # Une extension explicite = une affirmation vérifiable. Sans extension,
            # ça peut être du texte → consultatif, on ne bloque pas dessus.
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

    return Resultat(
        "Doc vs code",
        "ALERTE" if certains else "OK",
        resume, detail, bloquant=bool(certains),
    )


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
            f"## {regle['nom']} — {total} occurrence(s) [{marque}]",
            f"   {regle['regle']}",
        ]
        # Les 8 fichiers les plus concernés suffisent à savoir par où commencer
        pires = sorted(par_fichier.items(), key=lambda x: -x[1])[:8]
        lignes_detail += [f"   {nb:>4} x  {fichier}" for fichier, nb in pires]
        if len(par_fichier) > 8:
            lignes_detail.append(f"   … et {len(par_fichier) - 8} autre(s) fichier(s)")

    if not infractions:
        return Resultat("Regles maison (CLAUDE.md)", "OK", "toutes les regles sont tenues")

    return Resultat(
        "Regles maison (CLAUDE.md)", "ALERTE",
        " | ".join(infractions), "\n".join(lignes_detail),
        bloquant=bloquant_touche,
    )


CONTROLES_INTERNES = {
    "doc_vs_code": controle_doc,
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
            continue
        resultat = lancer(
            entree["titre"], entree["cmd"], entree["cwd"], bloquant=entree["bloquant"],
        )
        traducteur = TRADUCTEURS.get(entree["traduction"])
        if traducteur and resultat.statut == "ALERTE":
            resultat = traducteur(resultat)
        resultats.append(resultat)

    for nom, actif in config.CONTROLES_INTERNES.items():
        if actif and nom in CONTROLES_INTERNES:
            resultats.append(CONTROLES_INTERNES[nom]())

    return resultats
