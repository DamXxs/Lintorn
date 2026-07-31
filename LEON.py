#!/usr/bin/env python3
"""
LEON — le contrôle de santé du projet Matorn.

Il regarde tout le monde, tout le temps, et il ne laisse rien passer.

    python matorn/tools/LEON.py                    # tout
    python matorn/tools/LEON.py --rapide           # sans les outils lents
    python matorn/tools/LEON.py --doc              # uniquement : la doc ment-elle ?
    python matorn/tools/LEON.py --fichiers a.py b.css
                                                   # + un focus sur ces fichiers

OÙ TOUCHER QUOI
    config.py        les outils à lancer, ce qu'on vérifie, les règles maison
    traductions.py   les messages en français
    noyau.py         la mécanique
    LEON.py          (ce fichier) le point d'entrée, le rapport, l'affichage

CE QU'IL SURVEILLE, EN PLUS DU CODE
    Le lint et les tests ne voient que le CODE. LEON regarde aussi les
    DONNÉES (`manage.py verifier_donnees`) : une base peut être fausse alors
    que le code est juste — séquence de factures trouée, ligne d'OR facturée
    sans désignation. Aucun test unitaire ne voyait ces cas-là.

PRINCIPE — le rapport est un FAIT SUR LE CODE, pas une mémoire : il est ÉCRASÉ
à chaque exécution, jamais fusionné, jamais trié. Un fait sur le code périme dès
que le code change et se recalcule en quelques secondes.

Aucune dépendance : stdlib uniquement.
"""

from __future__ import annotations

import sys
from datetime import datetime

import config
import noyau
from noyau import MARQUEUR, Resultat


# ─────────────────────────────────────────────────────────────────────────────
# FOCUS SUR LES FICHIERS D'UN PUSH
# ─────────────────────────────────────────────────────────────────────────────
def _alias(chemin_git: str) -> list[str]:
    """Toutes les façons dont un même fichier peut apparaître dans un rapport.

    git parle en chemins depuis la racine du dépôt :
        matorn/backend/accounts/views.py
    mais ruff tourne depuis backend/ et écrit :
        accounts/views.py
    On compare donc sur plusieurs formes du même chemin.
    """
    chemin = chemin_git.replace("\\", "/")
    formes = [chemin]
    for prefixe in ("matorn/backend/", "matorn/frontend/src/", "matorn/frontend/", "matorn/"):
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
            if propre and any(forme in propre for forme in formes):
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
        "# Le rapport de LEON — Matorn",
        "",
        f"> Généré le {horodatage} par `matorn/tools/LEON.py`.",
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

    config.RAPPORT.write_text("\n".join(lignes) + "\n", encoding="utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────────────────────
def main() -> int:
    args = sys.argv[1:]

    fichiers: list[str] = []
    if "--fichiers" in args:
        fichiers = [a for a in args[args.index("--fichiers") + 1:] if not a.startswith("--")]

    if "--doc" in args:
        resultats = [noyau.controle_doc()]
    else:
        resultats = noyau.executer(rapide="--rapide" in args)

    if fichiers:
        resultats.append(focus_sur(resultats, fichiers))

    ecrire_rapport(resultats)

    # Console volontairement en ASCII : le hook git tourne sous Git Bash, qui
    # n'affiche pas l'UTF-8 correctement. Le rapport, lui, garde les accents.
    print("\n=== LEON - RAPPORT AUDIT ===")
    for r in resultats:
        print(f"{MARQUEUR[r.statut]} {r.titre:<34} {r.resume}")

    echecs = [r for r in resultats if r.en_echec]
    print(f"\nLe rapport de LEON : {config.RAPPORT.relative_to(config.RACINE).as_posix()}")
    if echecs:
        print(f"LEON signale {len(echecs)} controle(s) bloquant(s) en alerte :")
        for r in echecs:
            print(f"    - {r.titre}")
        return 1
    print("LEON n'a rien a signaler : tous les controles bloquants sont au vert.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
