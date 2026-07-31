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
