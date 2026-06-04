from __future__ import annotations

import json
from pathlib import Path

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe
from django.templatetags.static import static

register = template.Library()


@register.simple_tag
def vite_client() -> str:
    if getattr(settings, "VITE_DEV_MODE", False):
        base_url = getattr(settings, "VITE_DEV_SERVER_URL", "http://localhost:5173/")
        # El preamble de @react-refresh DEBE ejecutarse antes de cualquier
        # módulo de React, de lo contrario @vitejs/plugin-react lanza
        # "can't detect preamble".
        return mark_safe(
            f'<script type="module">'
            f'import RefreshRuntime from "{base_url}@react-refresh";'
            f'RefreshRuntime.injectIntoGlobalHook(window);'
            f'window.$RefreshReg$ = () => {{}};'
            f'window.$RefreshSig$ = () => (type) => type;'
            f'window.__vite_plugin_react_preamble_installed__ = true;'
            f'</script>'
            f'<script type="module" src="{base_url}@vite/client"></script>'
        )
    return ""


def _load_manifest() -> dict:
    manifest_path = Path(settings.BASE_DIR) / "static" / "frontend" / "manifest.json"
    if not manifest_path.exists():
        return {}
    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _get_manifest_entry(manifest: dict, entrypoint: str) -> dict:
    entry = manifest.get(entrypoint)
    if entry:
        return entry

    for value in manifest.values():
        if isinstance(value, dict) and value.get("src") == entrypoint:
            return value

    return {}


def _collect_css_files(manifest: dict, entry: dict) -> list[str]:
    seen_css: set[str] = set()
    seen_chunks: set[str] = set()
    css_files: list[str] = []

    def walk(chunk: dict):
        for css in chunk.get("css") or []:
            if css in seen_css:
                continue
            seen_css.add(css)
            css_files.append(css)

        for import_key in chunk.get("imports") or []:
            if import_key in seen_chunks:
                continue
            seen_chunks.add(import_key)
            imported_chunk = manifest.get(import_key)
            if isinstance(imported_chunk, dict):
                walk(imported_chunk)

    walk(entry)
    return css_files


@register.simple_tag
def react_asset(entrypoint: str) -> str:
    if getattr(settings, "VITE_DEV_MODE", False):
        base_url = getattr(settings, "VITE_DEV_SERVER_URL", "http://localhost:5173/")
        return f"{base_url}{entrypoint}"

    manifest = _load_manifest()
    entry = _get_manifest_entry(manifest, entrypoint)
    asset_file = entry.get("file")
    if not asset_file:
        return ""
    return static(f"frontend/{asset_file}")


@register.simple_tag
def react_css_assets(entrypoint: str):
    if getattr(settings, "VITE_DEV_MODE", False):
        return []

    manifest = _load_manifest()
    entry = _get_manifest_entry(manifest, entrypoint)
    css_files = _collect_css_files(manifest, entry)
    return [static(f"frontend/{css_path}") for css_path in css_files]
