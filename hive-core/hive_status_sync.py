#!/usr/bin/env python3
"""hive_status_sync.py — HERMES-HIVE → Obsidian mission room bridge.

Reads .hive/ machine state (JSON) and renders human-readable narrative into the
Obsidian vault. Render-only: never writes to .hive/. One writer into the vault.

Outputs (vault):
  Projects/HERMES-HIVE/Status.md      — one-screen health
  Projects/HERMES-HIVE/Milestones.md  — M1..M9 roadmap table
  Projects/HERMES-HIVE/Learnings.md   — mirror of .hive/learnings.md
  Projects/HERMES-HIVE/History/cycle-<N>.md — snapshot per new swarm cycle
  HERMES-HIVE/docs/human-queue.md     — reverse export of Backlog.gtd Human Queue

Silent on success (cron watchdog pattern); use --verbose for manual runs.
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

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
HISTORY = ROOM / "History"
STATE_FILE = Path(os.environ.get(
    "HIVE_SYNC_STATE",
    os.path.expanduser("~/.hive-status-sync.state.json"),
))


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


VERDICT_GLYPH = {"verified": "✅", "unverified": "⚠️", "n/a": "—"}


def verdict_of(ver: dict, mid: str) -> str:
    return (ver.get("milestones", {}).get(mid, {}) or {}).get("verdict", "")


def verdict_glyph(ver: dict, mid: str) -> str:
    return VERDICT_GLYPH.get(verdict_of(ver, mid), "—")


def read_gtd_tasks() -> list[tuple[str, bool]]:
    """Parse Backlog.gtd 'Human Queue' project into (task, checked) pairs."""
    gtd = ROOM / "Backlog.gtd"
    if not gtd.exists():
        return []
    lines, queue, in_queue = [], [], False
    try:
        lines = gtd.read_text(encoding="utf-8").splitlines()
    except Exception:
        return []
    for ln in lines:
        stripped = ln.strip()
        if stripped.endswith(":") and not stripped.startswith("-"):
            in_queue = stripped.rstrip(":").lower() == "human queue"
            continue
        if in_queue and stripped.startswith("- "):
            text = stripped[2:].strip()
            checked = text.lower().startswith("[x]")
            if checked:
                text = text[3:].strip()
            elif text.lower().startswith("[ ]"):
                # canonical: drop the marker so fingerprints match across
                # lanes (hive-mind strips "- [ ] " when reading the export)
                text = text[3:].strip()
            queue.append((text, checked))
    return queue


def read_gtd_queue() -> list[str]:
    """Compatibility shim: unchecked task texts only."""
    return [t for t, checked in read_gtd_tasks() if not checked]


def render_status(data: dict, ver: dict) -> str:
    now = now_str()
    cycle = data.get("cycle_counter", "?")
    ms = data.get("milestones", {})
    cur_id = ms.get("current", "")
    cur = ms.get("milestones", {}).get(cur_id, {})
    q = data.get("quality", {}).get("agents", {})
    hb = data.get("heartbeat", {})
    hb_ts = hb.get("last_heartbeat") or hb.get("ts") or hb.get("timestamp") or "?"
    plan = data.get("prompt_plan", {})

    lines = [
        "---",
        "tags:",
        "  - hermes-hive",
        "  - auto-synced",
        "---",
        f"# 📡 Swarm Status",
        f"_Auto-rendered {now} · from `.hive/` — do not hand-edit_",
        "",
        "## 🧭 Current cycle",
        f"- **Cycle counter:** `{cycle}`",
        f"- **Last heartbeat:** `{hb_ts}`",
        "",
        "## 🎯 Active milestone",
    ]
    if cur:
        lines += [
            f"- **{cur.get('id', cur_id)} — {cur.get('name', '?')}** ({cur.get('status', '?')})",
            f"- Effort: `{cur.get('effort', '?')}` · Impact: `{cur.get('impact', '?')}` · Attempts: `{cur.get('attempts', 0)}` · Cycles spent: `{cur.get('cycles_spent', 0)}`",
            f"- Area: `{cur.get('area', '?')}`",
        ]
    else:
        lines.append("- _No active milestone._")

    # ⚠️ Blocked-milestone human-review banner
    blocked = [m for m in ms.get("milestones", {}).values() if m.get("status") == "blocked"]
    if blocked:
        lines += ["", "## ⚠️ Blocked — human review needed", ""]
        for m in blocked:
            lines.append(f"- **{m.get('id', '?')} — {m.get('name', '?')}** (attempts {m.get('attempts', 0)})")
            lines.append(f"  - _Awaiting human decision: queue directives in [[Backlog.gtd]] or mark done._")

    # 🧠 Human intents — Obsidian → swarm bridge summary (from hive_intent_watch.py)
    intents = HIVE / "intents.json"
    try:
        it = json.loads(intents.read_text(encoding="utf-8")).get("tasks", {})
        nq = sum(1 for t in it.values() if t.get("status") == "queued")
        nr = sum(1 for t in it.values() if t.get("status") == "running")
        nw = sum(1 for t in it.values() if t.get("status") == "needs_review")
        if nq or nr or nw:
            lines += ["", "## 🧠 Human intents",
                      f"- {nq} ⏳ queued · {nr} 🔨 running · {nw} 👀 need review — "
                      f"see [[Intent.md]] for the full lifecycle."]
    except Exception:
        pass

    # 🔎 Verification — independent re-check of done milestones
    ver_ms = (ver or {}).get("milestones", {})
    done = [(mid, m) for mid, m in ms.get("milestones", {}).items() if m.get("status") == "done"]
    if done:
        lines += ["", "## 🔎 Verification (independent re-check)", ""]
        for mid, m in done:
            v = ver_ms.get(mid, {}) or {}
            verdict = v.get("verdict", "unverified")
            glyph = VERDICT_GLYPH.get(verdict, "⚠️")
            lines.append(f"- {glyph} **{mid} — {m.get('name', '?')}** ({verdict})")
            if verdict != "verified":
                lines.append(f"  - _{v.get('reason', 'not independently verified')}_")

    if plan:
        lines += ["", "## 📋 Current plan"]
        tasks = plan.get("tasks") or plan.get("slots") or []
        if isinstance(tasks, dict):
            tasks = list(tasks.values())
        if isinstance(tasks, list):
            for t in tasks[:12]:
                if isinstance(t, dict):
                    role = t.get("role", "")
                    task_id = t.get("task_id", "")
                    effort = t.get("effort", "")
                    area = t.get("area", "")
                    desc = t.get("description") or t.get("title") or t.get("task") or f"{task_id} ({role})"
                    if len(desc) > 150:
                        desc = desc[:147] + "..."
                    lines.append(f"- **{role}** {desc} `{effort}` `{area}`".strip())
        else:
            lines.append(f"- {str(plan)[:200]}")

    if q:
        lines += ["", "## 🏅 Agent quality (avg_score)", "", "| Model | Cycles | Avg score | Commits |", "|---|---|---|---|"]
        for model, stats in sorted(q.items(), key=lambda kv: -kv[1].get("avg_score", 0)):
            lines.append(
                f"| {model} | {stats.get('cycles', 0)} | {stats.get('avg_score', 0)} | {stats.get('total_commits', 0)} |"
            )
    lines += ["", f"<!-- synced {now} -->"]
    return "\n".join(lines)


def render_milestones(ms: dict, ver: dict) -> str:
    lines = [
        "---",
        "tags:",
        "  - hermes-hive",
        "  - auto-synced",
        "---",
        "# 🗺️ Milestone Roadmap",
        "_Auto-rendered from `.hive/milestones.json`_",
        "",
        "| # | Milestone | Status | Verified | Effort | Impact | Depends | Attempts |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for mid, m in sorted(ms.get("milestones", {}).items()):
        dep = ", ".join(m.get("depends_on", [])) or "—"
        lines.append(
            f"| {mid} | {m.get('name', '?')} | {m.get('status', '?')} | {verdict_glyph(ver, mid)} | {m.get('effort', '?')} | {m.get('impact', '?')} | {dep} | {m.get('attempts', 0)} |"
        )
    cur = ms.get("current")
    if cur:
        lines += ["", f"**Current:** `{cur}`"]
    return "\n".join(lines)


def write_swarm_plan_section(mp: dict) -> None:
    """Rewrite Backlog.gtd 'Swarm Plan' section from milestone_plan.json.

    Human Queue (hand-edited) is preserved; the Swarm Plan below it is
    regenerated so the vault always shows what the swarm is actually doing next.
    """
    gtd = ROOM / "Backlog.gtd"
    if not gtd.exists():
        return
    try:
        lines = gtd.read_text(encoding="utf-8").splitlines()
    except Exception:
        return
    # keep everything up to (and including) the Swarm Plan heading
    head, in_plan = [], False
    for ln in lines:
        if ln.strip().rstrip(":").lower() == "swarm plan":
            head.append(ln)
            in_plan = True
            break
        head.append(ln)
    if not in_plan:
        return  # no Swarm Plan section — nothing to do
    body = [""]
    if mp:
        slots = mp.get("slots", {})
        if isinstance(slots, dict):
            slots = list(slots.values())
        body.append(f"# {mp.get('milestone', '?')} — {mp.get('name', '?')} "
                    f"(planned cycle {mp.get('cycle', '?')}, valid {mp.get('valid_for_cycles', 2)} cycles)")
        for t in slots:
            if isinstance(t, dict):
                role = t.get("role", "")
                desc = t.get("task") or t.get("description") or t.get("task_id") or "?"
                if len(desc) > 160:
                    desc = desc[:157] + "..."
                body.append(f"\t- [{role}] {desc}")
    else:
        body.append("# No active plan — swarm idle.")
    body.append("")
    out = "\n".join(head + body)
    gtd.write_text(out, encoding="utf-8")
    return


def write_mirrors(data: dict, ver: dict) -> None:
    ROOM.mkdir(parents=True, exist_ok=True)
    HISTORY.mkdir(parents=True, exist_ok=True)

    (ROOM / "Status.md").write_text(render_status(data, ver), encoding="utf-8")
    (ROOM / "Milestones.md").write_text(render_milestones(data.get("milestones", {}), ver), encoding="utf-8")

    learn_src = HIVE / "learnings.md"
    if learn_src.exists():
        body = learn_src.read_text(encoding="utf-8")
        header = "---\ntags:\n  - hermes-hive\n  - auto-synced\n---\n\n# 🧠 Shared Brain\n_Auto-mirror of `.hive/learnings.md` — do not hand-edit._\n\n---\n\n"
        (ROOM / "Learnings.md").write_text(header + body, encoding="utf-8")


def write_cycle_snapshot(cycle: str, data: dict) -> bool:
    """Write History/cycle-<N>.md only when the cycle counter advanced."""
    state = {"cycle": None}
    if STATE_FILE.exists():
        try:
            state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            state = {"cycle": None}
    if str(state.get("cycle")) == str(cycle):
        return False

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    cur_id = data.get("current", "")
    cur = data.get("milestones", {}).get(cur_id, {})
    q = data.get("quality", {}).get("agents", {})
    body = [
        f"# 🕘 Cycle {cycle} — snapshot {stamp}",
        "",
        f"- **Active milestone:** {cur_id} — {cur.get('name', '?')} ({cur.get('status', '?')})",
        f"- **Effort/Impact:** {cur.get('effort', '?')}/{cur.get('impact', '?')} · attempts {cur.get('attempts', 0)}",
        "",
        "## 🏅 Agent quality",
        "",
    ]
    if q:
        for model, s in sorted(q.items(), key=lambda kv: -kv[1].get("avg_score", 0)):
            body.append(f"- **{model}** — avg {s.get('avg_score', 0)} · {s.get('cycles', 0)} cycles · {s.get('total_commits', 0)} commits")
    else:
        body.append("- _No quality data yet._")
    body.append("")
    body.append("---")
    body.append(f"*Synced {now_str()} by `hive_status_sync.py`*")

    (HISTORY / f"cycle-{cycle}-{stamp}.md").write_text("\n".join(body), encoding="utf-8")
    STATE_FILE.write_text(json.dumps({"cycle": str(cycle)}), encoding="utf-8")
    return True


def export_human_queue() -> bool:
    """Backlog.gtd 'Human Queue' → repo docs/human-queue.md (safe reverse lane).

    Checkbox state is preserved (`[x]` stays `[x]`) so completions in Obsidian
    survive the round-trip — hive_intent_watch.py reads them to mark intents done.
    """
    tasks = read_gtd_tasks()
    out = REPO / "docs" / "human-queue.md"
    body = [
        "# Human Queue (from Obsidian Backlog.gtd)",
        f"_Auto-exported {now_str()} by hive_status_sync.py_",
        "",
    ]
    if tasks:
        body += ["## Tasks", ""] + [f"- {'[x]' if checked else '[ ]'} {t}" for t, checked in tasks]
    else:
        body += ["_Empty — nothing queued by the human._"]
    out.write_text("\n".join(body) + "\n", encoding="utf-8")
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    data = {
        "cycle_counter": (HIVE / "swarm_cycle_counter").read_text(encoding="utf-8").strip() if (HIVE / "swarm_cycle_counter").exists() else "?",
        "milestones": load_json(HIVE / "milestones.json"),
        "quality": load_json(HIVE / "quality.json"),
        "heartbeat": load_json(HIVE / "heartbeat.json"),
        "prompt_plan": load_json(HIVE / "prompt_plan.json"),
    }
    ver = load_json(HIVE / "verification.json")

    write_mirrors(data, ver)
    write_swarm_plan_section(load_json(HIVE / "milestone_plan.json"))
    wrote_cycle = write_cycle_snapshot(data["cycle_counter"], data)
    export_human_queue()

    if args.verbose:
        print(f"cycle={data['cycle_counter']} new_snapshot={wrote_cycle} vault={ROOM} queue_exported=ok")


if __name__ == "__main__":
    main()
