#!/usr/bin/env python3
"""hive_intent_watch.py — Obsidian → swarm intent bridge (Level 2).

Detects human directives in Backlog.gtd's 'Human Queue' project (via the same
parser as hive_status_sync.py), tracks each through a lifecycle in
.hive/intents.json, and renders Projects/HERMES-HIVE/Intent.md in the vault.

Lifecycle:
  ⏳ queued        — new unchecked task appears in Backlog.gtd
  🔨 running       — a 'human-directive' milestone_plan.json covers it
                     (matched by intent fingerprint stamped by hive-mind.py)
  👀 needs_review  — that plan expired; swarm sprints are done (evidence:
                     commits landed during the plan window, from git log)
  ✅ done          — user checked the box in Backlog.gtd
  🗑️ dropped       — task removed from the queue before completion

Writer rules (strict):
  - owns ONLY .hive/intents.json and vault Intent.md — no other files
  - never writes milestone_plan.json / milestones.json (hive-mind's domain)
  - reads Backlog.gtd directly (vault); never writes it
  - if the vault queue cannot be read (missing file / OneDrive hiccup), the
    tick bails out WITHOUT touching state — no false 'dropped' transitions.

Silent on no-change (cron watchdog pattern); --verbose for manual runs.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# same resolution as hive_status_sync.py
VAULT = Path(os.environ.get(
    "OBSIDIAN_VAULT_PATH",
    r"C:/Users/jonny/OneDrive/Documents/Obsidian Vault",
))
REPO = Path(os.environ.get(
    "HERMES_HIVE_REPO",
    r"C:/Users/jonny/HERMES-HIVE",
))
HIVE = REPO / ".hive"
ROOM = VAULT / "Projects" / "HERMES-HIVE"
INTENTS_FILE = HIVE / "intents.json"
INTENT_NOTE = ROOM / "Intent.md"
COUNTER_FILE = HIVE / "swarm_cycle_counter"
PLAN_FILE = HIVE / "milestone_plan.json"

# keep in sync with hive-mind.py's intent_fp() — must match byte-for-byte
def intent_fp(text: str) -> str:
    return hashlib.sha1(text.strip().lower().encode("utf-8")).hexdigest()[:12]


def load_json(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default if default is not None else {}


def now_iso() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def read_cycle() -> int:
    try:
        return int(COUNTER_FILE.read_text(encoding="utf-8").strip())
    except Exception:
        return -1


def plan_context() -> dict:
    """Freshness + fingerprint context of the current milestone plan."""
    mp = load_json(PLAN_FILE, None) or {}
    if not mp:
        return {"is_human": False, "fresh": False, "fps": set(), "cycle": None,
                "generated_at": None, "name": ""}
    written = mp.get("cycle", -1)
    ttl = int(mp.get("valid_for_cycles", 2))
    fresh = read_cycle() <= written + ttl - 1
    return {
        "is_human": mp.get("engine_version") == "human-directive",
        "fresh": fresh,
        "fps": set(mp.get("intent_fingerprints", []) or []),
        "cycle": written,
        "generated_at": mp.get("generated_at"),
        "name": mp.get("name", ""),
    }


def git_evidence(since_iso: str, limit: int = 15) -> list[str]:
    """Commits that landed in HERMES-HIVE since a timestamp (plan window)."""
    if not since_iso:
        return []
    try:
        r = subprocess.run(
            ["git", "-C", str(REPO), "log", f"--since={since_iso}",
             "--oneline", f"-{limit}", "--date=short"],
            capture_output=True, text=True, timeout=15,
        )
        lines = [ln.strip() for ln in (r.stdout or "").splitlines() if ln.strip()]
        return lines[:limit]
    except Exception:
        return []


def read_vault_queue() -> list[tuple[str, bool]] | None:
    """(text, checked) pairs from Backlog.gtd Human Queue.

    Returns None when the vault cannot be read — callers must then skip ALL
    state transitions (no removals, no completions) to stay crash-safe.
    """
    from hive_status_sync import read_gtd_tasks  # same repo dir, one writer
    gtd = ROOM / "Backlog.gtd"
    if not gtd.exists():
        return None
    try:
        return read_gtd_tasks()
    except Exception:
        return None


def load_state() -> dict:
    st = load_json(INTENTS_FILE, None)
    if isinstance(st, dict) and isinstance(st.get("tasks"), dict):
        return st
    return {"version": 1, "updated_at": None, "tasks": {}}


def save_state(st: dict) -> None:
    st["updated_at"] = now_iso()
    HIVE.mkdir(parents=True, exist_ok=True)
    INTENTS_FILE.write_text(
        json.dumps(st, indent=2, ensure_ascii=False), encoding="utf-8")


STATUS_GLYPH = {"queued": "⏳", "running": "🔨", "needs_review": "👀",
                "done": "✅", "dropped": "🗑️"}


def render_intent_note(st: dict) -> str:
    tasks = st.get("tasks", {})
    active = [t for t in tasks.values() if t["status"] in
              ("queued", "running", "needs_review")]
    done = [t for t in tasks.values() if t["status"] in ("done", "dropped")]
    done.sort(key=lambda t: t.get("done_at") or t.get("dropped_at") or "", reverse=True)

    lines = [
        "---",
        "tags:",
        "  - hermes-hive",
        "  - auto-synced",
        "---",
        "# 🧠 Human Intents",
        f"_Auto-rendered {now_iso()} by `hive_intent_watch.py` — do not hand-edit_",
        "",
        "_Write directives in **[[Backlog.gtd]] → Human Queue**. The swarm picks them up;",
        " check the box when you're satisfied and the loop closes here._",
        "",
        "| Status | Meaning |",
        "|---|---|",
        "| ⏳ queued | seen in Backlog.gtd, waiting for a swarm plan window |",
        "| 🔨 running | planned as a 'human' milestone — swarm sprints on it |",
        "| 👀 needs review | sprints done — check the commits, then tick the box |",
        "| ✅ done | you confirmed — archived |",
        "",
        "## ⏳ In flight",
        "",
    ]
    if active:
        active.sort(key=lambda t: t.get("first_seen", ""))
        lines += ["| Task | Status | Since | Planned cycle | Evidence |",
                  "|---|---|---|---|---|"]
        for t in active:
            ev = t.get("evidence") or []
            ev_txt = (f"`{ev[0][:60]}` +{len(ev)-1}" if len(ev) > 1
                      else f"`{ev[0][:60]}`" if ev else "—")
            lines.append(
                f"| {t.get('text', '?')} | {STATUS_GLYPH.get(t['status'], '?')} "
                f"{t['status']} | {t.get('first_seen', '?')} | "
                f"`{t.get('planned_cycle', '—')}` | {ev_txt} |")
    else:
        lines.append("_Nothing queued — write a task in [[Backlog.gtd]] under Human Queue._")

    lines += ["", "## ✅ Recently closed", ""]
    if done:
        lines += ["| Task | Closed | Via | Evidence |", "|---|---|---|---|"]
        for t in done[:12]:
            closed = t.get("done_at") or t.get("dropped_at") or "?"
            via = "checked" if t["status"] == "done" else "removed"
            ev = t.get("evidence") or []
            ev_txt = (f"`{ev[0][:60]}`" if ev else "—")
            lines.append(f"| ~~{t.get('text', '?')}~~ | {closed} | {via} | {ev_txt} |")
    else:
        lines.append("_Nothing closed yet._")

    lines += ["", "<!-- synced {} -->".format(now_iso())]
    return "\n".join(lines)


def tick(verbose: bool, dry_run: bool, touch: bool = False) -> bool:
    """Returns True when state changed (caller prints + renders)."""
    st = load_state()
    tasks = st["tasks"]

    queue = read_vault_queue()
    if queue is None:
        if verbose:
            print("hive-intent-watch: Backlog.gtd unreadable — bailing out (no transitions).")
        return False

    pc = plan_context()
    now = now_iso()
    now_fps = {intent_fp(t): (t, c) for t, c in queue}
    changed = False

    # ── existing intents ─────────────────────────────────────────────
    for fp, rec in list(tasks.items()):
        status = rec["status"]
        if fp not in now_fps:
            # removed from queue — but never when the vault was unreadable
            if status in ("queued", "running", "needs_review"):
                if status == "running":
                    rec["evidence"] = git_evidence(rec.get("planned_at") or "")
                rec["status"] = "dropped"
                rec["dropped_at"] = now
                changed = True
            continue
        text, checked = now_fps[fp]
        rec["text"] = text  # reflect checkbox strip / edits
        if checked:
            if status in ("queued", "running", "needs_review"):
                rec["status"] = "done"
                rec["done_at"] = now
                rec["done_via"] = "checked"
                changed = True
            continue
        # active in queue, unchecked
        if status == "queued" and pc["is_human"] and pc["fresh"] and fp in pc["fps"]:
            rec["status"] = "running"
            rec["planned_cycle"] = pc["cycle"]
            rec["planned_at"] = pc["generated_at"]
            changed = True
        elif status == "running":
            covered = pc["is_human"] and pc["fresh"] and fp in pc["fps"]
            if not covered:
                # plan expired or replaced — sprints done, hand back to human
                rec["evidence"] = git_evidence(rec.get("planned_at") or "")
                rec["status"] = "needs_review"
                changed = True
        elif status == "needs_review":
            if pc["is_human"] and pc["fresh"] and fp in pc["fps"]:
                rec["status"] = "running"  # re-planned by hive-mind
                rec["planned_cycle"] = pc["cycle"]
                rec["planned_at"] = pc["generated_at"]
                changed = True

    # ── brand-new intents ────────────────────────────────────────────
    for fp, (text, checked) in now_fps.items():
        if fp not in tasks:
            tasks[fp] = {
                "text": text, "first_seen": now,
                "status": "done" if checked else "queued",
                "done_at": now if checked else None,
                "done_via": "checked" if checked else None,
                "planned_cycle": None, "planned_at": None,
                "evidence": [], "dropped_at": None,
            }
            changed = True

    if changed:
        save_state(st)
        if not dry_run:
            ROOM.mkdir(parents=True, exist_ok=True)
            INTENT_NOTE.write_text(render_intent_note(st), encoding="utf-8")
        if verbose:
            n = {s: sum(1 for t in tasks.values() if t["status"] == s)
                 for s in ("queued", "running", "needs_review", "done", "dropped")}
            print(f"hive-intent-watch: state changed — {n} "
                  f"(plan: {pc['name'] or 'none'}, cycle {pc['cycle']}, "
                  f"{'fresh' if pc['fresh'] else 'expired'})")
    elif verbose or touch:
        if touch and not dry_run:
            # force-render even without state change: creates the empty
            # Intent.md up front and self-heals it if deleted
            ROOM.mkdir(parents=True, exist_ok=True)
            INTENT_NOTE.write_text(render_intent_note(st), encoding="utf-8")
        if verbose:
            print("hive-intent-watch: no change — silent.")
    return changed


def main() -> int:
    ap = argparse.ArgumentParser(description="Obsidian → swarm intent bridge watcher")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="report without writing")
    ap.add_argument("--touch", action="store_true",
                    help="render Intent.md even without state change")
    args = ap.parse_args()
    tick(verbose=args.verbose, dry_run=args.dry_run, touch=args.touch)
    return 0


if __name__ == "__main__":
    sys.exit(main())
