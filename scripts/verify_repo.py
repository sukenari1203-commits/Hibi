#!/usr/bin/env python3
"""Deterministic quality checks for VENTURE INFO pull requests."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TEXT_SUFFIXES = {
    ".css", ".html", ".js", ".json", ".md", ".mjs", ".sql",
    ".txt", ".yaml", ".yml",
}

SECRET_PATTERNS = {
    "OpenAI API key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
    "Supabase secret key": re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}"),
    "GitHub token": re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}"),
    "AWS access key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}

SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)
TYPE_RE = re.compile(r"\btype\s*=\s*['\"]([^'\"]+)['\"]", re.I)


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [Path(name) for name in result.stdout.split("\0") if name]


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return None
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return None


def scan_secrets(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in paths:
        text = read_text(path)
        if text is None:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                errors.append(f"{path}: possible {label}")
    return errors


def node_check(source: str, label: str, module: bool = False) -> list[str]:
    suffix = ".mjs" if module else ".js"
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=suffix, encoding="utf-8", delete=False
        ) as handle:
            handle.write(source)
            temp_path = Path(handle.name)

        result = subprocess.run(
            ["node", "--check", str(temp_path)],
            capture_output=True,
            text=True,
        )
        if result.returncode:
            detail = (result.stderr or result.stdout).strip()
            return [f"{label}: JavaScript syntax error\n{detail}"]
        return []
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def check_html(path: Path, text: str) -> list[str]:
    errors: list[str] = []
    lowered = text.lower()

    if "<!doctype html" not in lowered:
        errors.append(f"{path}: missing HTML doctype")
    if "<html" not in lowered or "</html>" not in lowered:
        errors.append(f"{path}: incomplete <html> document")

    for index, match in enumerate(SCRIPT_RE.finditer(text), start=1):
        attrs = match.group("attrs")
        if re.search(r"\bsrc\s*=", attrs, re.I):
            continue

        type_match = TYPE_RE.search(attrs)
        script_type = type_match.group(1).lower() if type_match else ""
        if script_type in {"application/json", "application/ld+json", "importmap"}:
            continue

        body = match.group("body").strip()
        if body:
            errors.extend(
                node_check(
                    body,
                    f"{path} inline script #{index}",
                    module=script_type == "module",
                )
            )

    return errors


def check_changed(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in paths:
        if not path.is_file():
            continue

        text = read_text(path)
        if text is None:
            continue

        suffix = path.suffix.lower()
        if suffix in {".js", ".mjs"}:
            errors.extend(node_check(text, str(path), module=suffix == ".mjs"))
        elif suffix == ".html":
            errors.extend(check_html(path, text))

        if path.stat().st_size > 500_000:
            print(f"WARNING: {path} exceeds 500 KB; consider modularizing it.")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--changed-files", type=Path, required=True)
    args = parser.parse_args()

    changed = [
        Path(line.strip())
        for line in args.changed_files.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    tracked = tracked_files()

    errors = scan_secrets(tracked)
    errors.extend(check_changed(changed))

    if errors:
        print("QUALITY GATE FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Quality gate passed. Checked {len(changed)} changed file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
