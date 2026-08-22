# Lintorn
"""L'orchestration : qui tourne, dans quel ordre.

Ce fichier ne contient AUCUN controle. Il assemble ce que declare
`config.py` et ce qu'implementent les modules de controles.

  ▸ La mecanique commune  → base.py
  ▸ Les controles PROJET  → controles_projet.py
  ▸ Les controles OUTIL   → controles_outillage.py
"""

from __future__ import annotations

from . import config
from .base import TRADUCTEURS, Resultat, lancer
from .controles_outillage import (
    controle_audit_complet,
    controle_hook_git,
    controle_python_projet,
)
from .controles_projet import (
    controle_doc,
    controle_fraicheur_memoire,
    controle_memoire_ia,
    controle_regles_declarees,
    controle_regles_maison,
)

CONTROLES_INTERNES = {
    "doc_vs_code": controle_doc,
    "memoire_ia": controle_memoire_ia,
    "fraicheur_memoire": controle_fraicheur_memoire,
    "regles_maison": controle_regles_maison,
    "regles_declarees": controle_regles_declarees,
    "hook_git": controle_hook_git,
    "audit_complet": controle_audit_complet,
    "python_projet": controle_python_projet,
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
