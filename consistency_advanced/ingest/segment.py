"""Policy ingestion + segmentation placeholders."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional

import re


@dataclass(frozen=True)
class PolicyChunk:
    policy_id: str
    party_type: str  # "1P" or "3P"
    section_path: str
    char_start: int
    char_end: int
    chunk_hash: str
    text: str


@dataclass(frozen=True)
class PolicyDocument:
    policy_id: str
    party_type: str
    raw_text: str


@dataclass(frozen=True)
class Section:
    section_id: str
    title: str
    level: int
    section_path: str
    start_offset: int
    end_offset: int


def load_policy(source_path: str) -> PolicyDocument:
    """Load a policy file (PDF/HTML/TXT). Placeholder."""
    raise NotImplementedError("Implement PDF/HTML/TXT ingestion here.")


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
_BULLET_RE = re.compile(r"^\s*(?:[-*•]|\d+\.)\s+(.+?)\s*$")
_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")


def _normalize_heading(text: str) -> str:
    text = _LINK_RE.sub(lambda m: m.group(1), text)
    return re.sub(r"\s+", " ", text).strip()


def _is_title_like(text: str) -> bool:
    if len(text) > 90:
        return False
    words = [w for w in re.split(r"\s+", text) if w]
    if not words:
        return False
    caps = sum(1 for w in words if w[:1].isupper())
    return caps / len(words) >= 0.6


def _is_fallback_heading(text: str, prev_blank: bool, next_blank: bool) -> bool:
    if not (prev_blank and next_blank):
        return False
    if text.endswith((".", ";")):
        return False
    return _is_title_like(text) or text.endswith("?") or text.endswith(":")


def _extract_toc_titles(lines: List[str]) -> list[str]:
    titles: list[str] = []
    toc_mode = False
    toc_window = 0
    for idx, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            if toc_mode:
                toc_window += 1
            if toc_window >= 6:
                toc_mode = False
            continue
        low = line.lower()
        if "table of contents" in low or (low == "contents" and idx < 30):
            toc_mode = True
            toc_window = 0
            continue
        if toc_mode:
            match = _BULLET_RE.match(line)
            if not match:
                toc_window += 1
                if toc_window >= 6:
                    toc_mode = False
                continue
            title = _normalize_heading(match.group(1))
            if title:
                titles.append(title)
    return titles


def build_section_tree(text: str) -> List[Section]:
    """Parse headings/sections to build a section tree."""
    if not text:
        return [Section("section_1", "Document", 1, "Document", 0, 0)]

    lines = text.splitlines()
    toc_titles = {t.lower() for t in _extract_toc_titles(lines)}

    sections: list[Section] = []
    stack: list[Section] = []
    cursor = 0

    def close_sections(end_offset: int) -> None:
        for idx in range(len(stack)):
            sec = stack[idx]
            if sec.end_offset == -1:
                stack[idx] = Section(
                    sec.section_id,
                    sec.title,
                    sec.level,
                    sec.section_path,
                    sec.start_offset,
                    end_offset,
                )

    for idx, raw in enumerate(lines):
        line = raw.rstrip("\n")
        stripped = line.strip()
        line_start = cursor
        line_end = cursor + len(line)
        cursor += len(raw) + 1
        if not stripped:
            continue

        heading_level: Optional[int] = None
        heading_text: Optional[str] = None

        m = _HEADING_RE.match(stripped)
        if m:
            heading_level = len(m.group(1))
            heading_text = _normalize_heading(m.group(2))
        else:
            prev_blank = idx == 0 or not lines[idx - 1].strip()
            next_blank = idx == len(lines) - 1 or not lines[idx + 1].strip()
            candidate = _normalize_heading(stripped)
            if candidate.lower() in toc_titles:
                heading_level = 2
                heading_text = candidate
            elif _is_fallback_heading(candidate, prev_blank, next_blank):
                heading_level = 2
                heading_text = candidate

        if heading_level is None or not heading_text:
            continue

        # Close sections deeper or equal to this level.
        while stack and stack[-1].level >= heading_level:
            stack.pop()
        if stack:
            close_sections(line_start)

        section_id = f"section_{len(sections) + 1}"
        path_parts = [s.title for s in stack] + [heading_text]
        section_path = " > ".join(path_parts)
        section = Section(
            section_id=section_id,
            title=heading_text,
            level=heading_level,
            section_path=section_path,
            start_offset=line_start,
            end_offset=-1,
        )
        sections.append(section)
        stack.append(section)

    if sections:
        end_offset = len(text)
        for idx, sec in enumerate(sections):
            if sec.end_offset == -1:
                sections[idx] = Section(
                    sec.section_id,
                    sec.title,
                    sec.level,
                    sec.section_path,
                    sec.start_offset,
                    end_offset,
                )
    else:
        sections.append(Section("section_1", "Document", 1, "Document", 0, len(text)))

    return sections


def chunk_policy(policy: PolicyDocument) -> Iterable[PolicyChunk]:
    """Chunk a policy by section with overlap. Placeholder."""
    raise NotImplementedError("Implement section-first chunking with provenance.")
