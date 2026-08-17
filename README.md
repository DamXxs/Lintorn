# Lintorn

**Audits your code and the memory your AI assistant reads — and tells you when the two drift apart.**

Coding assistants read your project documentation: CLAUDE.md, architecture notes, persistent
memory files. That documentation is written once and then quietly rots. The assistant keeps
reading it, keeps trusting it, and keeps acting on rules that no longer match the code.

Lintorn checks both sides. It runs the usual quality tools over your codebase, and it verifies
that every path, rule and claim in your AI-facing documentation still corresponds to something
real. When they disagree, it says so.

```console
$ pip install lintorn
$ cd your-project
$ lintorn --init
$ lintorn

=== Lintorn - RAPPORT AUDIT ===
[ OK ] Ruff (lint Python)          rien a signaler
[ OK ] TypeScript (tsc --noEmit)   rien a signaler
[ !! ] Doc vs code                 124 chemin(s) cite(s), 12 introuvable(s)
[ ?? ] Memoire IA vs code          46 chemin(s) cite(s), 3 a verifier
[ OK ] Hook pre-push               branche et executable
```

## The idea it is built around

> **A check that goes quiet is more dangerous than a check that goes red.**

A red check gets fixed. A check that silently stops working leaves you feeling covered while
nothing is being watched. Lintorn treats that as the primary failure mode, everywhere:

- A tool that is **not installed** reports as unavailable — never as "0 problems found".
- A rule whose target directory does not exist is **dropped**, not reported as passing.
- Declaring **no** rules says so, instead of "all rules are met".
- Its own git hook is checked for the **executable bit** — git ignores a non-executable hook
  in complete silence, which is exactly how this project lost its guard for four days.

## What it checks

| Area | Checks |
|---|---|
| **Docs vs code** | every path cited in your documentation still exists |
| **AI memory vs code** | same treatment for your assistant's persistent memory |
| **Memory freshness** | memory citing code that changed since it was last verified |
| **House rules** | your own conventions, enforced mechanically |
| **Python** | ruff, missing migrations, `manage.py check`, pytest, pip-audit, vulture |
| **JavaScript** | `tsc --noEmit` |
| **Tooling itself** | whether its own pre-push hook is installed *and* executable |

Everything is auto-detected. No Django? The Django checks do not appear at all — rather than
sitting there permanently "unavailable", which is how a warning light becomes furniture.

## Documents that legitimately cite what does not exist

A roadmap, a design note or a post-mortem cites files that do not exist — not yet
(a module still to write), or no longer (a file deleted, mentioned precisely because
it was). Blocking on those would push you to write such documents *outside* the
scanned folders, which recreates the blind spot the check exists to remove.

Mark the document, anywhere in it:

```markdown
<!-- lintorn:prospectif -->
```

Its dead paths are then **listed, not failed** — you still see them, they just stop
blocking your push.

## Safe by default

The first run cannot damage anything. Lintorn does not modify your files, does not reach the
network, and does not execute your project's code unless you ask.

These are **opt-in**: `tests` (runs your code), `failles` (network), `donnees_metier` (opens
your database), `code_mort` and `deploy` (noisy during development).

## Configuration

`lintorn --init` writes a `.lintorn/config.toml` shaped for what it found. Configuration lives
either there, or under `[tool.lintorn]` in your `pyproject.toml` — the standalone file matters
for projects with no `pyproject.toml` at their root, which is most non-Python ones.

```toml
[controles]
tests = true

[[regles]]
nom      = "Hard-coded colours in CSS"
regle    = "theme variables only — var(--bg)"
racine   = "front/src"
suffixes = [".css"]
motif    = '#[0-9a-fA-F]{3,8}\b'
bloquant = false          # true = block the regression, false = measure the debt

[[commandes]]
cle   = "mypy"
titre = "Types (mypy)"
cmd   = ["python", "-m", "mypy", "."]
```

Custom commands are **executed** — the same contract as npm scripts, git hooks or a Makefile.
Do not run Lintorn inside a repository you do not trust.

## Other languages

Lintorn is *written* in Python; it does not require your project to be. The four checks that
make it unusual — docs vs code, AI memory, house rules, hook integrity — are language-agnostic
and work on any repository. Anything else plugs in through `[[commandes]]`: phpstan, eslint,
`go vet`, `cargo clippy`.

## The external tools

Lintorn itself has **zero dependencies** — deliberately, so it can run inside a git hook with
any Python on the machine. The tools it calls belong to the project being audited, so that ruff
applies *your* rules and pytest sees *your* dependencies.

```console
$ lintorn --installer-outils     # ruff, pytest, vulture, pip-audit — asks first
```

TypeScript needs nothing extra: `npm install` already provides `tsc`.

## Commands

```console
lintorn                      full audit
lintorn --rapide             skip the slow tools (what the pre-push hook runs)
lintorn --init               generate the config for this project
lintorn --installer-hook     install the pre-push hook
lintorn --installer-outils   install the external tools, after confirmation
lintorn --doc                documentation check only
lintorn --maj-securite       what pip-audit suggests (dry run)
```

Requires Python 3.11+.

## Status

Working, and used daily. Lintorn audits itself — the fastest way to find out that a check had
quietly stopped meaning anything.

## License

[AGPL-3.0](LICENSE). Use, modify and share it freely. If you distribute it — or offer it as a
network service — you must release your source under the same license.

Copyright holder: **Olotorn**. For a commercial license exempting you from the source-disclosure
requirement, get in touch.

## Contributing

Not open to outside code contributions yet — bug reports and ideas are welcome. When it opens,
contributions will require a CLA, so that dual licensing remains possible. Details in
`CONTRIBUTING.md`.
