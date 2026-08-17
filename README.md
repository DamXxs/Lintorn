# Lintorn

**Audits your code and the memory your AI assistant reads — and tells you when the two drift apart.**

Coding assistants read project documentation: CLAUDE.md, architecture notes, persistent
memory files. That documentation is written once and then quietly rots. The assistant keeps
reading it, keeps trusting it, and keeps acting on rules that no longer match the code.

Lintorn checks both sides. It runs the usual quality tools over your codebase, and it also
verifies that every file path, rule and claim in your AI-facing documentation still
corresponds to something real. When they disagree, it says so.

> ⚠️ **Early days.** Lintorn currently runs as a script inside the project it audits, and
> still carries assumptions from the codebase it was born in (a Django + React app). The
> packaging work — `pip install`, auto-detection, per-project configuration — is in progress.
> Watch or star the repo if you want to know when it lands.

## What it checks

| Area | Checks |
|---|---|
| **Docs vs code** | every path cited in documentation still exists; prospective docs flagged, not failed |
| **AI memory vs code** | same treatment for the assistant's persistent memory files |
| **Memory freshness** | memory that cites code changed since it was last verified |
| **House rules** | project-specific conventions you declare, enforced mechanically |
| **Python** | ruff, `manage.py check`, missing migrations, business-rule validation |
| **JavaScript** | `tsc --noEmit` |
| **Tests** | pytest |
| **Security** | `check --deploy`, known vulnerabilities (`pip-audit`) |
| **Tooling itself** | whether its own git pre-push hook is installed *and executable* |

That last one is not a joke. A hook committed without its executable bit is silently ignored
by git — the guard looks healthy and protects nothing. Lintorn is built around the idea that
**a check that goes quiet is more dangerous than a check that goes red**.

## Status

Working and used daily on a real project. Not yet packaged for general use.

## License

[AGPL-3.0](LICENSE). You may use, modify and share Lintorn freely. If you distribute it — or
offer it as a network service — you must release your source under the same license.

Copyright holder: **Olotorn**. For a commercial license exempting you from the AGPL's
source-disclosure requirement, get in touch.

## Contributing

Not open to outside contributions yet. Contributions will require a CLA, so that dual
licensing remains possible.
