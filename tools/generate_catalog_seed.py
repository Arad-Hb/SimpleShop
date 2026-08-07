"""Generate CatalogSeedData.cs from legacy SQL in agent transcript."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path(
    r"C:\Users\Arad\.cursor\projects\c-Users-Arad-OneDrive-Desktop-Simple-e-commerce-project-SimpleShop"
    r"\agent-transcripts\c9a5b622-bcc6-42f4-927b-800699ab8b43\c9a5b622-bcc6-42f4-927b-800699ab8b43.jsonl"
)
OUTPUT = ROOT / "api" / "DomainModel" / "DataSeeder" / "CatalogSeedData.cs"

CAT_RE = re.compile(
    r"INSERT \[dbo\]\.\[Category\].*?VALUES \((\d+), N'((?:[^']|'')*)', (\d+|NULL), .*?, (N'((?:[^']|'')*)'|NULL)\)"
)
PROD_RE = re.compile(
    r"INSERT \[dbo\]\.\[Product\].*?VALUES \((\d+), N'((?:[^']|'')*)', (\d+), \d+, N'[^']*', N'((?:[^']|'')*)', (\d+), (\d+)\)"
)


def unescape_sql(s: str) -> str:
    return s.replace("''", "'")


def load_user_text() -> str:
    text = ""
    with TRANSCRIPT.open(encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            if obj.get("role") != "user":
                continue
            for part in obj.get("message", {}).get("content", []):
                if part.get("type") == "text":
                    text += part.get("text", "")
    return text


def map_parent(cat_id: int, parent_raw: str) -> str:
    if parent_raw == "NULL":
        return "12" if 334 <= cat_id <= 353 else "null"
    parent = int(parent_raw)
    return "null" if parent == 0 else str(parent)


def cs_string(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def emit_categories(cats: list) -> str:
    lines = ["    public static readonly CategorySeed[] Categories =", "    ["]
    for cat_id, name, parent_raw, alt in cats:
        cat_id = int(cat_id)
        name = unescape_sql(name)
        alt = unescape_sql(alt) if alt else None
        meta = cs_string(alt) if alt else "null"
        lines.append(
            f"        new({cat_id}, {cs_string(name)}, {map_parent(cat_id, parent_raw)}, {meta}),"
        )
    lines.append("    ];")
    return "\n".join(lines)


def emit_products(prods: list) -> str:
    lines = ["    public static readonly ProductSeed[] Products =", "    ["]
    for prod_id, name, price, _alt, cat_id, supplier_id in prods:
        name = unescape_sql(name).strip()
        lines.append(
            f"        new({prod_id}, {cs_string(name)}, {price}m, {cat_id}, {supplier_id}),"
        )
    lines.append("    ];")
    return "\n".join(lines)


def main() -> None:
    text = load_user_text()
    cats = CAT_RE.findall(text)
    prods = PROD_RE.findall(text)
    if not cats or not prods:
        raise SystemExit(f"Parse failed: categories={len(cats)}, products={len(prods)}")

    content = f"""namespace DomainModel.DataSeeder;

public static class CatalogSeedData
{{
    public sealed record CategorySeed(int Id, string Name, int? ParentId, string? MetaTitle);

    public sealed record ProductSeed(int Id, string Name, decimal Price, int CategoryId, int? SupplierId);

{emit_categories(cats)}

{emit_products(prods)}
}}
"""
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUTPUT} ({len(cats)} categories, {len(prods)} products)")


if __name__ == "__main__":
    main()
