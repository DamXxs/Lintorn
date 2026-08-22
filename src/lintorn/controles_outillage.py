# Lintorn
"""Les controles qui surveillent LINTORN lui-meme.

Son hook pre-push est-il branche ? Ses outils lents ont-ils tourne ?
Avec quel python a-t-il lance les outils ?

⚠️ Ils ne regardent NI le code NI la documentation du projet. Ils
peuvent donc etre verts la ou rien d'autre n'a tourne — et ne doivent
jamais, a eux seuls, faire croire a un audit reussi. D'ou
`TITRES_OUTILLAGE`, que le verdict global met de cote.
"""

from __future__ import annotations

import datetime
import os
import subprocess
import sys
from pathlib import Path

from . import config
from .base import Resultat, lire_etat

# Ces contrôles ne regardent NI le code NI la documentation : ils
# surveillent Lintorn lui-même (son hook, la date de son dernier passage
# complet, le python avec lequel il a lancé les outils). Ils peuvent donc
# être verts sur un projet où rien d'autre n'a tourné — et ne doivent
# jamais, à eux seuls, faire croire à un audit réussi.
TITRES_OUTILLAGE = ("Hook pre-push (Lintorn)", "Audit complet (outils lents)",
                    "Python du projet (venv)")



# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE PYTHON — avec quel interpréteur les outils ont-ils tourné ?
# ─────────────────────────────────────────────────────────────────────────────
def controle_python_projet() -> Resultat:
    """Les outils tournent-ils sur le venv DU PROJET, ou sur celui de la machine ?

    LA PANNE : faute de venv aux emplacements connus, `_python_du_projet()`
    retombait sur `sys.executable` — et ne le disait à personne. Tant que
    Lintorn vivait dans le venv du projet, le repli était sans conséquence.
    Depuis qu'il s'installe par `pip` sur la machine, il désigne le python
    DU SYSTÈME.

    Ce que ça change, et pourquoi ce n'est pas un détail cosmétique :

      * `Dependances vs venv` compare `requirements.txt` aux paquets du
        SYSTÈME. Il répond, avec aplomb, sur un environnement que personne
        n'a demandé à auditer.
      * `pip-audit` audite les failles de la MACHINE, pas celles du projet.
      * `pytest` exécute le code du projet sans aucune de ses dépendances.

    Aucun de ces trois-là ne passe au rouge pour autant : ils rendent un
    verdict plausible sur le mauvais environnement. C'est exactement la panne
    que Lintorn existe pour supprimer, et il l'avait chez lui.

    NON BLOQUANT : un projet peut légitimement n'avoir aucun venv (on
    l'installe à l'instant, la CI monte l'environnement autrement). Bloquer
    ferait de ce contrôle une gêne qu'on apprend à contourner. Il informe —
    mais il ne se tait plus.
    """
    titre = "Python du projet (venv)"

    # Le projet a DÉCLARÉ un venv et il n'est pas là. C'est le cas le plus
    # grave : quelqu'un a pris la peine de répondre à la question, et la
    # réponse est fausse. Passer outre en silence trahirait sa confiance.
    if config.VENV_SOUCI:
        return Resultat(
            titre, "ALERTE", config.VENV_SOUCI,
            "La configuration du projet declare un venv a un emplacement ou "
            "il n'existe pas. Lintorn est donc retombe sur son propre python, "
            "et les outils analysent un autre environnement que le tien.\n\n"
            "Corrige `venv` dans `[tool.lintorn]` (ou dans "
            "`.lintorn/config.toml`), ou retire la ligne pour laisser Lintorn "
            "chercher aux emplacements habituels.",
            bloquant=False, detail_markdown=True,
        )

    # Rien a auditer n'est PAS un feu vert : un projet Go ou JavaScript n'a
    # aucun python, et lui reclamer un venv fabriquerait le faux positif
    # qu'on apprend a ignorer.
    if config.PY_RACINE is None:
        return Resultat(
            titre, "INDISPONIBLE",
            "aucun code Python dans ce projet - rien a verifier",
            bloquant=False,
        )

    if config.VENV_PROJET is not None:
        return Resultat(
            titre, "OK", f"venv du projet : {_relatif(config.VENV_PROJET)}",
            bloquant=False,
        )

    # Repli. Reste a savoir sur QUOI, car les consequences different.
    sur_la_machine = sys.prefix == sys.base_prefix
    origine = "de la MACHINE" if sur_la_machine else "de Lintorn"

    return Resultat(
        titre, "ALERTE",
        f"aucun venv trouve - les outils tournent sur le python {origine}",
        "Lintorn cherche un venv dans `venv/`, `.venv/` et `env/`, a la racine "
        "du projet comme dans son dossier Python. Il n'en a trouve aucun, et "
        f"lance donc ruff, pytest et pip-audit avec `{config.PYTHON}`.\n\n"
        "**Ce que ca fausse, sans passer au rouge pour autant :**\n\n"
        "- `Dependances vs venv` compare `requirements.txt` aux paquets "
        + ("du **systeme**" if sur_la_machine else "du venv de **Lintorn**")
        + " ;\n"
        "- `pip-audit` signale les failles de cet environnement-la, pas celles "
        "du projet ;\n"
        "- `pytest` execute le code du projet sans ses dependances.\n\n"
        "Les trois repondent quand meme : le verdict est plausible, il porte "
        "juste sur le mauvais environnement.\n\n"
        "**Deux facons de regler :**\n\n"
        "```bash\n"
        f"cd {_relatif(config.PY_RACINE) or '.'} && python3 -m venv .venv\n"
        "```\n\n"
        "ou, si ton venv vit ailleurs (poetry, pdm, conda), dis-lui ou :\n\n"
        "```toml\n"
        "[tool.lintorn]\n"
        'venv = "../.venvs/mon-projet"\n'
        "```",
        bloquant=False, detail_markdown=True,
    )


def _relatif(chemin: Path) -> str:
    """Le chemin vu depuis la racine du projet. Absolu s'il est en dehors.

    ⚠️ Jamais le chemin absolu quand on peut l'eviter : il porte le nom de
    l'utilisateur et celui de sa machine, or ce texte part dans un rapport
    que le projet versionne.
    """
    try:
        return chemin.resolve().relative_to(config.RACINE).as_posix()
    except (ValueError, OSError):
        return str(chemin)


# ─────────────────────────────────────────────────────────────────────────────
# CONTRÔLE HOOK — le garde-fou est-il lui-même en place ?
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
# CONTRÔLE AUDIT — les outils LENTS ont-ils tourné récemment ?
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
