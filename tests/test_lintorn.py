# Lintorn
#
# Tests de l'outil d'audit lui-même.
#
# POURQUOI : `Lintorn.py` lit la sortie de ruff avec une expression régulière.
# Le jour où ruff change son format d'affichage, la regex ne reconnaît plus
# rien — et le code est écrit pour retomber sur la sortie brute SANS rien dire.
# On croirait l'outil en bonne santé alors qu'il aurait cessé de traduire et
# de compter. Ces tests figent le format attendu : si ruff change, ça casse ICI,
# bruyamment, au lieu de dégrader en silence.

import ast
import io
import json
import os
import re
import subprocess
from datetime import date, timedelta
from fnmatch import fnmatch
from pathlib import Path

import pytest

from lintorn import cli as Lintorn
from lintorn import config, noyau, traductions


# ─────────────────────────────────────────────────────────────────────────────
# La lecture de la sortie de ruff
# ─────────────────────────────────────────────────────────────────────────────
def test_regex_ruff_reconnait_une_vraie_ligne():
    """Échantillon réel, copié tel quel de la sortie de ruff."""
    ligne = r"accounts\views.py:7:1: F811 redefinition of unused 'login_required_cookie' from line 4"

    trouve = noyau.LIGNE_RUFF.match(ligne)

    assert trouve is not None, "ruff a change son format de sortie → la traduction est morte"
    assert trouve["fichier"] == r"accounts\views.py"
    assert trouve["ligne"] == "7"
    assert trouve["code"] == "F811"


def test_regex_ruff_gere_les_chemins_unix():
    """Sur Codespaces les chemins ont des / au lieu des \\."""
    ligne = "clients/models.py:72:9: F401 `planning.models.Intervention` imported but unused"

    trouve = noyau.LIGNE_RUFF.match(ligne)

    assert trouve is not None
    assert trouve["code"] == "F401"


def test_tous_les_codes_traduits_ont_un_texte_francais():
    """Un code présent dans le dictionnaire mais avec un texte vide passerait
    inaperçu à l'affichage."""
    for code, texte in {**traductions.RUFF, **traductions.DEPLOY}.items():
        assert texte.strip(), f"{code} n'a pas de traduction"
        assert len(texte) > 20, f"{code} : traduction trop courte pour être utile"


# ─────────────────────────────────────────────────────────────────────────────
# Le tri des `backticks` du contrôle doc
# ─────────────────────────────────────────────────────────────────────────────
def test_est_un_chemin_accepte_de_vrais_chemins():
    for token in ("services/api.ts", "mixins/models.py", "ARCHITECTURE.md",
                  "pages/Planning/PlanningPrefsContext.tsx", "fixtures/demo"):
        assert noyau.est_un_chemin(token), f"{token} devrait etre vu comme un chemin"


def test_est_un_chemin_rejette_ce_qui_est_du_code():
    """Chacun de ces cas a produit un VRAI faux positif avant d'être filtré."""
    for token in (
        "tsc --noEmit",            # une commande
        "Facture.emettre()",       # un appel de méthode
        "var(--bg)",               # du CSS
        "/api/archives/",          # une route d'API, pas un fichier
        ".../debloquer",           # un chemin tronqué dans une phrase
        ".tsx",                    # une extension citée seule
        "https://exemple.fr/x.md",  # une URL
        "STATUT_CHOICES",          # un nom de constante
    ):
        assert not noyau.est_un_chemin(token), f"{token} ne devrait PAS etre vu comme un chemin"


def test_existe_retrouve_un_fichier_par_son_nom_seul():
    index = {"ARCHITECTURE.md", "api.ts"}

    assert noyau.existe("ARCHITECTURE.md", index)
    assert not noyau.existe("FICHIER_QUI_NEXISTE_PAS.md", index)


def test_existe_ignore_le_numero_de_ligne():
    """La doc cite parfois `factures/models.py:17-34`."""
    index = {"models.py"}

    assert noyau.existe("models.py:17-34", index)
    assert noyau.existe("models.py:151", index)


# ─────────────────────────────────────────────────────────────────────────────
# La distinction « problèmes trouvés » / « outil en panne »
# ─────────────────────────────────────────────────────────────────────────────
def test_un_outil_absent_ne_bloque_pas():
    resultat = noyau.lancer("Outil imaginaire", ["ceci_nexiste_pas_du_tout"], config.RACINE)

    assert resultat.statut == "INDISPONIBLE"
    assert resultat.bloquant is False


def test_code_de_sortie_inattendu_signale_une_panne_d_outil():
    """Python sort en code 2 sur une option inconnue → ce n'est PAS une alerte
    de code, c'est l'outil qui n'a pas pu tourner."""
    resultat = noyau.lancer(
        "Panne simulee", [config.PYTHON, "--option-qui-nexiste-pas"], config.RACINE,
    )

    assert resultat.statut == "ERREUR"
    assert "plante" in resultat.resume


# ─────────────────────────────────────────────────────────────────────────────
# Le focus sur les fichiers d'un push
# ─────────────────────────────────────────────────────────────────────────────
def test_focus_ne_garde_que_les_fichiers_pousses(monkeypatch):
    """git parle en chemins depuis la racine, ruff depuis le backend :
    le focus doit reconnaître le même fichier sous ses deux formes.

    ⚠️ On FIXE les préfixes au lieu de laisser la détection les fournir : ce
    test vérifie la mécanique de rapprochement, pas l'arborescence de la
    machine qui l'exécute. Sans ça il passait ou échouait selon le projet
    audité — un test qui dépend de son environnement ne prouve rien.
    """
    monkeypatch.setattr(config, "PREFIXES_PROJET", ["api/", "front/src/"])
    faux = noyau.Resultat(
        "Ruff", "ALERTE", "2 alertes",
        "accounts/views.py:7\n    F401 import inutile\n"
        "stock/models.py:121\n    E741 nom ambigu",
    )

    focus = Lintorn.focus_sur([faux], ["api/accounts/views.py"])

    assert focus.statut == "ALERTE"
    assert "accounts/views.py" in focus.detail
    assert "stock/models.py" not in focus.detail


def test_focus_est_vert_quand_le_push_ne_touche_rien_de_casse(monkeypatch):
    monkeypatch.setattr(config, "PREFIXES_PROJET", ["api/", "front/src/"])
    faux = noyau.Resultat("Ruff", "ALERTE", "1 alerte", "stock/models.py:121\n    E741")

    focus = Lintorn.focus_sur([faux], ["front/src/App.tsx"])

    assert focus.statut == "OK"


def test_focus_reconnait_les_chemins_windows(monkeypatch):
    """Sous Windows, ruff écrit `api\\outils\\noyau.py` ; git parle en slashs.

    Sans normaliser AVANT de comparer, le focus ne reconnaissait plus RIEN sur
    cette machine — et comme le hook pre-push l'utilise, il annonçait « aucun
    defaut connu dedans » au moment précis du push. Faux vert, 12/08/2026.
    """
    monkeypatch.setattr(config, "PREFIXES_PROJET", ["api/"])
    faux = noyau.Resultat(
        "Ruff", "ALERTE", "1 alerte",
        r"api\outils\noyau.py:300:121: E501 Line too long",
    )

    focus = Lintorn.focus_sur([faux], ["api/outils/noyau.py"])

    assert focus.statut == "ALERTE", "chemins Windows non reconnus → faux vert au push"
    assert "noyau.py" in focus.detail


# ─────────────────────────────────────────────────────────────────────────────
# Le marqueur `lintorn:prospectif`
# ─────────────────────────────────────────────────────────────────────────────
_FANTOME = "`api/fichier_qui_nexiste_vraiment_pas.py`"


def test_un_document_normal_bloque_sur_un_chemin_faux(tmp_path):
    doc = tmp_path / "note.md"
    doc.write_text(f"Le pivot est {_FANTOME}.", encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.statut == "ALERTE"
    assert resultat.bloquant is True


def test_un_document_prospectif_informe_sans_bloquer(tmp_path):
    """Une roadmap ou un ADR cite légitimement des fichiers à créer — ou
    supprimés, cités justement parce qu'ils ont disparu. Le contrôle doit les
    LISTER sans interdire le push."""
    doc = tmp_path / "conception.md"
    doc.write_text(f"<!-- lintorn:prospectif -->\n\nÀ écrire : {_FANTOME}.", encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.statut == "VERIF"
    assert resultat.bloquant is False
    assert "fichier_qui_nexiste_vraiment_pas.py" in resultat.detail, (
        "le chemin doit rester VISIBLE : on informe, on n'interdit pas"
    )


# ─────────────────────────────────────────────────────────────────────────────
# La fraîcheur de la mémoire (git)
# ─────────────────────────────────────────────────────────────────────────────
def test_un_nom_de_fichier_nu_devient_un_pathspec_glob():
    """Une mémoire écrit « le template `OrPdfTemplate.tsx` », jamais son chemin
    complet. La première version ne résolvait que les chemins complets : elle
    trouvait 0 fichier, donc 0 commit, donc un contrôle vert à jamais."""
    assert noyau._pathspecs_cites(
        "le template `OrPdfTemplate.tsx` fait foi"
    ) == [":(glob)**/OrPdfTemplate.tsx"]


def test_un_chemin_complet_devient_repo_relatif(tmp_path, monkeypatch):
    """`_pathspecs_cites` VÉRIFIE que le fichier existe avant de le retenir.

    Le test se fabrique donc son propre dépôt : écrire un chemin en dur le
    rendrait dépendant de l'arborescence du projet audité, et il basculerait
    au vert ou au rouge selon la machine — sans rien prouver.
    """
    (tmp_path / "api" / "factures").mkdir(parents=True)
    (tmp_path / "api" / "factures" / "models.py").touch()
    monkeypatch.setattr(config, "RACINE", tmp_path)
    monkeypatch.setattr(config, "RACINES_RESOLUTION", [tmp_path])

    specs = noyau._pathspecs_cites("voir `api/factures/models.py`")

    assert "api/factures/models.py" in specs


def test_les_blocs_de_code_ne_sont_pas_des_citations():
    assert noyau._pathspecs_cites("```\n`models.py`\n```\nrien d'autre") == []


def test_git_muet_ne_se_confond_pas_avec_rien_n_a_bouge():
    """LE bug du 12/08/2026. `--format=<chaîne libre>` est refusé par git
    (« invalid --pretty format ») : il sortait en 128, l'échec était avalé, et
    la fonction renvoyait « 0 commit » — donc un contrôle VERT sur une mémoire
    périmée. `None` veut dire « je n'ai pas pu regarder », `[]` veut dire
    « rien n'a bougé ». Les confondre est exactement la maladie soignée ici."""
    nb, touches = noyau._commits_depuis("2020-01-01", [":(magie_qui_nexiste_pas)x"])

    assert touches is None, "git en panne doit renvoyer None, jamais une liste vide"
    assert nb == 0


@pytest.mark.skipif(
    config.BACKEND is None,
    reason="exige un vrai projet Django : ni pertinent ni concluant sans lui",
)
def test_git_retrouve_un_vrai_commit():
    """Contre-épreuve : sur un fichier réel du dépôt, git DOIT répondre.
    Si ce test casse, c'est le format de la commande qui est reparti en vrille."""
    nb, touches = noyau._commits_depuis("2020-01-01", [":(glob)**/CLAUDE.md"])

    assert touches is not None, "git n'a pas repondu → le controle serait faussement vert"
    assert nb > 0
    assert any("CLAUDE.md" in fichier for fichier in touches)


def test_la_date_de_verification_doit_etre_une_vraie_date():
    assert noyau._RX_VERIFIE_LE.search("---\nname: x\nverifie_le: 2026-08-12\n---")
    assert not noyau._RX_VERIFIE_LE.search("verifie_le: bientot")


# ─────────────────────────────────────────────────────────────────────────────
# Le hook pre-push et les réglages de machine
# ─────────────────────────────────────────────────────────────────────────────
def test_le_chemin_attendu_des_hooks_est_le_bon():
    """Si `tools/hooks/` est déplacé sans mettre à jour `HOOKS_ATTENDU`, Lintorn
    réclamerait un `git config` pointant vers un dossier vide — et le push
    repartirait sans contrôle en croyant être protégé."""
    assert config.HOOKS == config.RACINE / config.HOOKS_ATTENDU
    # Le hook livré DANS le paquet : c'est lui la source de toute installation.
    assert (config.HOOKS_SOURCE / "pre-push").is_file()


def test_le_hook_pre_push_est_executable_dans_git():
    """Git refuse en SILENCE de lancer un hook sans le bit exécutable.

    Panne réelle du 16/08/2026 : le hook, créé sous Windows (où ce bit n'existe
    pas), était parti dans le dépôt en `100644`. Sous Windows Git Bash le
    lançait quand même — au passage sous Linux, `git push` a cessé de contrôler
    quoi que ce soit, sans un message, pendant que Lintorn affichait « branche ».

    ⚠️ On surveille le hook SOURCE — celui livré dans le paquet — et non la
    copie posée dans le projet audité. Depuis le packaging il y a deux objets
    distincts : `installer_hook()` copie le premier vers le second en reposant
    le bit lui-même. Si la SOURCE le perd, toutes les copies naissent
    infirmes : c'est donc là qu'il faut monter la garde, et la copie générée
    n'a elle aucune raison d'être versionnée.

    On lit le mode dans l'INDEX GIT : c'est lui qui voyage avec le dépôt, donc
    lui qui protège les autres machines, et c'est le seul des deux (index ou
    disque) à donner la même réponse sur tous les OS.
    """
    source = config.HOOKS_SOURCE / "pre-push"

    sortie = subprocess.run(
        ["git", "ls-files", "-s", "--", str(source)],
        cwd=source.parent, capture_output=True, text=True, timeout=10, check=False,
    )

    if not sortie.stdout.strip():
        # Paquet installé depuis un wheel : aucun dépôt git autour, l'index
        # n'existe pas. Le bit du disque est alors la seule vérité disponible.
        assert os.access(source, os.X_OK), (
            f"{source} n'est pas executable : git ignorerait ce hook en silence."
        )
        return

    mode = sortie.stdout.split()[0]
    assert mode == "100755", (
        f"{source} est enregistre en {mode} : git ne l'executera JAMAIS, "
        "ni ici ni sur un clone, et sans le moindre message. Reparer avec :\n"
        f"    chmod +x {source} && git add {source}"
    )


def test_le_controle_du_hook_ne_conclut_rien_sans_donnee(tmp_path):
    """`_mode_git` doit rendre None hors dépôt, jamais un mode inventé.

    Un contrôle qui devine un verdict quand il n'a pas la donnée est
    précisément le défaut qu'on vient de corriger : il repasse au vert sur du
    vide. Ici, hors dépôt git, la seule réponse honnête est « je ne sais pas ».
    """
    assert noyau._mode_git(tmp_path / "inexistant") is None


def test_lecture_du_env_ignore_commentaires_guillemets_et_lignes_vides(tmp_path):
    fichier = tmp_path / ".env"
    fichier.write_text(
        "# un commentaire\n"
        "A=1\n"
        'B = "deux"\n'
        "\n"
        "C='trois'\n"
        "ligne_sans_signe_egal\n",
        encoding="utf-8",
    )

    assert config._lire_env(fichier) == {"A": "1", "B": "deux", "C": "trois"}


def test_un_env_absent_ne_plante_pas(tmp_path):
    """Le .env est FACULTATIF : sans lui, Lintorn doit se comporter comme avant."""
    assert config._lire_env(tmp_path / "aucun.env") == {}


# ─────────────────────────────────────────────────────────────────────────────
# La liste blanche de vulture
# ─────────────────────────────────────────────────────────────────────────────
def test_la_liste_blanche_vulture_est_bien_branchee():
    """Si `VULTURE_IGNORES` cesse d'être passé à l'outil, les 8 faux positifs
    du 12/08/2026 reviennent — et un contrôle qui n'a QUE des faux positifs
    finit par ne plus être lu, donc par ne plus rien protéger.

    Vulture est opt-in : quand le projet ne l'a pas demandé, la commande
    n'existe pas et il n'y a rien à prouver ici.
    """
    entrees = [c for c in config.COMMANDES if c["cle"] == "code_mort"]
    if not entrees:
        pytest.skip("vulture n'est pas active sur ce projet")
    entree = entrees[0]

    assert "--ignore-names" in entree["cmd"]
    passe = entree["cmd"][entree["cmd"].index("--ignore-names") + 1]
    for nom in config.VULTURE_IGNORES:
        assert nom in passe, f"{nom} n'est plus transmis a vulture"


# ─────────────────────────────────────────────────────────────────────────────
# La fraîcheur de l'audit complet
# ─────────────────────────────────────────────────────────────────────────────
def _etat(tmp_path, monkeypatch, contenu):
    fichier = tmp_path / "etat.json"
    if contenu is not None:
        fichier.write_text(contenu, encoding="utf-8")
    monkeypatch.setattr(config, "ETAT", fichier)
    return fichier


def test_audit_complet_jamais_lance_le_signale(tmp_path, monkeypatch):
    _etat(tmp_path, monkeypatch, None)

    resultat = noyau.controle_audit_complet()

    assert resultat.statut == "VERIF"
    assert "jamais" in resultat.resume
    assert resultat.bloquant is False


def test_audit_complet_recent_est_vert(tmp_path, monkeypatch):
    _etat(tmp_path, monkeypatch,
          json.dumps({"dernier_audit_complet": date.today().isoformat()}))

    assert noyau.controle_audit_complet().statut == "OK"


def test_audit_complet_perime_reclame_une_relance(tmp_path, monkeypatch):
    """C'est ce silence-là qui a laissé dormir 3 failles de securite : ni
    `--rapide` ni le hook pre-push ne lancent pip-audit."""
    vieux = date.today() - timedelta(days=config.JOURS_AUDIT_COMPLET + 1)
    _etat(tmp_path, monkeypatch,
          json.dumps({"dernier_audit_complet": vieux.isoformat()}))

    resultat = noyau.controle_audit_complet()

    assert resultat.statut == "VERIF"
    assert "pip-audit" in resultat.detail
    assert resultat.bloquant is False, "un rappel ne doit jamais bloquer un push"


def test_un_etat_illisible_ne_plante_pas(tmp_path, monkeypatch):
    """Fichier tronqué par un Ctrl-C : Lintorn repart de zéro, il ne casse pas."""
    _etat(tmp_path, monkeypatch, "{ceci n'est pas du json")

    assert noyau.lire_etat() == {}


# ─────────────────────────────────────────────────────────────────────────────
# La mise à jour des paquets vulnérables
# ─────────────────────────────────────────────────────────────────────────────
def test_les_versions_se_comparent_en_nombres_pas_en_texte():
    """Comparées comme des CHAÎNES, "6.9.0" passe pour plus récent que
    "6.15.0" — et Lintorn proposerait de REVENIR en arrière sur un correctif."""
    assert Lintorn._version_tuple("6.15.0") > Lintorn._version_tuple("6.9.0")
    assert max(["6.9.0", "6.15.0"], key=Lintorn._version_tuple) == "6.15.0"
    assert Lintorn._version_tuple("50.0.0") > Lintorn._version_tuple("49.0.0")


# ─────────────────────────────────────────────────────────────────────────────
# Les défauts non invasifs
# ─────────────────────────────────────────────────────────────────────────────
def test_aucune_regle_maison_n_est_livree_avec_l_outil():
    """Une règle maison décrit UN projet : le paquet ne doit en imposer aucune.

    Livrées dans l'outil, les règles d'un projet produisaient chez les autres
    des alertes incompréhensibles — ou un vert rassurant sur un contrôle qui
    ne scannait aucun fichier. Elles viennent désormais TOUTES de la config du
    projet audité : sans config, la liste est vide.

    ⚠️ La question « ce dépôt déclare-t-il des règles ? » se pose aux DEUX
    sources. Posée au seul `config.toml`, elle est devenue fausse le jour où
    `regles.toml` est apparu — et ce test a echoue en le disant.
    """
    if config._regles_brutes():
        return      # ce dépôt-ci en déclare : rien à prouver ici
    assert config.REGLES_MAISON == []


def test_les_controles_invasifs_sont_desactives_par_defaut():
    """Le premier lancement doit être INCAPABLE de faire du dégât.

    pytest exécute le code du projet, pip-audit sort sur le réseau,
    `verifier_donnees` ouvre la base. Quelqu'un qui découvre Lintorn le lance
    dans un dépôt qu'il connaît mal : rien de tout ça ne doit partir sans un
    accord explicite. C'est la condition pour qu'on ose l'essayer.
    """
    actifs = config.PROJET.get("controles", {})
    for cle in ("tests", "failles", "donnees_metier", "code_mort", "deploy"):
        if actifs.get(cle):
            continue    # activé explicitement par ce projet : c'est son droit
        assert not any(c["cle"] == cle for c in config.COMMANDES), (
            f"'{cle}' tourne alors que personne ne l'a demande"
        )


def test_zero_chemin_cite_n_est_pas_un_succes(tmp_path):
    """Des documents lus mais aucun chemin cité = rien n'a été vérifié.

    Trouvé en pointant Lintorn sur un projet Go dont le README ne contenait
    aucun backtick : le contrôle affichait « OK — 0 chemin cité », donc un
    feu vert sur une documentation qu'il n'avait pas pu contrôler. C'est le
    jumeau exact du garde-fou « aucun document trouvé ».
    """
    doc = tmp_path / "README.md"
    doc.write_text("Un projet tres bien, sans le moindre backtick.", encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.statut == "INDISPONIBLE"
    assert resultat.bloquant is False
    assert "AUCUN chemin" in resultat.resume


def test_les_controles_d_outillage_ne_valent_pas_un_audit():
    """Le hook et la fraîcheur parlent de Lintorn, pas du projet.

    Ils peuvent être verts sur un dépôt où aucun autre contrôle n'a tourné.
    Les compter comme « un audit a eu lieu » redonnerait un feu vert à un
    projet dont rien n'a été vérifié.
    """
    for titre in noyau.TITRES_OUTILLAGE:
        assert titre not in ("Doc vs code", "Regles maison"), (
            "un controle du PROJET a ete classe comme outillage"
        )
    assert len(noyau.TITRES_OUTILLAGE) == 2


def test_docs_exclus_accepte_les_globs_traversants(tmp_path, monkeypatch):
    """`docs_exclus` doit écarter toute une arborescence, pas juste un niveau.

    Première version écrite avec `Path.match` : `**` n'y est un glob récursif
    qu'à partir de Python 3.13, alors que Lintorn tourne dès 3.11. Les motifs
    étaient donc silencieusement ignorés — l'utilisateur configurait une
    exclusion qui ne s'appliquait jamais, sans le moindre avertissement.
    """
    chemins = ["docs/en/tutorial/index.md", "docs/fr/advanced/x.md", "README.md"]
    gardes = [c for c in chemins if not fnmatch(c, "docs/*")]

    assert gardes == ["README.md"], "le glob ne traverse pas les sous-dossiers"


# ─────────────────────────────────────────────────────────────────────────────
# Les règles ÉNONCÉES dans le fichier d'instructions IA
# ─────────────────────────────────────────────────────────────────────────────
def _config_doc_ia(tmp_path, monkeypatch, texte, regles=()):
    """Un CLAUDE.md fabriqué pour l'occasion, et la config qui va avec."""
    doc = tmp_path / "CLAUDE.md"
    doc.write_text(texte, encoding="utf-8")
    monkeypatch.setattr(config, "RACINE", tmp_path)
    monkeypatch.setattr(config, "DOCS_IA", [doc])
    monkeypatch.setattr(config, "REGLES_MAISON", list(regles))
    return doc


def _regles_enoncees(tmp_path, monkeypatch, texte, regles=()):
    _config_doc_ia(tmp_path, monkeypatch, texte, regles)
    return noyau.controle_regles_declarees()


def test_la_prose_narrative_n_est_pas_prise_pour_une_regle(tmp_path, monkeypatch):
    """Une note qui RACONTE n'énonce pas une règle, même en disant « jamais ».

    Sans ce filtre de forme, un vrai projet remontait 92 lignes — notes
    d'architecture et comptes rendus d'audit compris. Un contrôle qui crie
    92 fois est un contrôle qu'on apprend à ne plus lire.
    """
    texte = (
        "- Un devis `VALIDE` n'expire jamais : c'est un engagement signe.\n"
        "\n"
        "| Axios partage | jamais d'`axios.create()` ailleurs |\n"
    )
    resultat = _regles_enoncees(tmp_path, monkeypatch, texte)

    assert "1 enoncee(s)" in resultat.resume, (
        "seule la ligne de TABLEAU est une regle ; la puce narrative n'en est pas une"
    )


def test_une_regle_pourvue_d_un_motif_sort_du_rapport(tmp_path, monkeypatch):
    texte = "| Axios partage | jamais d'`axios.create()` ailleurs |\n"
    regle = {"nom": "axios hors de api.ts", "motif": re.compile(r"axios\.create\(")}

    resultat = _regles_enoncees(tmp_path, monkeypatch, texte, [regle])

    assert resultat.statut == "OK"


def test_la_phrase_de_la_regle_ne_vaut_pas_couverture(tmp_path, monkeypatch):
    """Le champ `regle` est de la prose : il ne prouve RIEN sur la détection.

    Il cite souvent la doc (« CLAUDE.md : … »). Une règle parlant de `.claude/`
    s'y appariait alors par coïncidence de sous-chaîne — « claude » ⊂
    « claudemd » — et disparaissait du rapport. Un faux « couvert » est pire
    qu'un faux trou : il éteint l'alerte sur une règle que rien ne surveille.
    """
    texte = "| Fichier versionne | jamais de chemin absolu ; `.claude/` est ignore |\n"
    regle = {
        "nom": "axios.create() hors de services/api.ts",
        "regle": "CLAUDE.md : une SEULE instance axios dans tout le projet",
        "motif": re.compile(r"axios\.create\("),
    }

    resultat = _regles_enoncees(tmp_path, monkeypatch, texte, [regle])

    assert "1 SANS controle" in resultat.resume


def test_ce_controle_ne_bloque_jamais_un_push(tmp_path, monkeypatch):
    """Documenter une intention ne doit pas interdire de pousser : ce serait
    punir exactement le geste qu'on veut encourager."""
    texte = "| Statuts | **Source unique** : `StatutBadge.tsx`. Jamais ailleurs |\n"

    resultat = _regles_enoncees(tmp_path, monkeypatch, texte)

    assert resultat.statut == "VERIF"
    assert resultat.bloquant is False
    assert resultat.en_echec is False


# ─────────────────────────────────────────────────────────────────────────────
# Le périmètre : ce que git ignore n'appartient pas au projet
# ─────────────────────────────────────────────────────────────────────────────
def _petit_depot(tmp_path, gitignore, fichiers):
    """Un vrai dépôt git jetable — `git check-ignore` ne se simule pas."""
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, capture_output=True, check=True)
    (tmp_path / ".gitignore").write_text(gitignore, encoding="utf-8")
    crees = []
    for nom in fichiers:
        chemin = tmp_path / nom
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_text("peu importe", encoding="utf-8")
        crees.append(chemin)
    return crees


def test_un_fichier_ignore_par_git_sort_du_perimetre(tmp_path, monkeypatch):
    """Une note perso citant un fichier « a creer un jour » rendait l'audit
    rouge, donc bloquait un push — pour un brouillon qui ne part meme pas sur
    le depot."""
    prive, public = _petit_depot(tmp_path, ".notes/\n", [".notes/reprise.md", "README.md"])
    monkeypatch.setattr(config, "RACINE", tmp_path)

    gardes = config.hors_gitignore([prive, public])

    assert gardes == [public], "un fichier ignore par git n'a rien a faire dans l'audit"


def test_un_fichier_deja_suivi_reste_audite(tmp_path, monkeypatch):
    """LA subtilité de `.gitignore` : une règle n'agit que sur ce qui n'est
    PAS encore suivi. Un fichier déjà indexé part malgré tout sur le dépôt —
    il reste donc dans le périmètre, et le taire serait le pire des services.

    C'est aussi pour ça qu'on délègue à `git check-ignore` au lieu de relire
    le `.gitignore` nous-mêmes : il consulte l'index, une réimplémentation
    maison l'oublierait.
    """
    suivi, = _petit_depot(tmp_path, "secret/\n", ["secret/deja_commite.md"])
    subprocess.run(["git", "add", "-f", str(suivi)], cwd=tmp_path,
                   capture_output=True, check=True)
    monkeypatch.setattr(config, "RACINE", tmp_path)

    assert config.hors_gitignore([suivi]) == [suivi]


def test_hors_depot_git_on_n_exclut_rien(tmp_path, monkeypatch):
    """Tous les projets ne sont pas sous git. Dans le doute on garde tout :
    un contrôle de trop se voit et se corrige, un fichier disparu de l'audit
    ne se voit jamais."""
    fichier = tmp_path / "note.md"
    fichier.write_text("peu importe", encoding="utf-8")
    monkeypatch.setattr(config, "RACINE", tmp_path)

    assert config.hors_gitignore([fichier]) == [fichier]


# ─────────────────────────────────────────────────────────────────────────────
# Le garde-fou que `--init` pose dans `.lintorn/`
# ─────────────────────────────────────────────────────────────────────────────
def _ignore(depot, chemin):
    # check=False EXPRES : `check-ignore` sort en 1 quand rien n'est ignore,
    # et c'est une reponse, pas une panne.
    return subprocess.run(["git", "check-ignore", "-q", "--", chemin],
                          cwd=depot, capture_output=True, check=False).returncode == 0


def test_le_gitignore_interne_se_suffit_a_lui_meme(tmp_path):
    """Sans TOUCHER au .gitignore du projet : les sorties sortent du depot,
    la config y reste.

    C'est ce qui supprime l'etape « ajoute ces deux lignes a ton .gitignore ».
    Un utilisateur avait copie la ligne de PROSE — backticks compris — et
    oublie la negation : sa config etait ignoree, sans le moindre message.
    Une etape supprimee est une etape qu'on ne peut plus rater.
    """
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, capture_output=True, check=True)
    dossier = tmp_path / ".lintorn"
    dossier.mkdir()
    (dossier / "config.toml").write_text("", encoding="utf-8")
    (dossier / "rapport.md").write_text("", encoding="utf-8")

    Lintorn._poser_gitignore_interne(dossier)

    assert not _ignore(tmp_path, ".lintorn/config.toml"), "la config doit se versionner"
    assert _ignore(tmp_path, ".lintorn/rapport.md"), "le rapport est une sortie, il sort"


def test_une_regle_sur_le_DOSSIER_defait_le_garde_fou(tmp_path):
    """La limite, connue et assumée : `.lintorn/` (barre finale) exclut le
    dossier, git n'y descend pas, aucune exception interne ne le rattrape.
    `--init` teste donc l'effet obtenu au lieu de le supposer.
    """
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, capture_output=True, check=True)
    (tmp_path / ".gitignore").write_text(".lintorn/\n", encoding="utf-8")
    dossier = tmp_path / ".lintorn"
    dossier.mkdir()
    (dossier / "config.toml").write_text("", encoding="utf-8")

    Lintorn._poser_gitignore_interne(dossier)

    assert _ignore(tmp_path, ".lintorn/config.toml"), (
        "si ce cas cesse d'ignorer la config, l'avertissement de --init n'a plus de raison d'etre"
    )


def test_le_gitignore_interne_n_ecrase_jamais_celui_du_dev(tmp_path):
    dossier = tmp_path / ".lintorn"
    dossier.mkdir()
    (dossier / ".gitignore").write_text("a moi\n", encoding="utf-8")

    Lintorn._poser_gitignore_interne(dossier)

    assert (dossier / ".gitignore").read_text(encoding="utf-8") == "a moi\n"


# ─────────────────────────────────────────────────────────────────────────────
# Les esquisses de `[[regles]]` tirées de la doc
# ─────────────────────────────────────────────────────────────────────────────
_TABLE = "| Axios partage | jamais d'`axios.create()` hors de `services/api.ts` |\n"


def test_une_esquisse_est_toujours_inerte(tmp_path, monkeypatch):
    """`re.compile("")` réussit, et un motif vide matche PARTOUT.

    Une esquisse laissée active compterait des milliers de fausses
    infractions dès le premier audit — et tuerait la confiance dans l'outil
    avant même que l'utilisateur ait compris ce qu'il regardait. Tant que
    l'humain n'y a pas écrit son motif, ça reste du commentaire.
    """
    _config_doc_ia(tmp_path, monkeypatch, _TABLE)

    esquisses = Lintorn._esquisses_regles()

    assert esquisses, "la ligne de tableau doit produire une esquisse"
    vivantes = [ligne for ligne in esquisses
                if ligne.strip() and not ligne.startswith("#")]
    assert vivantes == [], f"une esquisse ne doit JAMAIS etre active : {vivantes}"


def test_le_champ_source_couvre_exactement_sa_ligne(tmp_path, monkeypatch):
    """Le lien explicite l'emporte sur l'heuristique de jetons.

    Ici, ni le nom ni le motif de la règle ne rappellent la ligne de doc :
    seul `source` fait le lien. C'est ce qui permet d'arrêter de recopier la
    phrase dans le config.toml — donc de la laisser dériver.
    """
    regle = {"nom": "sans aucun rapport", "source": "CLAUDE.md:1",
             "motif": re.compile(r"zzz")}
    _config_doc_ia(tmp_path, monkeypatch, _TABLE, [regle])

    assert noyau.regles_sans_controle() == []


def test_une_esquisse_deja_presente_n_est_pas_reproposee(tmp_path, monkeypatch):
    """`--esquisser-regles` se relance : sans garde, deux passages
    empileraient deux fois les mêmes brouillons."""
    _config_doc_ia(tmp_path, monkeypatch, _TABLE)

    premiere = Lintorn._esquisses_regles()
    seconde = Lintorn._esquisses_regles("\n".join(premiere))

    assert premiere
    assert seconde == []


def test_les_suffixes_se_deduisent_des_chemins_cites():
    assert Lintorn._suffixes_probables(["services/api.ts", "axios.create()"]) == [".ts"]
    assert Lintorn._suffixes_probables(["var(--bg)", "#fff"]) == [], (
        "aucune extension citee : on laisse la liste vide plutot que d'inventer"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Ce qui s'imprime dans une console reste en ASCII
# ─────────────────────────────────────────────────────────────────────────────
def _litteraux(noeud):
    """Les morceaux littéraux d'une chaîne, f-string et concaténation comprises."""
    if isinstance(noeud, ast.Constant) and isinstance(noeud.value, str):
        return [noeud.value]
    if isinstance(noeud, ast.JoinedStr):
        return [v.value for v in noeud.values
                if isinstance(v, ast.Constant) and isinstance(v.value, str)]
    if isinstance(noeud, ast.BinOp):
        return _litteraux(noeud.left) + _litteraux(noeud.right)
    return []


def _hors_cp1252(texte: str) -> list[str]:
    mauvais = []
    for caractere in texte:
        try:
            caractere.encode("cp1252")
        except UnicodeEncodeError:
            mauvais.append(caractere)
    return sorted(set(mauvais))


def test_la_console_ne_peut_plus_planter_sur_un_caractere():
    """`_console_sure()` degrade au lieu d'exploser.

    Sous Git Bash, `sys.stdout` herite du codepage cp1252 : un caractere
    absent de cette table y levait une UnicodeEncodeError, donc un hook
    pre-push qui echoue sans message exploitable.
    """
    flux = io.TextIOWrapper(io.BytesIO(), encoding="cp1252")
    flux.reconfigure(errors="replace")          # ce que fait _console_sure()

    flux.write("Lintorn \u273b pret\n")        # une etoile absente de cp1252
    flux.flush()

    assert flux.buffer.getvalue().decode("cp1252") == "Lintorn ? pret\n"


def test_ce_qui_s_imprime_reste_lisible_sur_une_console_etroite():
    """Ce qui part vers la console doit s'AFFICHER, pas seulement ne pas planter.

    ⚠️ La contrainte n'est PAS « de l'ASCII ». cp1252 contient les accents,
    les guillemets francais et le tiret cadratin — ils s'affichent tres bien.
    Ce qui manque a cette table, ce sont les symboles, les fleches, le dessin
    de boites et les emoji. Depuis `_console_sure()`, ils ne font plus
    planter ; ils s'affichent « ? », ce qui reste illisible.

    Le RAPPORT, lui, est un fichier UTF-8 : il garde tout. Seule la console
    est etroite.
    """
    fautifs = []
    for nom in ("noyau.py", "cli.py"):
        chemin = Path(Lintorn.__file__).parent / nom
        arbre = ast.parse(chemin.read_text(encoding="utf-8"))
        for noeud in ast.walk(arbre):
            if not isinstance(noeud, ast.Call):
                continue
            appele = getattr(noeud.func, "id", "")
            if appele == "print":
                cibles = noeud.args
            elif appele == "Resultat":
                # 0 = titre, 2 = resume : affiches. 3 = detail : va au rapport.
                cibles = [a for i, a in enumerate(noeud.args) if i in (0, 2)]
            else:
                continue
            for arg in cibles:
                for texte in _litteraux(arg):
                    hors = _hors_cp1252(texte)
                    if hors:
                        fautifs.append(f"{nom}:{noeud.lineno} {hors} {texte[:45]}")

    for texte in (Lintorn._GUIDE, Lintorn.AIDE):
        hors = _hors_cp1252(texte)
        if hors:
            fautifs.append(f"texte fixe {hors}")

    assert fautifs == [], "illisible sur une console cp1252 :\n  " + "\n  ".join(fautifs)


# ─────────────────────────────────────────────────────────────────────────────
# Les outils Python ne sont pas réservés aux projets Django
# ─────────────────────────────────────────────────────────────────────────────
def test_vulture_et_pip_audit_ne_sont_pas_enfermes_dans_django():
    """LE défaut du 21/08/2026, et le plus grave possible pour cet outil.

    `vulture` et `pip-audit` vivaient dans `COMMANDES_DJANGO`, donc n'étaient
    ajoutés que `if BACKEND`. Sur tout projet Python NON-Django — Lintorn
    lui-même compris — un `failles = true` dans la config était ignoré EN
    SILENCE : pas d'audit de sécurité, pas de message, du vert.

    C'est exactement le mode de panne que Lintorn existe pour combattre.
    Ce sont des outils Python, la seule condition qui les concerne est
    l'existence d'une racine Python.
    """
    dans_django = {commande["cle"] for commande in config.COMMANDES_DJANGO}

    assert "code_mort" not in dans_django
    assert "failles" not in dans_django


def test_toute_commande_sait_depuis_ou_elle_se_lance():
    """Un `cwd` à None fait tourner l'outil dans le dossier COURANT.

    `vulture .` y scannerait ce que l'utilisateur a sous les pieds au lieu du
    projet, et rendrait un verdict sur autre chose sans jamais le dire. C'est
    la seconde moitié du même défaut : `cwd = BACKEND` valait None hors Django.
    """
    for commande in config.COMMANDES:
        assert commande["cwd"] is not None, (
            f"{commande['cle']} : sans cwd, l'outil tourne n'importe ou"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Reconnaître le GENRE d'un document
# ─────────────────────────────────────────────────────────────────────────────
def test_un_tutoriel_informe_au_lieu_de_bloquer(tmp_path):
    """MESURÉ SUR FASTAPI : 460 chemins bloquants au premier lancement.

    Un tutoriel apprend au lecteur à créer des fichiers CHEZ LUI : il cite donc
    légitimement des chemins absents d'ici. Sans cette distinction, un
    développeur qui découvre Lintorn se prend un mur d'erreurs et referme
    l'outil — et il n'y a qu'une première impression.
    """
    doc = tmp_path / "tutoriel.md"
    doc.write_text(
        "Cree `app/main.py`, puis `app/routers/items.py`, puis `app/models.py`.",
        encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.statut == "VERIF"
    assert resultat.bloquant is False
    assert "app/main.py" in resultat.detail, "on LISTE toujours : on informe, on n'interdit pas"


def test_un_seul_chemin_faux_bloque_toujours(tmp_path):
    """LE garde-fou de la règle. Sur UNE citation, un taux de 100 % ne veut
    rien dire — et c'est justement la forme du vrai pourrissement de doc : un
    fichier renommé, cité une fois. On ne l'excuse pas."""
    doc = tmp_path / "architecture.md"
    doc.write_text("Le pivot est `api/fichier_qui_nexiste_vraiment_pas.py`.", encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.statut == "ALERTE"
    assert resultat.bloquant is True


def test_un_journal_de_versions_cite_le_passe_sans_mentir(tmp_path):
    """Un changelog cite ce qui existait A L'EPOQUE. Sur FastAPI il pesait à
    lui seul 174 des 460 blocages, avec un taux d'absence de 21 % qu'aucun
    seuil raisonnable n'attraperait."""
    doc = tmp_path / "release-notes.md"
    doc.write_text(
        "0.2.0 : `ancien/module_supprime.py` retire, `autre/parti.py` aussi.",
        encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert resultat.bloquant is False


def test_les_documents_requalifies_sont_ANNONCES(tmp_path):
    """Requalifier en silence serait exactement la panne que Lintorn combat :
    l'utilisateur croirait sa documentation entierement controlee."""
    doc = tmp_path / "tutoriel.md"
    doc.write_text("Cree `a/b.py` et `c/d.py`.", encoding="utf-8")

    resultat = noyau._verifier_documents("t", [doc], bloquant_possible=True)

    assert "1 doc(s) d'un autre genre" in resultat.resume, resultat.resume
