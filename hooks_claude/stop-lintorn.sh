#!/bin/sh
#
# Hook STOP (Claude Code) — Lintorn controle quand Claude a fini de repondre.
#
# A NE PAS CONFONDRE avec matorn/tools/hooks/ : celui-la, c'est git qui le
# lance (pre-push). Ici c'est Claude Code, sur l'evenement « Stop » = l'agent
# a termine son tour de parole.
#
# POURQUOI STOP ET PAS « APRES CHAQUE EDIT » ?
#   Lintorn prend ~20 s. Le declencher apres chaque fichier modifie ajouterait
#   plusieurs minutes d'attente par session. A « Stop », le travail est fini :
#   on paie le controle UNE fois, au moment ou il sert vraiment.
#
# CE QU'IL FAIT
#   1. rien du tout si le code n'a pas bouge depuis le dernier controle vert
#   2. sinon : Lintorn --rapide
#   3. si un controle BLOQUANT est rouge -> sortie 2 : Claude ne s'arrete pas,
#      il recoit l'alerte et repart corriger tout de suite
#
# POUR LE DEBRANCHER : retirer la section "Stop" de .claude/settings.json
#
# CONFIG (variables d'environnement, optionnelles) :
#   LINTORN_STOP_OFF=1   -> le hook ne fait rien du tout

[ -n "$LINTORN_STOP_OFF" ] && exit 0

# ─────────────────────────────────────────────────────────────────────────────
# 1. GARDE ANTI-BOUCLE  (a lire avant tout le reste)
# ─────────────────────────────────────────────────────────────────────────────
# Claude Code envoie sur l'entree standard un JSON decrivant l'evenement. Quand
# on est DEJA dans une relance provoquee par ce hook, il contient
# "stop_hook_active": true.
#
# Sans cette garde : Lintorn rouge -> sortie 2 -> Claude repart -> Stop -> Lintorn
# encore rouge -> ... boucle infinie si la correction ne passe pas du premier
# coup. Avec la garde, Claude a droit a UNE tentative de correction, puis on
# le laisse s'arreter et te rendre la main.
#
# On lit avec grep plutot que jq : jq n'est pas garanti sur toutes les machines
# (Codespaces, Git Bash), et il ne s'agit que de reperer un booleen.
ENTREE=$(cat 2>/dev/null || true)
if printf '%s' "$ENTREE" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. SE PLACER A LA RACINE DU DEPOT
# ─────────────────────────────────────────────────────────────────────────────
RACINE=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -z "$RACINE" ] && exit 0
cd "$RACINE" || exit 0

# ─────────────────────────────────────────────────────────────────────────────
# 3. LE CODE A-T-IL SEULEMENT BOUGE ?
# ─────────────────────────────────────────────────────────────────────────────
# Sans ce filtre, repondre « oui » a une question couterait 20 s de Lintorn pour
# rien. On prend une empreinte du travail non commite et on la compare a celle
# du dernier controle VERT.
#
# L'empreinte couvre TROIS choses, et les trois sont necessaires :
#   1. `git status` (avec --untracked-files=all, sinon git ne liste que le
#      DOSSIER d'un nouveau module, pas les fichiers dedans)
#   2. `git diff HEAD`  -> le contenu modifie des fichiers deja suivis
#   3. le contenu des fichiers NON SUIVIS, hache un par un
#
# Le point 3 n'est pas du zele : sans lui, editer un fichier pas encore
# `git add`-e ne changeait pas l'empreinte, donc Lintorn ne se relancait PAS —
# precisement sur du code neuf, le cas ou il sert le plus.
# `--exclude-standard` fait respecter .gitignore : node_modules et venv ne
# sont jamais parcourus.
#
# L'empreinte n'est ecrite qu'en cas de succes : tant que Lintorn est rouge, le
# controle se relance a chaque tour ou quelque chose change.
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
CACHE="$GIT_DIR/lintorn-stop-empreinte"

etat_du_travail() {
    git status --porcelain --untracked-files=all
    git diff HEAD
    git ls-files --others --exclude-standard | git hash-object --stdin-paths
}

EMPREINTE=""
if command -v sha1sum >/dev/null 2>&1; then
    EMPREINTE=$(etat_du_travail 2>/dev/null | sha1sum | cut -d' ' -f1)
elif command -v shasum >/dev/null 2>&1; then   # macOS
    EMPREINTE=$(etat_du_travail 2>/dev/null | shasum | cut -d' ' -f1)
fi
# Empreinte vide = pas d'outil de hachage : on ne saute rien, on controle.
if [ -n "$EMPREINTE" ] && [ -f "$CACHE" ]; then
    if [ "$EMPREINTE" = "$(cat "$CACHE" 2>/dev/null)" ]; then
        exit 0
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. QUEL PYTHON ?  (meme logique que hooks/pre-push : Lintorn a besoin du venv)
# ─────────────────────────────────────────────────────────────────────────────
if [ -x "matorn/backend/venv/Scripts/python.exe" ]; then
    PY="matorn/backend/venv/Scripts/python.exe"
elif [ -x "matorn/backend/venv/bin/python" ]; then
    PY="matorn/backend/venv/bin/python"
else
    PY="python"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. CONTROLE
# ─────────────────────────────────────────────────────────────────────────────
SORTIE=$("$PY" matorn/tools/Lintorn.py --rapide 2>&1)
CODE=$?

if [ $CODE -eq 0 ]; then
    [ -n "$EMPREINTE" ] && printf '%s' "$EMPREINTE" > "$CACHE" 2>/dev/null
    exit 0
fi

# Sortie 2 = « ne t'arrete pas ». Ce qui part sur la sortie d'ERREUR est remis
# a Claude : c'est ce texte qu'il lit pour savoir quoi corriger.
{
    echo "Lintorn signale un ou plusieurs controles BLOQUANTS en alerte."
    echo "Corrige maintenant, avant de rendre la main. Detail :"
    echo ""
    echo "$SORTIE"
    echo ""
    echo "Rapport complet : matorn/tools/rapport_Lintorn.md"
} >&2
exit 2
