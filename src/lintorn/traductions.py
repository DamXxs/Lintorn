# Lintorn
"""
TOUTES les traductions françaises de l'outil, au même endroit.

Ce fichier ne contient QUE des données — aucun code, aucune logique. Tu peux
y ajouter, corriger ou reformuler ce que tu veux sans risque de rien casser.

Comment ça marche : les outils d'analyse ne parlent qu'anglais et ne seront
jamais traduits (choix de leurs auteurs). On traduit donc à la sortie, en
associant chaque code à une phrase française.

⚠️ Un code absent de ces dictionnaires n'est PAS une erreur : l'outil affiche
alors le message anglais d'origine. On ne perd jamais d'information — on gagne
juste en confort quand la traduction existe.

Pour enrichir : une ligne = un code.
    "F401": "Import inutilisé : ...",
"""

# ─────────────────────────────────────────────────────────────────────────────
# RUFF — le linter Python
# ─────────────────────────────────────────────────────────────────────────────
RUFF = {
    # — pyflakes (F) : les vraies erreurs de logique —
    "F401": "Import inutilisé : ce module est importé mais jamais utilisé. La ligne peut sauter.",
    "F811": "Déjà défini plus haut : ce nom est importé ou défini deux fois. La 1re version ne sert à rien.",
    "F841": "Variable créée puis jamais utilisée : soit c'est un oubli, soit c'est du code mort.",
    "F821": "Nom inconnu : ce nom n'est défini nulle part. Faute de frappe ou import manquant.",

    # — pycodestyle (E) : mise en forme qui compte —
    "E402": "Import placé au milieu du fichier au lieu du début. Souvent le signe d'un ajout fait à la va-vite.",
    "E501": "Ligne trop longue (plus de 120 caractères) : illisible sans faire défiler.",
    "E722": "`except:` tout nu : attrape TOUTES les erreurs, même Ctrl+C. Toujours préciser laquelle.",
    "E741": "Nom de variable ambigu : `l`, `I` et `O` se confondent avec 1 et 0 à l'écran.",

    # — bugbear (B) : les pièges classiques —
    "B904": ("Erreur relancée sans `from` : on perd la trace de l'erreur d'origine. "
             "Écrire `raise MonErreur(...) from err` (ou `from None` si on veut la masquer exprès)."),
    "B006": ("Valeur par défaut modifiable (`[]` ou `{}`) : elle est créée UNE fois et PARTAGÉE "
             "entre tous les appels. Un ajout dans le 1er appel se retrouve dans le suivant."),
    "B008": "Appel de fonction dans une valeur par défaut : exécuté une seule fois, au chargement du module.",

    # — flake8-django (DJ) : les pièges propres à Django —
    "DJ001": ("`null=True` sur un champ texte : ça crée DEUX sortes de vide (NULL en base et "
              "la chaîne vide \"\"). Django recommande `blank=True` seul → un seul vide possible."),
    "DJ008": "Modèle sans `__str__` : il s'affichera « Objet (3) » dans l'admin au lieu de son nom.",
    "DJ012": "Ordre des blocs du modèle : champs d'abord, puis `Meta`, puis `__str__`, puis les méthodes.",
}

# ─────────────────────────────────────────────────────────────────────────────
# DJANGO check --deploy — la checklist de mise en production
# ─────────────────────────────────────────────────────────────────────────────
# Ces alertes sont NORMALES en développement. Elles doivent toutes disparaître
# le jour de la mise en ligne.
DEPLOY = {
    "security.W004": "Pas de HSTS : le navigateur n'est pas forcé de rester en HTTPS lors des visites suivantes.",
    "security.W008": "Pas de redirection automatique HTTP → HTTPS.",
    "security.W009": "SECRET_KEY trop faible ou par défaut : elle signe les sessions, elle doit être longue et unique.",
    "security.W012": "Le cookie de session n'est pas marqué `secure` : il peut circuler en clair sur du HTTP.",
    "security.W016": "Le cookie CSRF n'est pas marqué `secure` : le jeton anti-falsification peut être intercepté.",
    "security.W018": "DEBUG = True : en production, la moindre erreur afficherait "
                     "ton code et tes réglages au visiteur.",
    "security.W019": "X_FRAME_OPTIONS mal réglé : le site pourrait être affiché dans une iframe pirate (clickjacking).",
    "security.W020": "ALLOWED_HOSTS vide : Django accepterait n'importe quel nom de domaine.",
    "security.W022": "Pas de SECURE_REFERRER_POLICY : les URL internes peuvent fuiter vers les sites externes visités.",

    # ── Et les contrôles maison DE TON projet ? ──────────────────────────
    # Django laisse chaque application publier ses propres `check`, avec ses
    # propres identifiants (`monapp.E001`…). Un code absent d'ici n'est jamais
    # perdu : Lintorn affiche alors le message d'origine, en anglais.
    #
    # Pour les traduire, ajoute-les ci-dessus — il n'y a rien d'autre à faire.
    #
    # Ce dictionnaire ne contient volontairement AUCUN code propre à un projet
    # particulier : ils ne voudraient rien dire chez les autres.
}

# Table de correspondance : le nom utilisé dans config.py → le dictionnaire.
# Ajouter un outil traduit = ajouter son dictionnaire ci-dessus et une ligne ici.
PAR_OUTIL = {
    "ruff": RUFF,
    "deploy": DEPLOY,
}
