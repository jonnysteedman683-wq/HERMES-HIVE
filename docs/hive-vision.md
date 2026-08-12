# HERMES-HIVE — Hive Mind Vision & Development Loop

**Version:** 1.0 — 2026-08-13
**Owner:** Jonny + the swarm itself (this doc is consumed by swarm agents as mission context)

---

## 1. The Vision

> **Hermes operates many swarms at once.** Each swarm is an independent team of ~9 agents
> with its own mission, repos, roster, and budget. A commander layer ("the Hive Mind")
> decomposes massive projects into milestones, routes them to swarms, verifies results,
> and evolves the whole system from evidence. Cost target: **near-$0** — free-tier models
> do the build work, cheap paid models only review, and quality data decides who stays.

Today we run **one swarm** (4 repos × 9 agents × 90-min cycles, fully instrumented).
The development loop in this doc is how the swarm builds the multi-swarm capability —
**the swarm develops the swarm**.

## 2. Current Reality (verified 2026-08-13)

| Piece | State |
|---|---|
| Swarm engine | `hive-swarm.py` v5.2 — 4 repos, 9 agents/cycle, worktrees, merge + lint/build gate, auto-rollback, budget-aware (GLOBAL_BUDGET 2900s under the 5100s cron cap) |
| Task planning | `swarm-prompt-engine.py` — seeded RNG plans (`.hive/prompt_plan.json`), recency/area rotation, effort S/M/L/XL, competitive pair slots 1-2 |
| Strategy channel | `.hive/strategy.json` — folded into every agent prompt by hive-swarm; roster auto-apply at confidence ≥ 0.6. (LLM strategy brain currently unpowered — no Gemini key) |
| Shared brain | `swarm-dream.py` → `.hive/swarm-consciousness.json` (cross-repo patterns, hot list) |
| Watchdogs | heartbeat (20m), change monitor (15m), memory feedback (3h) |
| Quality data | `.hive/quality.json` — per-model avg_score, task_id + effort per agent entry → effort×model A/B |
| Cost | Build agents on OpenRouter free tiers; DeepSeek review lanes ≈ $0.02–0.10/cycle. Full cycle ≈ $0.10 |

**Key architectural fact:** the swarm machinery lives in the Hermes profile scripts dir
(`$HERMES_HOME/scripts/`), *outside* the repos the swarm builds on. Therefore all machinery
development follows a **build-in-repo → gate → promote** pipeline (see §6) — the live cron
path is never mutated by agents directly.

## 3. The Development Loop (the agentic loop)

One full turn of the loop, run continuously:

```
        ┌────────────────────────────────────────────────────────────────┐
        │                        HIVE MIND LOOP                         │
        │                                                               │
        │  SENSE ──► SELECT ──► PLAN ──► BUILD ──► VERIFY ──► MEASURE   │
        │    ▲                                        │          │      │
        │    └──────────── EVOLVE ◄────── LEARN ◄─────┴──────────┘      │
        └────────────────────────────────────────────────────────────────┘
```

| Stage | Mechanism (who does it) | Evidence in / out |
|---|---|---|
| **SENSE** | heartbeat (20m), change monitor (15m), dream cycle (90m), git log + cycle counter | `.hive/heartbeat.json`, `.hive/swarm-consciousness.json`, git history |
| **SELECT** | **`hive-mind.py`** (new — deterministic commander, no LLM) picks the next milestone in dependency order; effort/impact as tiebreaker | `.hive/milestones.json` (state machine) |
| **PLAN** | **`hive-mind.py`** decomposes the milestone into 9 slots (6 build incl. a competitive pair on the core deliverable + 3 review) → `.hive/milestone_plan.json`; prompt engine **locks** onto it (new: milestone lock) and hive-swarm consumes it unchanged | `.hive/milestone_plan.json` → `.hive/prompt_plan.json` |
| **BUILD** | existing `hive-swarm.py` cycle — worktrees, 9 agents, competitive pair, merge gate | git commits, cycle commits `chore: [hermes-hive] cycle #N` |
| **VERIFY** | merge gate (lint+build) + review lanes (security/perf/code+self-report) + **commander-run acceptance commands** (M7 adds runtime probes) | `verify_cmds` exit codes — recorded in milestone evidence |
| **MEASURE** | quality.json (effort × model → gate-pass) + M4 cost ledger | `.hive/quality.json`, ledger |
| **LEARN** | learnings.md, memory feedback cron, dream cycle; M6 cross-swarm brain; M8 auto skill factory | `.hive/learnings.md`, skills |
| **EVOLVE** | strategy.json roster auto-apply (confidence ≥ 0.6); M9 self-tuning of budgets/effort/schedule | `strategy.json` diffs |

**Cadence:** the maintenance swarm runs every 90m. When a milestone is active, the
hermes-hive repo's next 2 cycles become development sprints (the lock); the other 3 repos
keep maintaining. When the plan expires, `hive-mind.py` (every 3h) evaluates the evidence,
marks the milestone done/retry/blocked, and plans the next one. No human in the loop
except when a milestone goes **blocked** or a promote is requested.

## 4. Milestone Roadmap (M1 → M9)

Effort is in swarm cycles (1 cycle = 90m, 9 agents). Impact: H/M/L. Cost: incremental $
on top of the already-running swarm (near-zero — free models).

| # | Milestone | Effort | Impact | Depends | Acceptance (commander-run) |
|---|---|---|---|---|---|
| **M1** | **Swarm Registry** — `hive-core/hive_registry.py` in-repo: SwarmSpec schema (`id, name, mission, repos, roster, schedule_minutes, budget_share, status`), `.hive/swarms.json`, CLI `--list/--show/--create/--migrate-from-repos/--validate`, tests | L (1–2) | H — foundation: N swarms become configurable | — | py_compile OK; `test_registry.py` exits 0; `--list` prints `main`; `--validate` passes |
| **M2** | **Swarm Lifecycle CLI** — start/pause/retire swarms, per-swarm state dirs `.hive/swarms/<id>/`, registry status report | M (1–2) | M — operator surface | M1 | lifecycle CLI round-trip test passes; status report renders 1 active swarm |
| **M3** | **Multi-Swarm Scheduler** — the core scaling step: hive-swarm (or a hive-scheduler) iterates N swarms within GLOBAL_BUDGET; staggered spawns (free-tier rate limits); per-swarm budget shares; partitioned worktree pools (`swarm-<sid>-agent-N`); per-swarm cycle counters | XL (3–5) | **H — THE multi-swarm capability** | M1, M2 | 2 swarms complete cycles in one cron run within budget; no worktree/branch collisions; both quality.json updated |
| **M4** | **Cost Ledger** — parse token/cost from agent outputs; `.hive/ledger.json` per swarm + rollup; free-tier spend verified $0; budget alarms | M (1–2) | H — "low cost/free" evidence + abuse prevention | M1 | ledger updates each cycle; rollup shows $0 free-model spend; alarm fires on paid-model overrun (tested) |
| **M5** | **Mission Decomposer** — `hive-core/mission_planner.py`: a project brief (`docs/missions/<name>.md`) → dependency-ordered milestone graph → per-swarm task streams (deterministic template, optional LLM upgrade later) | L (1–2) | H — massive-project intake | M1 | sample brief produces a valid plan.json consumed by registry; round-trip test passes |
| **M6** | **Hive Brain v2** — dream cycle mines ALL swarms' state; consciousness gains cross-swarm patterns + shared learnings | M (1–2) | M — collective learning across swarms | M1 | dream output includes ≥2 swarms' repos when 2 swarms exist |
| **M7** | **Runtime Verification Gate** — merge gate gains boot/endpoint probes (Compiles≠Wired≠Works): for hermes-hive, boot engine in temp cwd + curl `/api/settings`; record evidence | L (1–2) | H — kills "built-but-orphaned" merges (known failure class) | — | a change that breaks runtime gets rolled back by the gate (fixture test) |
| **M8** | **Auto Skill Factory** — swarm-memory-feedback gains a step: winning cycle patterns → `skill_manage` proposals (pending human/curator approval) | S (1) | M — the swarm teaches itself | — | a winning pattern this cycle yields a skill proposal file with evidence |
| **M9** | **Self-Tuning Loop** — budgets, effort mix, schedule, roster tuned automatically from quality.json + ledger, applied via strategy.json auto-apply channel; before/after evidence recorded | M (1–2) | H — closes the meta-loop | M1, M4 | one tuning event fires with recorded before/after; budget slack stays ≥ 60s for 5+ consecutive cycles |

**Critical path:** M1 → M2 → M3 = concurrent swarms. M4 + M5 = massive projects at proven cost.
M6–M9 = self-improvement. Full run ≈ 12–18 cycles ≈ **1–3 days** of swarm time at ≈ $0.10/cycle.

## 5. Multi-Swarm Target Architecture

```
                        ┌─────────────────────────────┐
                        │        HIVE MIND            │  hive-mind.py (commander)
                        │  milestones.json · select   │  ← cron every 3h, no LLM
                        │  plan · verify · promote    │
                        └──────────────┬──────────────┘
                                       │ milestone_plan.json / strategy.json
        ┌──────────────────┬───────────┴───────────┬──────────────────┐
        ▼                  ▼                       ▼                  ▼
 ┌─────────────┐   ┌─────────────┐          ┌─────────────┐   ┌─────────────┐
 │  SWARM main │   │ SWARM alpha │   ...    │ SWARM beta  │   │ SWARM gamma │
 │ (4 repos,   │   │ (new project│          │ (GTDown     │   │ (obsidian   │
 │  maintain)  │   │  massive)   │          │  polish)    │   │  plugins)   │
 └─────────────┘   └─────────────┘          └─────────────┘   └─────────────┘
        │                  │                       │                  │
        └────────┬─────────┴───────────┬───────────┴────────┬─────────┘
                 ▼                     ▼                    ▼
        ┌─────────────────────────────────────────────────────────┐
        │   SHARED PLATFORM                                        │
        │  · scheduler (GLOBAL_BUDGET, staggered spawns,           │
        │    per-swarm budget_share, partitioned worktree pools)   │
        │  · quality.json per repo · ledger per swarm              │
        │  · swarm-consciousness.json (dream cycle, all swarms)    │
        │  · learnings.md shared · skills (skill factory)          │
        └─────────────────────────────────────────────────────────┘
```

**Scaling laws (design targets):**
- **Machine resources**: each agent is a `hermes chat -q` process; budget the spawn rate, not the count. N swarms interleave inside the same 5100s cron budget instead of multiplying it.
- **Free-tier rate limits**: staggered spawns (never two swarms spawn simultaneously), model rotation across free providers, cheap-paid fallback only for review lanes.
- **Isolation**: per-swarm worktree prefixes + cycle-scoped branches (`swarm-<sid>-c<cycle>-agent-<i>`) — the collision class we already eliminated.
- **Cost**: quality.json arbitrates which models earn tokens; the ledger proves where every cent goes.

## 6. Promotion Policy (build-in-repo → gate → promote)

Swarm machinery changes land in `hive-core/` inside this repo (the swarm can build and
test them in worktrees). Promotion to the live cron path (`$HERMES_HOME/scripts/`) is a
separate, gated step — never automatic by default:

1. Code exists in `hive-core/` + tests; `verify_cmds` for the milestone all pass.
2. `python hive-mind.py --promote <script>` (or milestone `auto_promote: true`) — backs up
   the current live script (`.bak-<timestamp>`), copies the new one, records the event.
3. The heartbeat watchdog verifies the next cron tick still behaves.

## 7. Cost Model (the "free" claim, made verifiable)

| Component | Per cycle | Per day (16 cycles) |
|---|---|---|
| Build agents — OpenRouter free tiers | $0 | $0 |
| Review lanes — DeepSeek flash (2) | ~$0.05 | ~$0.80 |
| Orchestration (cron scripts) | $0 (no LLM) | $0 |
| Commander (hive-mind.py) | $0 (deterministic, no LLM) | $0 |
| **Total** | **~$0.05–0.10** | **~$0.80–1.60** |

Every milestone adds capability without adding LLM spend. M4 makes these numbers measured,
not estimated. Paid tokens flow only where quality.json shows they win.

## 8. Guardrails

1. **Never break the live cron path** — no agent touches `$HERMES_HOME/scripts/`; promotion only.
2. **One milestone at a time** — the lock focuses hermes-hive; no parallel dev sprints on the same repo.
3. **Evidence over vibes** — milestones advance only on `verify_cmds` exit 0; 3 failed attempts → `blocked`, human review.
4. **Budget-first** — every new mechanism must survive the existing 2900s GLOBAL_BUDGET / 5100s cron cap math.
5. **Rollback is cheap** — promotion keeps `.bak` files; the merge gate's auto-rollback stays on.
