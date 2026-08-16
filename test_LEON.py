# /matorn/tools/test_LEON.py
#
# Tests de l'outil d'audit lui-même.
#
# POURQUOI : `LEON.py` lit la sortie de ruff avec une expression régulière.
# Le jour où ruff change son format d'affichage, la regex ne reconnaît plus
# rien — et le code est écrit pour retomber sur la sortie brute SANS rien dire.
# On croirait l'outil en bonne santé alors qu'il aurait cessé de traduire et
# de compter. Ces tests figent le format attendu : si ruff change, ça casse ICI,
# bruyamment, au lieu de dégrader en silence.

import json
import subprocess
from datetime import date, timedelta

import LEON
import config
import noyau
import traductions


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
def test_focus_ne_garde_que_les_fichiers_pousses():
    """git parle en chemins depuis la racine, ruff depuis backend/ :
    le focus doit reconnaître le même fichier sous ses deux formes."""
    faux = noyau.Resultat(
        "Ruff", "ALERTE", "2 alertes",
        "accounts/views.py:7\n    F401 import inutile\n"
        "stock/models.py:121\n    E741 nom ambigu",
    )

    focus = LEON.focus_sur([faux], ["matorn/backend/accounts/views.py"])

    assert focus.statut == "ALERTE"
    assert "accounts/views.py" in focus.detail
    assert "stock/models.py" not in focus.detail


def test_focus_est_vert_quand_le_push_ne_touche_rien_de_casse():
    faux = noyau.Resultat("Ruff", "ALERTE", "1 alerte", "stock/models.py:121\n    E741")

    focus = LEON.focus_sur([faux], ["matorn/frontend/src/App.tsx"])

    assert focus.statut == "OK"


def test_focus_reconnait_les_chemins_windows():
    """Sous Windows, ruff écrit `matorn\\tools\\noyau.py` ; git parle en slashs.

    Sans normaliser AVANT de comparer, le focus ne reconnaissait plus RIEN sur
    cette machine — et comme le hook pre-push l'utilise, il annonçait « aucun
    defaut connu dedans » au moment précis du push. Faux vert, 12/08/2026.
    """
    faux = noyau.Resultat(
        "Ruff", "ALERTE", "1 alerte",
        r"matorn\tools\noyau.py:300:121: E501 Line too long",
    )

    focus = LEON.focus_sur([faux], ["matorn/tools/noyau.py"])

    assert focus.statut == "ALERTE", "chemins Windows non reconnus → faux vert au push"
    assert "noyau.py" in focus.detail


# ─────────────────────────────────────────────────────────────────────────────
# Le marqueur `leon:prospectif`
# ─────────────────────────────────────────────────────────────────────────────
_FANTOME = "`matorn/backend/fichier_qui_nexiste_vraiment_pas.py`"


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
    doc.write_text(f"<!-- leon:prospectif -->\n\nÀ écrire : {_FANTOME}.", encoding="utf-8")

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


def test_un_chemin_complet_devient_repo_relatif():
    specs = noyau._pathspecs_cites("voir `matorn/backend/factures/models.py`")

    assert "matorn/backend/factures/models.py" in specs


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
    """Si `tools/hooks/` est déplacé sans mettre à jour `HOOKS_ATTENDU`, LEON
    réclamerait un `git config` pointant vers un dossier vide — et le push
    repartirait sans contrôle en croyant être protégé."""
    assert config.HOOKS == config.RACINE / config.HOOKS_ATTENDU
    assert (config.HOOKS / "pre-push").is_file()


def test_le_hook_pre_push_est_executable_dans_git():
    """Git refuse en SILENCE de lancer un hook sans le bit exécutable.

    Panne réelle du 16/08/2026 : le hook, créé sous Windows (où ce bit n'existe
    pas), était parti dans le dépôt en `100644`. Sous Windows Git Bash le
    lançait quand même — au passage sous Linux, `git push` a cessé de contrôler
    quoi que ce soit, sans un message, pendant que LEON affichait « branche ».

    On teste le mode dans l'INDEX GIT et non le bit du disque : le mode est ce
    qui voyage avec le dépôt, donc ce qui protège Codespaces et les machines
    futures. Et c'est le seul des deux qui ait la même réponse sur tous les OS.
    """
    chemin = f"{config.HOOKS_ATTENDU}/pre-push"

    sortie = subprocess.run(
        ["git", "ls-files", "-s", "--", chemin],
        cwd=config.RACINE, capture_output=True, text=True, timeout=10, check=False,
    )

    assert sortie.stdout.strip(), f"{chemin} n'est pas suivi par git → le hook ne suivra aucun clone"
    mode = sortie.stdout.split()[0]
    assert mode == "100755", (
        f"{chemin} est enregistre en {mode} : git ne l'executera JAMAIS, "
        "ni ici ni sur un clone, et sans le moindre message. Reparer avec :\n"
        f"    chmod +x {chemin} && git add {chemin}"
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
    """Le .env est FACULTATIF : sans lui, LEON doit se comporter comme avant."""
    assert config._lire_env(tmp_path / "aucun.env") == {}


# ─────────────────────────────────────────────────────────────────────────────
# La liste blanche de vulture
# ─────────────────────────────────────────────────────────────────────────────
def test_la_liste_blanche_vulture_est_bien_branchee():
    """Si `VULTURE_IGNORES` cesse d'être passé à l'outil, les 8 faux positifs
    du 12/08/2026 reviennent — et un contrôle qui n'a QUE des faux positifs
    finit par ne plus être lu, donc par ne plus rien protéger."""
    entree = next(c for c in config.COMMANDES if "vulture" in c["titre"].lower())

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
    """Fichier tronqué par un Ctrl-C : LEON repart de zéro, il ne casse pas."""
    _etat(tmp_path, monkeypatch, "{ceci n'est pas du json")

    assert noyau.lire_etat() == {}


# ─────────────────────────────────────────────────────────────────────────────
# La mise à jour des paquets vulnérables
# ─────────────────────────────────────────────────────────────────────────────
def test_les_versions_se_comparent_en_nombres_pas_en_texte():
    """Comparées comme des CHAÎNES, "6.9.0" passe pour plus récent que
    "6.15.0" — et LEON proposerait de REVENIR en arrière sur un correctif."""
    assert LEON._version_tuple("6.15.0") > LEON._version_tuple("6.9.0")
    assert max(["6.9.0", "6.15.0"], key=LEON._version_tuple) == "6.15.0"
    assert LEON._version_tuple("50.0.0") > LEON._version_tuple("49.0.0")
