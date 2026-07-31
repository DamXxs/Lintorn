#!/usr/bin/env python3
"""
dependances.py — `requirements.txt` dit-il la vérité sur le venv ?

    python matorn/tools/dependances.py

Lancé par LEON, mais utilisable seul.

POURQUOI CE CONTRÔLE EXISTE
    Le dev s'est déjà fait piéger : « ça ne fonctionne pas et je ne comprends
    pas pourquoi ». C'est le classique « ça marche chez moi » — un paquet
    installé à la main dans le venv, jamais ajouté à `requirements.txt`. Le
    code tourne sur la machine du dev et casse partout ailleurs (Docker,
    Codespaces, une machine neuve).

    Aucun autre contrôle ne peut le voir : ruff, pytest et Django tournent
    DANS le venv, donc pour eux le paquet est là. Le défaut ne se révèle qu'au
    déploiement, quand il est le plus cher à diagnostiquer.

TROIS ÉCARTS, TROIS GRAVITÉS
    manquant   déclaré mais pas installé   → ImportError garanti ICI
    divergent  version differente          → LE cas « ça marche pas, pourquoi »
    en trop    installé mais non déclaré   → ça casse AILLEURS, pas ici

⚠️ QUAND CE CONTRÔLE DEVIENDRAIT TROP STRICT
    « En trop » n'a de sens que parce que `requirements.txt` est ici un
    `pip freeze` COMPLET : il liste aussi les dépendances de dépendances
    (asgiref, certifi, cffi…). Le jour où le projet passerait à un fichier de
    dépendances DIRECTES seulement (pip-tools, uv, poetry), ce contrôle
    signalerait ~50 paquets transitifs parfaitement légitimes.
    → Dans ce cas, passer `IGNORER_EN_TROP = True` ci-dessous.

Aucune dépendance : stdlib uniquement.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

RACINE = pathlib.Path(__file__).resolve().parents[2]
BACKEND = RACINE / "matorn" / "backend"
REQUIREMENTS = BACKEND / "requirements.txt"

if sys.platform == "win32":
    PYTHON = BACKEND / "venv" / "Scripts" / "python.exe"
else:
    PYTHON = BACKEND / "venv" / "bin" / "python"

# Voir « QUAND CE CONTRÔLE DEVIENDRAIT TROP STRICT » ci-dessus.
IGNORER_EN_TROP = False

# `pip freeze` exclut pip/setuptools/wheel par défaut, mais pas toujours selon
# la version : on ne juge jamais l'outillage de pip lui-même.
TOUJOURS_IGNORES = {"pip", "setuptools", "wheel", "distribute", "pkg-resources"}


def normaliser(nom: str) -> str:
    """`Django`, `django`, `DJANGO_` → `django` (PEP 503)."""
    return re.sub(r"[-_.]+", "-", nom).strip().lower()


def lire_requirements() -> tuple[dict[str, str], str | None]:
    """Retourne ({paquet: version}, avertissement d'encodage éventuel).

    ⚠️ Le fichier peut être en UTF-16 : c'est ce que produit
    `pip freeze > requirements.txt` dans PowerShell. pip sait le lire (il
    détecte le BOM), mais aucun autre outil ne s'y attend — un `grep` dessus
    renvoie des caractères espacés, et tout script qui l'ouvre en UTF-8 plante.
    On le lit quand même, et on le signale.
    """
    brut = REQUIREMENTS.read_bytes()
    avertissement = None

    if brut[:2] in (b"\xff\xfe", b"\xfe\xff"):
        texte = brut.decode("utf-16")
        avertissement = (
            "requirements.txt est encode en UTF-16 (BOM detecte). pip sait le "
            "lire, mais pas les autres outils : un grep dessus renvoie des "
            "caracteres espaces, et tout script qui l'ouvre en UTF-8 plante.\n"
            "    Pour le convertir :\n"
            "      python -c \"import pathlib; p=pathlib.Path('requirements.txt'); "
            "p.write_text(p.read_bytes().decode('utf-16'), encoding='utf-8')\"\n"
            "    Et pour ne plus le reproduire (la redirection > de PowerShell\n"
            "    ecrit en UTF-16, et Out-File -Encoding utf8 ajoute un BOM en 5.1) :\n"
            "      [IO.File]::WriteAllLines(\"$PWD\\requirements.txt\", "
            "(python -m pip freeze))"
        )
    else:
        texte = brut.decode("utf-8-sig")

    paquets: dict[str, str] = {}
    for ligne in texte.splitlines():
        ligne = ligne.strip()
        # On ignore commentaires, options (-r, --index-url) et lignes vides.
        if not ligne or ligne.startswith(("#", "-")):
            continue
        if "==" not in ligne:
            # Contrainte souple (`Django>=5`) ou paquet local : hors de portée
            # d'une comparaison exacte, on ne s'en mele pas.
            continue
        nom, version = ligne.split("==", 1)
        paquets[normaliser(nom)] = version.split()[0].strip()

    return paquets, avertissement


def lire_venv() -> dict[str, str]:
    proc = subprocess.run(
        [str(PYTHON), "-m", "pip", "freeze", "--local"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=120,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"pip freeze a echoue :\n{proc.stderr}")

    paquets: dict[str, str] = {}
    for ligne in proc.stdout.splitlines():
        ligne = ligne.strip()
        if "==" not in ligne or ligne.startswith(("#", "-")):
            continue
        nom, version = ligne.split("==", 1)
        paquets[normaliser(nom)] = version.strip()
    return paquets


def main() -> int:
    if not REQUIREMENTS.exists():
        print(f"INDISPONIBLE : {REQUIREMENTS} est introuvable.")
        return 2
    if not PYTHON.exists():
        print(f"INDISPONIBLE : venv introuvable ({PYTHON}).")
        return 2

    try:
        declares, avertissement = lire_requirements()
        installes = lire_venv()
    except Exception as e:                      # noqa: BLE001 — on veut le code 2
        print(f"L'OUTIL A PLANTE : {type(e).__name__} : {e}")
        return 2

    for ignore in TOUJOURS_IGNORES:
        declares.pop(ignore, None)
        installes.pop(ignore, None)

    manquants = sorted(set(declares) - set(installes))
    en_trop = [] if IGNORER_EN_TROP else sorted(set(installes) - set(declares))
    divergents = sorted(
        nom for nom in set(declares) & set(installes)
        if declares[nom] != installes[nom]
    )

    lignes: list[str] = []

    if manquants:
        lignes.append(
            f"DECLARES MAIS PAS INSTALLES ({len(manquants)}) "
            "-- ImportError garanti sur CETTE machine :"
        )
        lignes += [f"    - {n}=={declares[n]}" for n in manquants]
        lignes.append("    -> python -m pip install -r requirements.txt")
        lignes.append("")

    if divergents:
        lignes.append(
            f"VERSIONS DIVERGENTES ({len(divergents)}) "
            "-- le venv ne correspond pas a ce qui est declare :"
        )
        lignes += [
            f"    - {n} : requirements={declares[n]}  venv={installes[n]}"
            for n in divergents
        ]
        lignes.append("")

    if en_trop:
        lignes.append(
            f"INSTALLES MAIS PAS DECLARES ({len(en_trop)}) "
            "-- ca marche ICI, ca cassera AILLEURS :"
        )
        lignes += [f"    - {n}=={installes[n]}" for n in en_trop]
        lignes.append("    -> python -m pip freeze | Out-File requirements.txt -Encoding utf8")
        lignes.append("")

    if avertissement:
        lignes.append(f"ENCODAGE : {avertissement}")
        lignes.append("")

    if not lignes:
        print(f"OK - {len(declares)} paquets declares, tous installes a la bonne version.")
        return 0

    print("\n".join(lignes).rstrip())

    # L'encodage seul ne bloque pas un push : pip s'en accommode.
    ecart_reel = bool(manquants or divergents or en_trop)
    return 1 if ecart_reel else 0


if __name__ == "__main__":
    raise SystemExit(main())
