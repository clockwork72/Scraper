from __future__ import annotations

from typing import Any

from bs4 import BeautifulSoup

from .utils.logging import warn

try:
    import trafilatura  # type: ignore
except Exception:
    trafilatura = None


def _bs4_extract(html: str) -> str | None:
    try:
        soup = BeautifulSoup(html, "lxml")
        text = "\n".join([ln.strip() for ln in soup.get_text("\n").splitlines() if ln.strip()])
        return text or None
    except Exception:
        return None


def extract_main_text_from_html(
    html: str | None,
    *,
    source_url: str | None = None,
) -> str | None:
    """Extract main document text from HTML, preferring Trafilatura."""
    if not html:
        return None

    if trafilatura is not None:
        # Prefer markdown to keep headings/lists for downstream section parsing.
        try:
            text = trafilatura.extract(
                html,
                url=source_url,
                output_format="markdown",
                include_links=False,
                include_images=False,
                include_tables=True,
                deduplicate=True,
                favor_precision=True,
            )
            if isinstance(text, str) and text.strip():
                return text.strip()
        except TypeError:
            # Keep compatibility with older trafilatura signatures.
            try:
                text = trafilatura.extract(html)
                if isinstance(text, str) and text.strip():
                    return text.strip()
            except Exception as e:
                warn(f"Trafilatura extraction failed: {e}")
        except Exception as e:
            warn(f"Trafilatura extraction failed: {e}")

    return _bs4_extract(html)
