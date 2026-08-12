#!/usr/bin/env python3
"""E2E regression harness for the Level 2 intent bridge (hive_intent_watch.py).

Runs the REAL watch script (via subprocess + env overrides) against a scratch
vault+repo and walks the full lifecycle, asserting every transition:

  silent(empty) → queued (+ direct-done for pre-checked) → idempotent rerun
  → running (human plan fingerprint match) → needs_review (plan expired)
  → running again (re-plan) → done (checked) / dropped (removed)

Also asserts the CHECKBOX-PRESERVATION export contract in hive_status_sync.py
and the fingerprint parity invariant between hive-mind.py (live scripts dir)
and hive_intent_watch.py (repo) — break either and this file fails loudly.

Usage:
  python hive-core/test_intent_bridge.py          # full E2E + parity + export
  python hive-core/test_intent_bridge.py --parity # parity check only (fast)

Exits 0 on pass, 1 on failure. Never touches the real vault or .hive/.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(r"C:\Users\jonny\HERMES-HIVE")
WATCH = REPO / "hive-core" / "hive_intent_watch.py"
SYNC = REPO / "hive-core" / "hive_status_sync.py"

FP = lambda t: hashlib.sha1(t.strip().lower().encode("utf-8")).hexdigest()[:12]


def run(script, env_extra, *args):
    env = dict(os.environ)
    env["OBSIDIAN_VAULT_PATH"] = str(env_extra["vault"])
    env["HERMES_HIVE_REPO"] = str(env_extra["repo"])
    return subprocess.run(
        [sys.executable, str(script), *args], capture_output=True, text=True, env=env
    )


def write_gtd(vault, tasks):
    room = Path(vault) / "Projects" / "HERMES-HIVE"
    room.mkdir(parents=True, exist_ok=True)
    lines = ["Human Queue:", '\tAdd swarm tasks here, one per line, starting with "- "', ""]
    lines += tasks  # fixtures already carry the "- " prefix
    lines += ["", "Swarm Plan:", ""]
    (room / "Backlog.gtd").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_plan(repo, engine, cycle, ttl, fps):
    hive = Path(repo) / ".hive"
    hive.mkdir(parents=True, exist_ok=True)
    plan = {
        "engine_version": engine, "milestone": "TEST", "name": "TEST plan",
        "cycle": cycle, "valid_for_cycles": ttl, "repo": "hermes-hive",
        "generated_at": "2026-01-01T00:00:00", "slots": {},
        "intent_fingerprints": fps,
    }
    (hive / "milestone_plan.json").write_text(json.dumps(plan), encoding="utf-8")
    (hive / "swarm_cycle_counter").write_text(str(cycle), encoding="utf-8")


def state_of(repo):
    p = Path(repo) / ".hive" / "intents.json"
    if not p.exists():
        return {}
    return {fp: r["status"] for fp, r in json.loads(p.read_text(encoding="utf-8"))["tasks"].items()}


def check(tag, cond, detail=""):
    print(f"   {'✓' if cond else '✗'} {tag}" + (f" — {detail}" if detail else ""))
    if not cond:
        raise AssertionError(f"{tag}: {detail}")


def e2e():
    tmp = Path(tempfile.mkdtemp(prefix="hive-intent-e2e-"))
    vault, repo = tmp / "vault", tmp / "repo"
    (repo / ".hive").mkdir(parents=True)
    env = {"vault": vault, "repo": repo}
    try:
        r = run(WATCH, env, "--verbose")
        check("missing gtd → bail-safe, no state",
              r.returncode == 0 and "unreadable" in r.stdout
              and not (repo / ".hive" / "intents.json").exists(), r.stdout.strip())

        write_gtd(vault, [])
        r = run(WATCH, env, "--verbose")
        check("empty gtd → silent", r.returncode == 0 and "no change" in r.stdout, r.stdout.strip())

        write_gtd(vault, ["- [ ] Test intent alpha: build a rocket",
                          "- [ ] Test intent beta: paint the shed",
                          "- [x] Test intent gamma: already done"])
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("seed → queued + direct-done",
              s.get(FP("Test intent alpha: build a rocket")) == "queued"
              and s.get(FP("Test intent gamma: already done")) == "done", str(s))
        check("Intent.md rendered",
              (vault / "Projects" / "HERMES-HIVE" / "Intent.md").exists())

        r = run(WATCH, env, "--verbose")
        check("idempotent rerun → silent", "no change" in r.stdout, r.stdout.strip())

        write_plan(repo, "human-directive", 0, 2, [FP("Test intent alpha: build a rocket"),
                                                   FP("Test intent beta: paint the shed")])
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("fingerprint match → running",
              s.get(FP("Test intent alpha: build a rocket")) == "running"
              and s.get(FP("Test intent beta: paint the shed")) == "running", str(s))

        (repo / ".hive" / "swarm_cycle_counter").write_text("3", encoding="utf-8")  # TTL 2 → expired
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("plan expired → needs_review", s.get(FP("Test intent alpha: build a rocket")) == "needs_review", str(s))

        write_plan(repo, "human-directive", 5, 2, [FP("Test intent alpha: build a rocket"),
                                                   FP("Test intent beta: paint the shed")])
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("re-plan → running again", s.get(FP("Test intent beta: paint the shed")) == "running", str(s))

        write_gtd(vault, ["- [x] Test intent alpha: build a rocket",
                          "- [ ] Test intent beta: paint the shed"])
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("checked while covered → done, covered task stays running",
              s.get(FP("Test intent alpha: build a rocket")) == "done"
              and s.get(FP("Test intent beta: paint the shed")) == "running", str(s))

        write_gtd(vault, ["- [x] Test intent alpha: build a rocket"])
        r = run(WATCH, env, "--verbose")
        s = state_of(repo)
        check("removed from queue → dropped",
              s.get(FP("Test intent beta: paint the shed")) == "dropped", str(s))

        r = run(WATCH, env, "--verbose")
        check("final rerun → silent", "no change" in r.stdout, r.stdout.strip())
        print("   E2E lifecycle: PASS")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def parity():
    import importlib.util
    spec = importlib.util.spec_from_file_location("hive_mind", Path(
        r"C:\Users\jonny\AppData\Local\hermes\profiles\hermes-dev1\scripts\hive-mind.py"))
    hm = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(hm)
    import sys as _s
    _s.path.insert(0, str(REPO / "hive-core"))
    import hive_intent_watch as w
    for t in ["Fix the login bug", "  Ship  the   dashboard  ", "UPPER CASE Test"]:
        check(f"fp parity '{t.strip()}'", hm.intent_fp(t) == w.intent_fp(t),
              f"{hm.intent_fp(t)} vs {w.intent_fp(t)}")
    plan = hm.build_plan_for_directives(["Fix the login bug", "Ship the dashboard"], cycle=99)
    check("plan stamps fingerprints", len(plan["intent_fingerprints"]) == 2
          and plan["intent_fingerprints"][0] == hm.intent_fp("Fix the login bug"))
    print("   fingerprint parity: PASS")


def export_contract():
    tmp = Path(tempfile.mkdtemp(prefix="hive-intent-exp-"))
    vault, repo = tmp / "vault", tmp / "repo"
    (repo / "docs").mkdir(parents=True)
    env = {"vault": vault, "repo": repo}
    try:
        write_gtd(vault, ["- [ ] Task one: open", "- [x] Task two: finished"])
        import importlib.util
        saved = {k: os.environ.get(k) for k in ("OBSIDIAN_VAULT_PATH", "HERMES_HIVE_REPO")}
        try:
            os.environ["OBSIDIAN_VAULT_PATH"] = str(vault)
            os.environ["HERMES_HIVE_REPO"] = str(repo)
            spec = importlib.util.spec_from_file_location("sync", SYNC)
            sync = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(sync)  # module reads env at import for VAULT/REPO
        finally:
            for k, v in saved.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
        sync.export_human_queue()
        body = (repo / "docs" / "human-queue.md").read_text(encoding="utf-8")
        check("export preserves [x]", "- [ ] Task one: open" in body and "- [x] Task two: finished" in body)
        tasks = sync.read_gtd_tasks()
        check("read-back canonical", tasks == [("Task one: open", False), ("Task two: finished", True)], str(tasks))
        print("   export checkbox contract: PASS")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--parity", action="store_true", help="parity check only")
    args = ap.parse_args()
    print("hive_intent_bridge tests")
    print("[1] fingerprint parity (watch ↔ hive-mind)")
    parity()
    if not args.parity:
        print("[2] export checkbox contract (sync)")
        export_contract()
        print("[3] E2E lifecycle (watch against scratch vault+repo)")
        e2e()
    print("\nALL INTENT-BRIDGE TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
