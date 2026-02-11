#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from urllib.parse import urlparse

try:
    import tldextract  # type: ignore
    _EXTRACTOR = tldextract.TLDExtract(suffix_list_urls=None)
except Exception:
    _EXTRACTOR = None


def _hostname(url: str) -> str | None:
    try:
        h = urlparse(url).hostname
        return h.lower() if h else None
    except Exception:
        return None


def etld1(host_or_url: str) -> str | None:
    h = host_or_url
    if "://" in host_or_url:
        h = _hostname(host_or_url) or ""
    if not h:
        return None
    h = h.lower()

    if _EXTRACTOR is not None:
        ext = _EXTRACTOR(h)
        if ext.domain and ext.suffix:
            return f"{ext.domain}.{ext.suffix}".lower()
        return h

    parts = [p for p in h.split(".") if p]
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return h


def _parse_eno(text: str) -> tuple[dict[str, str], dict[str, list[str]]]:
    data: dict[str, str] = {}
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("---"):
            section = line[3:].strip()
            if current == section:
                current = None
            else:
                current = section
                sections.setdefault(section, [])
            continue
        if current:
            sections[current].append(line)
            continue
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data, sections


def _read_eno(path: Path) -> tuple[dict[str, str], dict[str, list[str]]]:
    return _parse_eno(path.read_text(encoding="utf-8"))


def _slug_from_path(path: Path) -> str:
    return path.stem


def main() -> None:
    ap = argparse.ArgumentParser(description="Build a compact Ghostery TrackerDB index for fast third-party lookups.")
    ap.add_argument("--trackerdb-dir", required=True, help="Path to a local clone of ghostery/trackerdb")
    ap.add_argument("--out", required=True, help="Output JSON path")
    args = ap.parse_args()

    root = Path(args.trackerdb_dir)
    categories_dir = root / "db" / "categories"
    organizations_dir = root / "db" / "organizations"
    patterns_dir = root / "db" / "patterns"

    if not categories_dir.exists() or not organizations_dir.exists() or not patterns_dir.exists():
        raise SystemExit("Expected db/categories, db/organizations, db/patterns. Did you clone ghostery/trackerdb?")

    # 1) Categories: slug -> display name
    category_names: dict[str, str] = {}
    for p in categories_dir.rglob("*.eno"):
        data, _ = _read_eno(p)
        name = data.get("name") or _slug_from_path(p)
        category_names[_slug_from_path(p)] = name

    # 2) Organizations: slug -> metadata
    orgs: dict[str, dict[str, Any]] = {}
    for p in organizations_dir.rglob("*.eno"):
        data, _ = _read_eno(p)
        slug = _slug_from_path(p)
        orgs[slug] = {
            "name": data.get("name") or slug,
            "privacy_policy_url": data.get("privacy_policy_url") or data.get("privacyPolicyUrl"),
            "source_file": str(p.relative_to(root)),
        }

    # 3) Patterns: domains -> metadata
    out: dict[str, dict[str, Any]] = {}
    for p in patterns_dir.rglob("*.eno"):
        data, sections = _read_eno(p)
        org_slug = data.get("organization")
        org = orgs.get(org_slug, {})
        entity = org.get("name") or data.get("name") or _slug_from_path(p)
        policy_url = org.get("privacy_policy_url")
        cat_slug = data.get("category")
        category = category_names.get(cat_slug, cat_slug) if cat_slug else None
        domains = sections.get("domains", [])

        for domain in domains:
            dom = domain.strip().lower()
            if not dom:
                continue
            if dom.startswith("*."):
                dom = dom[2:]
            dom_etld1 = etld1(dom) or dom
            rec = out.setdefault(dom_etld1, {
                "entity": None,
                "categories": [],
                "prevalence": None,
                "policy_url": None,
                "source_pattern_file": None,
                "source_org_file": None,
            })
            if category and category not in rec["categories"]:
                rec["categories"].append(category)
            if not rec["entity"] and entity:
                rec["entity"] = entity
            if not rec["policy_url"] and policy_url:
                rec["policy_url"] = policy_url
            if not rec["source_pattern_file"]:
                rec["source_pattern_file"] = str(p.relative_to(root))
            if not rec["source_org_file"] and org.get("source_file"):
                rec["source_org_file"] = org["source_file"]

    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(out):,} domain entries to {args.out}")


if __name__ == "__main__":
    main()
