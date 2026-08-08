"""Remove duplicate product names from CatalogSeedData.cs (keep lowest Id per name)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "api" / "DomainModel" / "DataSeeder" / "CatalogSeedData.cs"

text = PATH.read_text(encoding="utf-8")
start = text.index("public static readonly ProductSeed[] Products =")
chunk = text[start:]
array_body = chunk.split("[", 1)[1].rsplit("];", 1)[0]

pat = re.compile(r'new\((\d+), "((?:[^"\\]|\\.)*)", (\d+(?:\.\d+)?)m, (\d+), (\d+)\)')
products = pat.findall(array_body)

seen: set[str] = set()
unique: list[tuple[str, str, str, str, str]] = []
for pid, name, price, cat, sup in sorted(products, key=lambda x: int(x[0])):
    if name in seen:
        continue
    seen.add(name)
    unique.append((pid, name, price, cat, sup))

lines = ["    public static readonly ProductSeed[] Products =", "    ["]
for pid, name, price, cat, sup in unique:
    esc = name.replace("\\", "\\\\").replace('"', '\\"')
    lines.append(f'        new({pid}, "{esc}", {price}m, {cat}, {sup}),')
lines.append("    ];")
new_products = "\n".join(lines)

text = re.sub(
    r"    public static readonly ProductSeed\[\] Products =\s*\[[\s\S]*?\n    \];",
    new_products,
    text,
    count=1,
)
PATH.write_text(text, encoding="utf-8")
print(f"Unique products: {len(unique)} (was {len(products)})")
