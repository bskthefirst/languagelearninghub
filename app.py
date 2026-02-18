#!/usr/bin/env python3
import html
import hashlib
import json
import os
import re
import sqlite3
import ssl
import threading
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
STATE_DB_FILE = DATA_DIR / "hub_state.db"
LEGACY_STATE_FILE = DATA_DIR / "hub_state.json"
STATE_ROW_KEY = "hub_state_v2"
DEFAULT_PORT = 8000

NAVER_ENDPOINTS_BY_LANG = {
    "ja": [
        "https://ja.dict.naver.com/api3/jako/search",
        "https://dict.naver.com/api3/jako/search",
        "https://jpdict.naver.com/api3/jako/search",
    ],
    "en": [
        "https://en.dict.naver.com/api3/enko/search",
        "https://dict.naver.com/api3/enko/search",
        "https://endic.naver.com/api3/enko/search",
    ],
}

NAVER_REFERER_BY_LANG = {
    "ja": "https://ja.dict.naver.com/",
    "en": "https://en.dict.naver.com/",
}

RE_TAGS = re.compile(r"<[^>]+>")
RE_HTML_TAG = re.compile(r"<\s*(/?)\s*([a-zA-Z0-9]+)(?:\s+[^>]*)?>")
RE_JAPANESE = re.compile(r"[\u3040-\u30ff\u3400-\u9fff]")
RE_KANA = re.compile(r"[\u3040-\u30ff]")
RE_KOREAN = re.compile(r"[\uac00-\ud7a3]")
RE_ENGLISH = re.compile(r"[A-Za-z]")
ALLOWED_EXAMPLE_TAGS = {"ruby", "rb", "rt", "rp", "br"}
STATE_LOCK = threading.Lock()

try:
    import certifi

    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except Exception:
    SSL_CONTEXT = ssl.create_default_context()


def clean_text(value: str) -> str:
    text = html.unescape(value or "")
    text = RE_TAGS.sub("", text)
    text = text.replace("\u200b", "")
    return " ".join(text.split())


def clean_ruby_text(value: str) -> str:
    text = html.unescape(value or "")
    text = re.sub(r"<rt[^>]*>.*?</rt>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"</?(ruby|rb|rp)[^>]*>", "", text, flags=re.IGNORECASE)
    return clean_text(text)


def sanitize_ruby_html(value: str) -> str:
    text = html.unescape(value or "").replace("\u200b", "")

    def repl(match: re.Match[str]) -> str:
        slash = "/" if match.group(1) else ""
        tag = (match.group(2) or "").lower()
        if tag not in ALLOWED_EXAMPLE_TAGS:
            return ""
        if tag == "br":
            return "<br>"
        return f"<{slash}{tag}>"

    sanitized = RE_HTML_TAG.sub(repl, text)
    return sanitized.strip()


def detect_query_language(query: str) -> str:
    if RE_JAPANESE.search(query or ""):
        return "ja"
    if RE_ENGLISH.search(query or ""):
        return "en"
    return "ja"


def build_naver_headers(language: str) -> dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        ),
        "Referer": NAVER_REFERER_BY_LANG.get(language, NAVER_REFERER_BY_LANG["ja"]),
        "Accept": "application/json,text/plain,*/*",
    }


def extract_english_pronunciation(item: dict[str, Any]) -> str:
    symbols = item.get("searchPhoneticSymbolList")
    parts: list[str] = []

    if isinstance(symbols, list):
        for symbol in symbols:
            if not isinstance(symbol, dict):
                continue
            symbol_value = clean_text(str(symbol.get("symbolValue") or ""))
            symbol_type = clean_text(str(symbol.get("symbolType") or ""))
            if not symbol_value:
                continue
            if symbol_type:
                parts.append(f"{symbol_type} {symbol_value}")
            else:
                parts.append(symbol_value)
            if len(parts) >= 2:
                break

    if parts:
        return " | ".join(parts)

    fallback = clean_text(
        str(
            item.get("phoneticSymbol")
            or item.get("expAudioRead")
            or item.get("expMeaningRead")
            or ""
        )
    )
    return fallback


def extract_corrected_query(payload: dict[str, Any], original_query: str) -> str:
    original = clean_text(original_query or "")
    original_l = original.casefold()
    candidates = collect_query_candidates(payload, original_query)

    for candidate in candidates:
        if candidate.casefold() != original_l:
            return candidate
    return ""


def collect_query_candidates(payload: Any, original_query: str) -> list[str]:
    original = clean_text(original_query or "")
    original_l = original.casefold()
    candidates: list[str] = []
    seen: set[str] = set()

    def normalize_candidate_text(value: Any) -> str:
        text = clean_text(str(value or ""))
        if not text:
            return ""
        # Some payload branches expose a serialized query string.
        if "=" in text and ("&" in text or text.lower().startswith("query=")):
            parsed = urllib.parse.parse_qs(text)
            query_vals = parsed.get("query") or []
            if query_vals:
                text = clean_text(urllib.parse.unquote_plus(query_vals[0]))
        return text

    def maybe_add(value: Any):
        text = normalize_candidate_text(value)
        if not text:
            return
        key = text.casefold()
        if key == original_l or key in seen:
            return
        if len(text) > 80:
            return
        seen.add(key)
        candidates.append(text)

    search_map = payload.get("searchResultMap", {}) if isinstance(payload, dict) else {}
    if isinstance(search_map, dict):
        list_map = search_map.get("searchResultListMap", {})
        if isinstance(list_map, dict):
            for section in list_map.values():
                if not isinstance(section, dict):
                    continue
                for key in (
                    "query",
                    "queryRevert",
                    "revert",
                    "forceQuery",
                    "spellQuery",
                    "spellCheckedQuery",
                    "correctedQuery",
                    "suggestQuery",
                ):
                    maybe_add(section.get(key))

    hint_keys = ("query", "suggest", "correct", "spell", "revert", "recommend")

    def walk(node: Any, key_hint: str = ""):
        if isinstance(node, dict):
            for key, value in node.items():
                lower_key = str(key).lower()
                if isinstance(value, (dict, list)):
                    walk(value, lower_key)
                elif any(h in lower_key for h in hint_keys):
                    maybe_add(value)
            return
        if isinstance(node, list):
            for item in node:
                walk(item, key_hint)

    walk(payload)
    return candidates[:8]


def normalize_items_from_payload(
    payload: dict[str, Any], language: str, seen: set[tuple[str, str, str, str]]
) -> tuple[list[dict[str, str]], int]:
    items = extract_direct_items(payload)
    if not items:
        items = extract_generic_items(payload, language)

    normalized: list[dict[str, str]] = []
    for item in items:
        row = normalize_entry(item, language)
        if not row:
            continue
        if language == "ja":
            if not (RE_JAPANESE.search(row["word"]) or RE_JAPANESE.search(row["furigana"])):
                continue
        else:
            if not RE_ENGLISH.search(row["word"]):
                continue
        key = (row["word"], row["furigana"], row["meaning"], row["example"])
        if key in seen:
            continue
        seen.add(key)
        normalized.append(row)
        if len(normalized) >= 10:
            break
    return normalized, len(items)


def sanitize_word_entry(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    word = clean_text(str(raw.get("word") or ""))
    furigana = clean_text(str(raw.get("furigana") or ""))
    meaning = clean_text(str(raw.get("meaning") or ""))
    example = clean_text(str(raw.get("example") or ""))
    example_ruby = sanitize_ruby_html(str(raw.get("exampleRuby") or ""))
    if "<rt>" not in example_ruby.lower():
        example_ruby = ""
    example_translation = clean_text(str(raw.get("exampleTranslation") or ""))
    source_url = clean_text(str(raw.get("sourceUrl") or ""))
    audio_url = clean_text(str(raw.get("audioUrl") or ""))
    example_pinned = bool(raw.get("examplePinned"))
    bad_examples_raw = raw.get("badExamples")
    bad_examples: list[str] = []
    if isinstance(bad_examples_raw, list):
        for value in bad_examples_raw:
            text = clean_text(str(value or ""))
            if text:
                bad_examples.append(text)
            if len(bad_examples) >= 20:
                break

    if not word:
        return None

    return {
        "word": word,
        "furigana": furigana,
        "meaning": meaning,
        "example": example,
        "exampleRuby": example_ruby,
        "exampleTranslation": example_translation,
        "sourceUrl": source_url,
        "audioUrl": audio_url,
        "examplePinned": example_pinned,
        "badExamples": bad_examples,
    }


def sanitize_history_entry(raw: Any) -> dict[str, str] | None:
    if isinstance(raw, str):
        query = clean_text(raw)
        if not query:
            return None
        digest = hashlib.sha1(query.encode("utf-8")).hexdigest()[:12]
        return {"id": f"h_{digest}", "query": query, "createdAt": ""}

    if not isinstance(raw, dict):
        return None

    # Migration path for old history schema where entries were word cards.
    query = clean_text(str(raw.get("query") or raw.get("word") or ""))
    if not query:
        return None

    entry_id = clean_text(str(raw.get("id") or ""))
    created_at = clean_text(str(raw.get("createdAt") or ""))
    if not entry_id:
        digest = hashlib.sha1(f"{query}|{created_at}".encode("utf-8")).hexdigest()[:12]
        entry_id = f"h_{digest}"
    return {"id": entry_id, "query": query, "createdAt": created_at}


def sanitize_user_name(raw: Any) -> str:
    name = clean_text(str(raw or "")).strip()
    if not name:
        return ""
    # Keep usernames simple and UI-friendly.
    if len(name) > 24:
        name = name[:24].strip()
    return name


def sanitize_state(payload: Any) -> dict[str, Any]:
    default = {"lists": [], "history": []}
    if not isinstance(payload, dict):
        return default

    cleaned_lists: list[dict[str, Any]] = []
    for row in payload.get("lists", []):
        if not isinstance(row, dict):
            continue
        list_id = clean_text(str(row.get("id") or ""))
        list_name = clean_text(str(row.get("name") or ""))
        if not list_id or not list_name:
            continue
        words: list[dict[str, str]] = []
        for maybe_word in row.get("words", []):
            word = sanitize_word_entry(maybe_word)
            if word:
                words.append(word)
        cleaned_lists.append({"id": list_id, "name": list_name, "words": words})
        if len(cleaned_lists) >= 200:
            break

    cleaned_history: list[dict[str, str]] = []
    for maybe_history in payload.get("history", []):
        history_entry = sanitize_history_entry(maybe_history)
        if history_entry:
            cleaned_history.append(history_entry)
        if len(cleaned_history) >= 1000:
            break

    return {"lists": cleaned_lists, "history": cleaned_history}


def _init_state_db_unlocked():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(STATE_DB_FILE) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_state (
                user_id INTEGER PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()

    # One-time migration from legacy JSON file / app_state row into user_state.
    # This keeps existing data intact after introducing usernames.
    with sqlite3.connect(STATE_DB_FILE) as conn:
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if user_count == 0:
            # Create default user.
            conn.execute("INSERT INTO users (name) VALUES (?)", ("bill",))
            conn.commit()

    with sqlite3.connect(STATE_DB_FILE) as conn:
        default_user_id = conn.execute(
            "SELECT id FROM users ORDER BY id ASC LIMIT 1"
        ).fetchone()[0]
        has_state = conn.execute(
            "SELECT 1 FROM user_state WHERE user_id = ?",
            (default_user_id,),
        ).fetchone()
        if has_state:
            return

    migrated_payload: dict[str, Any] | None = None

    if not LEGACY_STATE_FILE.exists():
        with sqlite3.connect(STATE_DB_FILE) as conn:
            row = conn.execute(
                "SELECT value FROM app_state WHERE key = ?",
                (STATE_ROW_KEY,),
            ).fetchone()
        if row:
            try:
                migrated_payload = sanitize_state(json.loads(row[0]))
            except Exception:
                migrated_payload = None
    else:
        try:
            parsed = json.loads(LEGACY_STATE_FILE.read_text(encoding="utf-8"))
            migrated_payload = sanitize_state(parsed)
        except Exception:
            migrated_payload = None

    if migrated_payload is None:
        migrated_payload = {"lists": [], "history": []}

    with sqlite3.connect(STATE_DB_FILE) as conn:
        conn.execute(
            """
            INSERT INTO user_state (user_id, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                default_user_id,
                json.dumps(migrated_payload, ensure_ascii=False, separators=(",", ":")),
            ),
        )
        conn.commit()


def init_state_db():
    with STATE_LOCK:
        _init_state_db_unlocked()


def resolve_user_id_unlocked(user_ref: str | None, default_if_missing: bool = True) -> int | None:
    with sqlite3.connect(STATE_DB_FILE) as conn:
        if user_ref:
            clean_ref = sanitize_user_name(user_ref)
            if clean_ref.isdigit():
                row = conn.execute(
                    "SELECT id FROM users WHERE id = ?",
                    (int(clean_ref),),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT id FROM users WHERE name = ? COLLATE NOCASE",
                    (clean_ref,),
                ).fetchone()
            if row:
                return int(row[0])
            return None

        if default_if_missing:
            row = conn.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1").fetchone()
            if row:
                return int(row[0])
        return None


def list_users() -> list[dict[str, Any]]:
    with STATE_LOCK:
        _init_state_db_unlocked()
        with sqlite3.connect(STATE_DB_FILE) as conn:
            rows = conn.execute(
                "SELECT id, name, created_at FROM users ORDER BY id ASC"
            ).fetchall()
    return [{"id": str(row[0]), "name": row[1], "createdAt": row[2]} for row in rows]


def create_user(name: str) -> dict[str, Any]:
    clean_name = sanitize_user_name(name)
    if not clean_name:
        raise ValueError("Please enter a username.")
    with STATE_LOCK:
        _init_state_db_unlocked()
        try:
            with sqlite3.connect(STATE_DB_FILE) as conn:
                conn.execute("INSERT INTO users (name) VALUES (?)", (clean_name,))
                user_row = conn.execute(
                    "SELECT id, name, created_at FROM users WHERE name = ? COLLATE NOCASE",
                    (clean_name,),
                ).fetchone()
                if user_row:
                    conn.execute(
                        """
                        INSERT INTO user_state (user_id, value, updated_at)
                        VALUES (?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(user_id) DO NOTHING
                        """,
                        (
                            int(user_row[0]),
                            json.dumps(
                                {"lists": [], "history": []},
                                ensure_ascii=False,
                                separators=(",", ":"),
                            ),
                        ),
                    )
                conn.commit()
        except sqlite3.IntegrityError:
            raise ValueError("That username already exists.")

    return {"id": str(user_row[0]), "name": user_row[1], "createdAt": user_row[2]}


def delete_user(user_ref: str) -> dict[str, Any]:
    clean_ref = sanitize_user_name(user_ref)
    if not clean_ref:
        raise ValueError("Unknown user.")

    with STATE_LOCK:
        _init_state_db_unlocked()
        with sqlite3.connect(STATE_DB_FILE) as conn:
            row = None
            if clean_ref.isdigit():
                row = conn.execute(
                    "SELECT id, name FROM users WHERE id = ?",
                    (int(clean_ref),),
                ).fetchone()
            if row is None:
                row = conn.execute(
                    "SELECT id, name FROM users WHERE name = ? COLLATE NOCASE",
                    (clean_ref,),
                ).fetchone()
            if row is None:
                raise ValueError("Unknown user.")

            count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if count <= 1:
                raise ValueError("At least one profile must remain.")

            conn.execute("DELETE FROM users WHERE id = ?", (int(row[0]),))
            conn.commit()
            return {"id": str(row[0]), "name": row[1]}


def load_saved_state(user_ref: str | None = None) -> dict[str, Any]:
    with STATE_LOCK:
        _init_state_db_unlocked()
        try:
            user_id = resolve_user_id_unlocked(user_ref, default_if_missing=True)
            if user_id is None:
                return {"lists": [], "history": []}
            with sqlite3.connect(STATE_DB_FILE) as conn:
                row = conn.execute(
                    "SELECT value FROM user_state WHERE user_id = ?",
                    (user_id,),
                ).fetchone()
                if row is None:
                    return {"lists": [], "history": []}
            parsed = json.loads(row[0] or "{}")
            return sanitize_state(parsed)
        except Exception:
            return {"lists": [], "history": []}


def save_state(payload: Any, user_ref: str | None = None) -> dict[str, Any]:
    normalized = sanitize_state(payload)
    with STATE_LOCK:
        _init_state_db_unlocked()
        user_id = resolve_user_id_unlocked(user_ref, default_if_missing=True)
        if user_id is None:
            return normalized
        with sqlite3.connect(STATE_DB_FILE) as conn:
            conn.execute(
                """
                INSERT INTO user_state (user_id, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    value = excluded.value,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    user_id,
                    json.dumps(normalized, ensure_ascii=False, separators=(",", ":")),
                ),
            )
            conn.commit()
    return normalized


def walk_text_fields(node: Any, parent_key: str = ""):
    if isinstance(node, str):
        yield parent_key, clean_text(node)
        return

    if isinstance(node, list):
        for item in node:
            yield from walk_text_fields(item, parent_key)
        return

    if isinstance(node, dict):
        for key, value in node.items():
            nested_key = f"{parent_key}.{key}" if parent_key else str(key)
            yield from walk_text_fields(value, nested_key)


def score_key(key: str, hints: list[str]) -> int:
    key_l = key.lower()
    return sum(3 if hint in key_l else 0 for hint in hints)


def pick_best_text(
    fields: list[tuple[str, str]],
    hints: list[str],
    pattern: re.Pattern[str] | None = None,
) -> str:
    best_text = ""
    best_score = -1
    for key, value in fields:
        if not value:
            continue
        if pattern is not None and not pattern.search(value):
            continue
        base = score_key(key, hints)
        if len(value) < 2:
            base -= 2
        if len(value) > 120:
            base -= 1
        if base > best_score:
            best_score = base
            best_text = value
    return best_text


def extract_direct_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[list[Any]] = []

    try:
        search_map = payload.get("searchResultMap", {})
        list_map = search_map.get("searchResultListMap", {})
        for maybe_list in list_map.values():
            if isinstance(maybe_list, dict):
                items = maybe_list.get("items")
                if isinstance(items, list):
                    candidates.append(items)
            elif isinstance(maybe_list, list):
                candidates.append(maybe_list)
    except Exception:
        return []

    return [entry for items in candidates for entry in items if isinstance(entry, dict)]


def extract_generic_items(payload: Any, language: str = "ja") -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    word_pattern = RE_ENGLISH if language == "en" else RE_JAPANESE

    def walk(node: Any):
        if isinstance(node, list):
            if node and all(isinstance(x, dict) for x in node):
                for row in node:
                    fields = list(walk_text_fields(row))
                    has_wordish = any(word_pattern.search(v or "") for _, v in fields)
                    has_meaningish = any(
                        any(k in key.lower() for k in ("mean", "trans", "target", "desc", "example"))
                        for key, _ in fields
                    )
                    if has_wordish and has_meaningish:
                        items.append(row)
            for value in node:
                walk(value)
            return

        if isinstance(node, dict):
            for value in node.values():
                walk(value)

    walk(payload)
    return items


def _normalize_media_url(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return ""
    if text.startswith("//"):
        return f"https:{text}"
    if text.startswith("/"):
        return f"https://dict.naver.com{text}"
    if text.startswith("http://") or text.startswith("https://"):
        return text
    return ""


def extract_audio_url(item: dict[str, Any]) -> str:
    hints = ("audio", "sound", "voice", "tts", "pronounce", "pronunciation", "mp3")
    best = ""

    def consider(value: Any, key_hint: str = ""):
        nonlocal best
        if best:
            return
        text = _normalize_media_url(str(value or ""))
        if not text:
            return
        key_l = key_hint.lower()
        text_l = text.lower()
        likely_audio = (
            any(h in key_l for h in hints)
            or any(h in text_l for h in (".mp3", ".m4a", ".wav", ".ogg", "audio", "sound", "tts"))
        )
        if likely_audio:
            best = text

    def walk(node: Any, key_hint: str = ""):
        if best:
            return
        if isinstance(node, dict):
            for k, v in node.items():
                key_l = str(k).lower()
                if isinstance(v, (dict, list)):
                    walk(v, key_l)
                else:
                    consider(v, key_l)
            return
        if isinstance(node, list):
            for v in node:
                walk(v, key_hint)

    walk(item)
    return best


def normalize_entry(item: dict[str, Any], language: str = "ja") -> dict[str, Any] | None:
    referer_root = NAVER_REFERER_BY_LANG.get(language, NAVER_REFERER_BY_LANG["ja"]).rstrip("/")

    # Primary parser for api3 search entries.
    if any(key in item for key in ("expEntry", "expKanji", "meansCollector")):
        if language == "en":
            word = clean_text(
                str(
                    item.get("expEntry")
                    or item.get("handleEntry")
                    or item.get("expKanji")
                    or ""
                )
            )
            furigana = extract_english_pronunciation(item)
        else:
            word = clean_text(str(item.get("expKanji") or ""))
            furigana = clean_text(str(item.get("expEntry") or item.get("handleEntry") or ""))
            if not word:
                word = furigana

        meaning = ""
        meaning_alternates: list[str] = []
        example = ""
        example_ruby = ""
        example_translation = ""
        means_collector = item.get("meansCollector")
        if isinstance(means_collector, list):
            for group in means_collector:
                if not isinstance(group, dict):
                    continue
                means = group.get("means")
                if not isinstance(means, list):
                    continue
                for mean in means:
                    if not isinstance(mean, dict):
                        continue
                    meaning_value = clean_text(str(mean.get("value") or ""))
                    if meaning_value:
                        if not meaning:
                            meaning = meaning_value
                        if meaning_value not in meaning_alternates:
                            meaning_alternates.append(meaning_value)
                    if not example:
                        raw_example = str(mean.get("exampleOri") or "")
                        if language == "ja":
                            example = clean_ruby_text(raw_example)
                            parsed_ruby = sanitize_ruby_html(raw_example)
                            if "<rt>" in parsed_ruby.lower():
                                example_ruby = parsed_ruby
                        else:
                            example = clean_text(raw_example)
                    if not example_translation:
                        example_translation = clean_text(str(mean.get("exampleTrans") or ""))
                    if meaning and (example or example_translation):
                        break
                if meaning and (example or example_translation):
                    break

        source_url = ""
        audio_url = extract_audio_url(item)
        destination_link = str(item.get("destinationLink") or "").strip()
        if destination_link.startswith("#/"):
            source_url = f"{referer_root}/{destination_link}"
        if not source_url:
            entry_id = str(item.get("entryId") or "").strip()
            if entry_id:
                if language == "en":
                    source_url = f"https://en.dict.naver.com/#/entry/enko/{urllib.parse.quote(entry_id)}"
                else:
                    source_url = f"https://ja.dict.naver.com/#/entry/jako/{urllib.parse.quote(entry_id)}"

        if word:
            if furigana == word:
                furigana = ""
            if meaning == word:
                meaning = ""
            if example == word:
                example = ""
            return {
                "word": word,
                "furigana": furigana,
                "meaning": meaning,
                "example": example,
                "exampleRuby": example_ruby,
                "exampleTranslation": example_translation,
                "sourceUrl": source_url,
                "audioUrl": audio_url,
                "meaningAlternates": meaning_alternates[:6],
            }

    # Fallback for unexpected payload shapes.
    fields = list(walk_text_fields(item))

    word_pattern = RE_ENGLISH if language == "en" else RE_JAPANESE
    example_pattern = RE_ENGLISH if language == "en" else RE_JAPANESE

    word = pick_best_text(
        fields,
        hints=["entry", "headword", "source", "word", "title", "expentry", "handle"],
        pattern=word_pattern,
    )
    if language == "en":
        furigana = pick_best_text(
            fields,
            hints=["phonetic", "symbol", "pronounce", "ipa", "sound", "read"],
            pattern=None,
        )
    else:
        furigana = pick_best_text(
            fields,
            hints=["kana", "reading", "furigana", "phonetic", "pronounce", "symbol"],
            pattern=RE_KANA,
        )
    meaning = pick_best_text(
        fields,
        hints=["mean", "trans", "definition", "target", "korean", "desc"],
        pattern=RE_KOREAN,
    )
    if not meaning:
        meaning = pick_best_text(
            fields,
            hints=["mean", "trans", "definition", "target", "desc"],
            pattern=None,
        )

    example = pick_best_text(
        fields,
        hints=["example", "sentence", "sample", "exam", "usage"],
        pattern=example_pattern,
    )

    if not word:
        return None

    # Avoid duplicates in case a field is identical.
    if furigana == word:
        furigana = ""
    if example == word:
        example = ""
    if meaning == word:
        meaning = ""

    entry_id = str(item.get("entryId") or item.get("entry_id") or "").strip()
    source_url = ""
    audio_url = extract_audio_url(item)
    if entry_id:
        if language == "en":
            source_url = f"https://en.dict.naver.com/#/entry/enko/{urllib.parse.quote(entry_id)}"
        else:
            source_url = f"https://ja.dict.naver.com/#/entry/jako/{urllib.parse.quote(entry_id)}"

    return {
        "word": word,
        "furigana": furigana,
        "meaning": meaning,
        "example": example,
        "exampleRuby": "",
        "exampleTranslation": "",
        "sourceUrl": source_url,
        "audioUrl": audio_url,
        "meaningAlternates": [meaning] if meaning else [],
    }


def fetch_naver_payload(query: str, language: str = "ja") -> dict[str, Any]:
    params = {
        "query": query,
        "range": "word",
        "page": "1",
        "shouldSearchExample": "true",
    }
    errors: list[str] = []
    endpoints = NAVER_ENDPOINTS_BY_LANG.get(language) or NAVER_ENDPOINTS_BY_LANG["ja"]
    headers = build_naver_headers(language)

    for endpoint in endpoints:
        try:
            url = f"{endpoint}?{urllib.parse.urlencode(params)}"
            request = urllib.request.Request(url=url, headers=headers, method="GET")
            with urllib.request.urlopen(request, timeout=8, context=SSL_CONTEXT) as response:
                status = response.getcode()
                if status != 200:
                    errors.append(f"{endpoint} status={status}")
                    continue
                body = response.read().decode("utf-8", errors="replace")
                return json.loads(body)
        except Exception as exc:
            errors.append(f"{endpoint} error={exc}")

    raise RuntimeError(" | ".join(errors) if errors else "No endpoint available")


def search_naver(query: str, language: str | None = None) -> dict[str, Any]:
    lang = language if language in ("ja", "en") else detect_query_language(query)
    payload = fetch_naver_payload(query, lang)
    corrected_query = extract_corrected_query(payload, query)
    suggestion_queries = collect_query_candidates(payload, query)
    seen: set[tuple[str, str, str, str]] = set()
    normalized, raw_count = normalize_items_from_payload(payload, lang, seen)
    resolved_query = query

    # Fallback: retry with top query suggestions from Naver when first pass yields nothing.
    if not normalized:
        retry_candidates: list[str] = []
        if corrected_query:
            retry_candidates.append(corrected_query)
        retry_candidates.extend(suggestion_queries)

        checked: set[str] = set()
        for candidate in retry_candidates:
            key = candidate.casefold()
            if not candidate or key in checked:
                continue
            checked.add(key)
            payload_retry = fetch_naver_payload(candidate, lang)
            rows, _ = normalize_items_from_payload(payload_retry, lang, seen)
            if rows:
                normalized.extend(rows)
                resolved_query = candidate
                # refresh suggestions using successful payload so UI can show best corrected term
                if not corrected_query:
                    corrected_query = extract_corrected_query(payload_retry, query)
                if not suggestion_queries:
                    suggestion_queries = collect_query_candidates(payload_retry, query)
                break

    # Audio enrichment: when an entry has no direct audio URL, borrow the closest
    # available pronunciation URL from the same result set.
    def keyify(text: str) -> str:
        value = clean_text(text or "")
        value = re.sub(r"[・·･\u30fb]", "", value)
        value = re.sub(r"\s+", "", value)
        return value.casefold()

    audio_rows = [row for row in normalized if clean_text(str(row.get("audioUrl") or ""))]
    if audio_rows:
        query_key = keyify(query)
        for row in normalized:
            if clean_text(str(row.get("audioUrl") or "")):
                continue
            row_key = keyify(str(row.get("word") or ""))
            best_url = ""
            best_score = -1
            for candidate in audio_rows:
                cand_word = str(candidate.get("word") or "")
                cand_key = keyify(cand_word)
                score = 0
                if row_key and cand_key:
                    if row_key == cand_key:
                        score = 100
                    elif row_key in cand_key or cand_key in row_key:
                        score = 80
                if not score and query_key and cand_key and (
                    query_key in cand_key or cand_key in query_key
                ):
                    score = 65
                if score > best_score:
                    best_score = score
                    best_url = str(candidate.get("audioUrl") or "")
            if best_url and best_score >= 65:
                row["audioUrl"] = best_url

    # English meaning enrichment: for single-word queries, probe a domain hint query
    # (e.g., "impairment loss") and surface one more distinct meaning when possible.
    if lang == "en":
        query_token = clean_text(query or "")
        if query_token and " " not in query_token:
            query_key = keyify(query_token)
            accounting_hints = (
                "감손",
                "손상차손",
                "감액손실",
                "평가손",
                "회계",
                "손실",
                "loss",
                "impairment loss",
            )

            def collect_meaning_keys(rows: list[dict[str, Any]]) -> set[str]:
                keys: set[str] = set()
                for row in rows:
                    row_word_key = keyify(str(row.get("word") or ""))
                    if query_key and row_word_key and not (
                        row_word_key == query_key
                        or query_key in row_word_key
                    ):
                        continue
                    meaning_key = keyify(str(row.get("meaning") or ""))
                    if meaning_key:
                        keys.add(meaning_key)
                return keys

            meaning_keys = collect_meaning_keys(normalized)
            best_row: dict[str, Any] | None = None
            best_score = -1
            try:
                payload_hint = fetch_naver_payload(f"{query_token} loss", lang)
                rows_hint, _ = normalize_items_from_payload(payload_hint, lang, seen)
            except Exception:
                rows_hint = []

            for row in rows_hint:
                row_word = clean_text(str(row.get("word") or ""))
                row_word_key = keyify(row_word)
                if query_key and row_word_key and not (
                    row_word_key == query_key or query_key in row_word_key
                ):
                    continue
                meaning = clean_text(str(row.get("meaning") or ""))
                meaning_key = keyify(meaning)
                if not meaning_key or meaning_key in meaning_keys:
                    continue
                score = 0
                if row_word_key == query_key:
                    score += 20
                if "loss" in row_word.lower():
                    score += 45
                if any(h in meaning.lower() for h in accounting_hints):
                    score += 35
                if score > best_score:
                    best_score = score
                    best_row = row

            if best_row and best_score >= 40:
                normalized.append(best_row)
                meaning_keys.add(keyify(str(best_row.get("meaning") or "")))

    return {
        "query": query,
        "correctedQuery": corrected_query or (resolved_query if resolved_query != query else ""),
        "suggestions": suggestion_queries,
        "language": lang,
        "source": "en.dict.naver.com" if lang == "en" else "ja.dict.naver.com",
        "results": normalized,
        "rawCount": raw_count,
    }


class JapaneseHubHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        path = path.split("?", 1)[0].split("#", 1)[0]
        if path in ("/", ""):
            target = STATIC_DIR / "index.html"
            return str(target)

        normalized = path.lstrip("/")
        target = (STATIC_DIR / normalized).resolve()
        static_root = STATIC_DIR.resolve()
        if static_root not in target.parents and target != static_root:
            return str(STATIC_DIR / "index.html")
        return str(target)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/search":
            self.handle_api_search(parsed)
            return
        if parsed.path == "/api/users":
            self.handle_api_users_get()
            return
        if parsed.path == "/api/state":
            self.handle_api_state_get()
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/users":
            self.handle_api_users_post()
            return
        if parsed.path == "/api/users/delete":
            self.handle_api_users_post(delete_only=True)
            return
        if parsed.path == "/api/state":
            self.handle_api_state_post(parsed)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/users/"):
            self.handle_api_users_delete(parsed)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_OPTIONS(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def send_json(self, payload: dict[str, Any], status: int = HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api_search(self, parsed: urllib.parse.ParseResult):
        params = urllib.parse.parse_qs(parsed.query)
        query = clean_text((params.get("query", [""])[0] or "").strip())
        language_param = clean_text((params.get("lang", [""])[0] or "").strip()).lower()
        language = language_param if language_param in ("ja", "en") else None
        if len(query) < 1:
            self.send_json({"error": "Please enter a word."}, status=HTTPStatus.BAD_REQUEST)
            return

        try:
            payload = search_naver(query, language)
            self.send_json(payload)
        except Exception as exc:
            self.send_json(
                {
                    "error": "Could not fetch from Naver dictionary.",
                    "details": str(exc),
                },
                status=HTTPStatus.BAD_GATEWAY,
            )

    def handle_api_users_get(self):
        users = list_users()
        self.send_json({"users": users})

    def handle_api_users_post(self, delete_only: bool = False):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 1_000_000:
                self.send_json({"error": "Invalid request size."}, status=HTTPStatus.BAD_REQUEST)
                return
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            payload = json.loads(body)
            if not isinstance(payload, dict):
                self.send_json({"error": "Invalid request body."}, status=HTTPStatus.BAD_REQUEST)
                return

            # POST fallback for environments that block DELETE (some browsers/proxies/local setups).
            delete_ref = clean_text(
                str(
                    payload.get("deleteUserId")
                    or payload.get("userId")
                    or payload.get("id")
                    or payload.get("delete")
                    or ""
                )
            )
            if delete_ref:
                removed = delete_user(delete_ref)
                self.send_json({"ok": True, "deleted": removed})
                return
            if delete_only:
                self.send_json({"error": "Missing user id to delete."}, status=HTTPStatus.BAD_REQUEST)
                return

            name = sanitize_user_name(payload.get("name"))
            user = create_user(name)
            self.send_json({"ok": True, "user": user})
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.send_json({"error": "Could not create user.", "details": str(exc)}, status=400)

    def handle_api_users_delete(self, parsed: urllib.parse.ParseResult):
        raw_ref = parsed.path.split("/api/users/", 1)[1] or ""
        user_ref = clean_text(urllib.parse.unquote(raw_ref))
        try:
            removed = delete_user(user_ref)
            self.send_json({"ok": True, "deleted": removed})
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.send_json({"error": "Could not delete user.", "details": str(exc)}, status=400)

    def handle_api_state_get(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        user_ref = clean_text((params.get("user", [""])[0] or "").strip())
        self.send_json(load_saved_state(user_ref or None))

    def handle_api_state_post(self, parsed: urllib.parse.ParseResult):
        params = urllib.parse.parse_qs(parsed.query)
        user_ref = clean_text((params.get("user", [""])[0] or "").strip())
        if user_ref:
            with STATE_LOCK:
                _init_state_db_unlocked()
                if resolve_user_id_unlocked(user_ref, default_if_missing=False) is None:
                    self.send_json({"error": "Unknown user."}, status=HTTPStatus.NOT_FOUND)
                    return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 5_000_000:
                self.send_json({"error": "Invalid request size."}, status=HTTPStatus.BAD_REQUEST)
                return
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            payload = json.loads(body)
            normalized = save_state(payload, user_ref or None)
            self.send_json({"ok": True, "lists": len(normalized["lists"])})
        except Exception as exc:
            self.send_json({"error": "Could not save state.", "details": str(exc)}, status=400)


def main():
    port = int(os.getenv("PORT", str(DEFAULT_PORT)))
    host = os.getenv("HOST", "127.0.0.1")
    init_state_db()
    httpd = ThreadingHTTPServer((host, port), JapaneseHubHandler)
    print(f"Japanese Hub running at http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
