#!/usr/bin/env python3
"""hive_verify.py — independent verification gate for HERMES-HIVE milestones.

The swarm's own loop (hive-mind.py) marks a milestone "done" only after its
verify_cmds pass once. That is still a self-report: the milestone author wrote
the verify_cmds, and `hive-mind --advance-done` can stamp "done" with zero
evidence. This gate closes that gap by INDEPENDENTLY re-running each done
milestone's verify_cmds at render time and stamping a verdict the human can
see in the vault.

Verdicts (written to .hive/verification.json, read by hive_status_sync.py):
  verified   — status done AND fresh verify_cmds pass AND >=1 evidence.passed
  unverified — status done but fresh verify_cmds fail (regression?) OR no
               passed evidence recorded (e.g. manual --advance-done bypass)
  n/a        — not marked done; nothing claimed yet

Render-only: this script NEVER mutates milestones.json and never flips a
milestone's status. It only writes its own derived verdict file (additive,
machine-truth) so the human — not this script — decides what to do about an
unverified "done".

Cron contract (no_agent): silent on success; --verbose prints verdicts.
Exit 0 unless the script itself crashes (a verdict never fails the cron).
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

HIVE_ROOT = Path(os.environ.get(
    "HERMES_HIVE_REPO",
    os.environ.get("HIVE_MIND_ROOT", r"C:\Users\jonny\HERMES-HIVE"),
))
STATE_FILE = HIVE_ROOT / ".hive" / "milestones.json"
OUT_FILE = HIVE_ROOT / ".hive" / "verification.json"

CMD_TIMEOUT = 180  # matches hive-mind.run_verify


def load_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path, data):
    tmp = Path(str(path) + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(str(tmp), str(path))


def run_cmds(verify_cmds):
    """Run acceptance commands independently. Same safe semantics as
    hive-mind.run_verify: verify_cmds live in .hive/milestones.json, which is
    gitignored, human-controlled, and outside the agent merge path — agent
    output never reaches these strings, so shell=True is deliberate here."""
    results, ok = [], True
    for cmd in verify_cmds:
        try:
            r = subprocess.run(cmd, shell=True, cwd=str(HIVE_ROOT),
                               capture_output=True, text=True, timeout=CMD_TIMEOUT)
            exit_code = r.returncode
            tail = (r.stdout or r.stderr or "")[-300:]
        except subprocess.TimeoutExpired:
            exit_code, tail = "timeout", ""
        results.append({"cmd": cmd, "exit": exit_code, "tail": tail})
        if exit_code != 0:
            ok = False
    detail = " | ".join(
        f"{r['cmd'].split()[0]} {'OK' if r['exit'] == 0 else r['exit']}"
        for r in results)
    return ok, results, detail


def has_passed_evidence(m):
    for e in m.get("evidence", []):
        if isinstance(e, dict) and e.get("passed") is True:
            return True
    return False


def verify_milestone(mid, m):
    status = m.get("status")
    if status != "done":
        return {"status": status, "verdict": "n/a",
                "reason": "not marked done", "verify_ran": False}
    verify_cmds = m.get("verify_cmds", [])
    if not verify_cmds:
        return {"status": status, "verdict": "unverified",
                "reason": "no verify_cmds defined", "verify_ran": False}
    ok, results, detail = run_cmds(verify_cmds)
    ev = has_passed_evidence(m)
    if ok and ev:
        verdict, reason = "verified", "verify_cmds pass + evidence recorded"
    elif ok and not ev:
        verdict, reason = "unverified", "verify_cmds pass now but no passed evidence recorded"
    elif not ok and ev:
        verdict, reason = "unverified", "verify_cmds FAIL now (regression?) despite prior evidence"
    else:
        verdict, reason = "unverified", "verify_cmds FAIL now and no passed evidence (manual --advance-done?)"
    return {
        "status": status,
        "verdict": verdict,
        "reason": reason,
        "verify_ran": True,
        "verify_passed": ok,
        "evidence_passed": ev,
        "detail": detail,
    }


def main():
    ap = argparse.ArgumentParser(description="Independent milestone verification gate")
    ap.add_argument("--verbose", action="store_true", help="print verdicts to stdout")
    args = ap.parse_args()

    state = load_json(STATE_FILE, {})
    milestones = state.get("milestones", {}) or {}
    out = {
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "source": "hive_verify.py",
        "milestones": {},
    }
    for mid, m in sorted(milestones.items()):
        out["milestones"][mid] = verify_milestone(mid, m)
        if args.verbose:
            v = out["milestones"][mid]
            print(f"{mid:>4}  {v['status']:<8} {v['verdict']:<11} {v['reason']}")

    save_json(OUT_FILE, out)
    if args.verbose:
        print(f"wrote {OUT_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
