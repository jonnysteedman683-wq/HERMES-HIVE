# Intent Bridge — Obsidian → Swarm (Level 2)

The human writes a directive in `Projects/HERMES-HIVE/Backlog.gtd` → **Human Queue**.
The swarm picks it up; the lifecycle renders back in the vault.

## Lifecycle

| Status | Meaning | Trigger |
|---|---|---|
| ⏳ queued | seen in Backlog.gtd, waiting for a plan window | new unchecked task detected (≤15 min) |
| 🔨 running | planned as a `human` milestone — swarm sprints on it | `milestone_plan.json` (engine `human-directive`) covers its fingerprint |
| 👀 needs review | sprints done — human checks the commits, then ticks the box | human plan expired (TTL 2 cycles) |
| ✅ done | human confirmed | box checked in Backlog.gtd |
| 🗑️ dropped | removed from queue | task line deleted |

## Components (writer partition — one writer per file)

| File | Owner | Notes |
|---|---|---|
| `.hive/intents.json` | `hive-core/hive_intent_watch.py` | runtime state, gitignored |
| vault `Intent.md` | watch (exclusive) | auto-rendered, do not hand-edit |
| `milestone_plan.json` / `milestones.json` | live `hive-mind.py` | agents NEVER write these |
| vault `Status.md`/`Milestones.md`/`Learnings.md`/`History/*` | `hive_status_sync.py` | 2h render |
| `docs/human-queue.md` | sync (export) / hive-mind (read) | the machine lane |
| `Backlog.gtd` | the human | the only human-edited file |

## Invariants

1. **Fingerprint parity**: `intent_fp = sha1(text.strip().lower())[:12]` exists in BOTH
   `hive_intent_watch.py` and live `hive-mind.py`. Changing one without the other
   silently breaks queued→running mapping. Regression-guarded by
   `hive-core/test_intent_bridge.py` (run it after any touch).
2. **Canonical text**: task text is marker-free in both lanes (`[ ]`/`[x]` stripped);
   the sync export preserves checkbox state so completions survive the round-trip.
3. **Never write `.hive/` from a render script.** The sync is render-only; the watch
   owns only its own state file. Agents commit through their worktrees only.
4. Human plans get ONE TTL window (2 cycles); the `prev_human` guard in hive-mind
   prevents two human plans back-to-back — unfinished intents re-queue (needs_review
   → running on the next human plan).

## Testing

```bash
python hive-core/test_intent_bridge.py        # parity + export + E2E (scratch dirs)
python hive-core/test_intent_bridge.py --parity  # fast parity check
```

The E2E runs the real watch against a scratch vault+repo via
`OBSIDIAN_VAULT_PATH`/`HERMES_HIVE_REPO` env overrides — never touches the live vault.
