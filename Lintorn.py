#!/usr/bin/env python3
"""
Lintorn — le contrôle de santé du projet Matorn.

Il regarde tout le monde, tout le temps, et il ne laisse rien passer.

    python matorn/tools/Lintorn.py                    # tout
    python matorn/tools/Lintorn.py --rapide           # sans les outils lents
    python matorn/tools/Lintorn.py --doc              # uniquement : la doc ment-elle ?
    python matorn/tools/Lintorn.py --fichiers a.py b.css
                                                   # + un focus sur ces fichiers
    python matorn/tools/Lintorn.py --installer-hook   # branche le hook pre-push
                                                   #   (à faire UNE fois par clone)
    python matorn/tools/Lintorn.py --maj-securite     # ce que pip-audit propose (simulation)
    python matorn/tools/Lintorn.py --maj-securite --appliquer
                                                   # installe et repingle vraiment

OÙ TOUCHER QUOI
    config.py        les outils à lancer, ce qu'on vérifie, les règles maison
    traductions.py   les messages en français
    noyau.py         la mécanique
    Lintorn.py          (ce fichier) le point d'entrée, le rapport, l'affichage

CE QU'IL SURVEILLE, EN PLUS DU CODE
    Le lint et les tests ne voient que le CODE. Lintorn regarde aussi les
    DONNÉES (`manage.py verifier_donnees`) : une base peut être fausse alors
    que le code est juste — séquence de factures trouée, ligne d'OR facturée
    sans désignation. Aucun test unitaire ne voyait ces cas-là.

PRINCIPE — le rapport est un FAIT SUR LE CODE, pas une mémoire : il est ÉCRASÉ
à chaque exécution, jamais fusionné, jamais trié. Un fait sur le code périme dès
que le code change et se recalcule en quelques secondes.

Aucune dépendance : stdlib uniquement.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime

import config
import noyau
from noyau import MARQUEUR, Resultat


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
    matorn/backend/requirements.txt` annule la partie fichier, et
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
        print("    python matorn/tools/Lintorn.py --maj-securite --appliquer")
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
    print("    cd matorn/backend && venv/Scripts/python.exe -m pytest -q")
    print("    python matorn/tools/Lintorn.py")
    return 0 if len(reussis) == len(plan) else 1


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
    try:
        subprocess.run(
            ["git", "config", "core.hooksPath", config.HOOKS_ATTENDU],
            cwd=config.RACINE, check=True, capture_output=True, text=True,
        )
    except (OSError, subprocess.SubprocessError) as erreur:
        print(f"Echec : impossible de configurer git ({erreur})")
        return 1

    print(f"Hook branche : core.hooksPath = {config.HOOKS_ATTENDU}")
    print("Lintorn tournera desormais avant chaque git push.")
    return 0


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
            # ⚠️ Les outils écrivent les chemins avec le séparateur de l'OS :
            # sous Windows, ruff sort `matorn\tools\noyau.py`. Les formes
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
        "# Le rapport de Lintorn — Matorn",
        "",
        f"> Généré le {horodatage} par `matorn/tools/Lintorn.py`.",
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

    if "--installer-hook" in args:
        return installer_hook()

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

    # Console volontairement en ASCII : le hook git tourne sous Git Bash, qui
    # n'affiche pas l'UTF-8 correctement. Le rapport, lui, garde les accents.
    print("\n=== Lintorn - RAPPORT AUDIT ===")
    for r in resultats:
        print(f"{MARQUEUR[r.statut]} {r.titre:<34} {r.resume}")

    echecs = [r for r in resultats if r.en_echec]
    print(f"\nLe rapport de Lintorn : {config.RAPPORT.relative_to(config.RACINE).as_posix()}")
    if echecs:
        print(f"Lintorn signale {len(echecs)} controle(s) bloquant(s) en alerte :")
        for r in echecs:
            print(f"    - {r.titre}")
        return 1
    print("Lintorn n'a rien a signaler : tous les controles bloquants sont au vert.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
