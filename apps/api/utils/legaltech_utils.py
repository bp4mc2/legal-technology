from datetime import date, datetime
from typing import Iterable, Tuple

LEGALTECH_BASE_IRI = "https://data.bp4mc2.org/id/lto/legaltech"

def normalize_abbrevation(value) -> str:
    raw = str(value or '').strip()
    if not raw:
        return ''
    cleaned = ''.join(ch for ch in raw if ch.isalnum() or ch in ('-', '_'))
    return cleaned.lower()


def normalize_version(value, default: str = '1.0.0') -> str:
    raw = str(value or '').strip()
    return raw if raw else default


def normalize_iso_date(value, field_name: str) -> str:
    if value is None:
        return ''
    if isinstance(value, date):
        return value.isoformat()

    raw = str(value).strip()
    if not raw:
        return ''

    date_part = raw[:10]
    try:
        return datetime.strptime(date_part, '%Y-%m-%d').date().isoformat()
    except ValueError as exc:
        raise ValueError(f"{field_name} must be an ISO date (YYYY-MM-DD)") from exc


def normalize_subtype(value, allowed_subtypes: Iterable[str], default: str = 'Methode') -> str:
    subtype = str(value or '').strip()
    return subtype if subtype in set(allowed_subtypes) else default


def build_api_id(abbrevation: str, version: str) -> str:
    return f"{abbrevation}--v--{version}"


def parse_api_id(api_id) -> Tuple[str | None, str | None]:
    token = str(api_id or '').strip()
    if '--v--' in token:
        abbrevation, version = token.split('--v--', 1)
        return normalize_abbrevation(abbrevation), normalize_version(version)
    return None, None


def build_tech_iri(base_iri: str, abbrevation: str, version: str) -> str:
    return f"{base_iri}/{abbrevation}/v/{version}"


def parse_tech_iri(tech_iri: str, base_iri: str = LEGALTECH_BASE_IRI) -> Tuple[str | None, str | None]:
    prefix = f"{base_iri}/"
    value = str(tech_iri or '')
    if not value.startswith(prefix):
        return None, None
    tail = value[len(prefix):]
    if '/v/' not in tail:
        return None, None
    abbrevation, version = tail.split('/v/', 1)
    if '/' in version:
        return None, None
    return normalize_abbrevation(abbrevation), normalize_version(version)


def resolve_tech_iri_from_id(base_iri: str, api_id) -> str:
    abbrevation, version = parse_api_id(api_id)
    if abbrevation and version:
        return build_tech_iri(base_iri, abbrevation, version)
    return f"{base_iri}/{api_id}"


def get_part_iri(tech_iri: str, part: str, unique_suffix: str) -> str:
    return f"{tech_iri}/{part}/{unique_suffix}"
