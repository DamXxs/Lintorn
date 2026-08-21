# Lintorn
"""La mecanique commune a tous les controles.

La fiche `Resultat`, le lanceur de commandes externes, la traduction
de leurs sorties, et l'etat local de la machine.

  ▸ Pour ajouter un outil       → config.py
  ▸ Pour traduire un code       → traductions.py
  ▸ Pour un controle du PROJET  → controles_projet.py
  ▸ Pour un controle de L'OUTIL → controles_outillage.py
"""

from __future__ import annotations

import json
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
