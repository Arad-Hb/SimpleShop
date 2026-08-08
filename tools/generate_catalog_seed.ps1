$ErrorActionPreference = 'Stop'
$transcript = 'C:\Users\Arad\.cursor\projects\c-Users-Arad-OneDrive-Desktop-Simple-e-commerce-project-SimpleShop\agent-transcripts\c9a5b622-bcc6-42f4-927b-800699ab8b43\c9a5b622-bcc6-42f4-927b-800699ab8b43.jsonl'
$output = Join-Path $PSScriptRoot '..\api\DomainModel\DataSeeder\CatalogSeedData.cs'

$text = ''
Get-Content $transcript -Encoding UTF8 | ForEach-Object {
    $obj = $_ | ConvertFrom-Json
    if ($obj.role -eq 'user') {
        foreach ($part in $obj.message.content) {
            if ($part.type -eq 'text') { $text += $part.text }
        }
    }
}

function Escape-Cs([string]$s) {
    return ('"' + ($s -replace '\\','\\' -replace '"','\"') + '"')
}

function Map-Parent([int]$id, [string]$raw) {
    if ($raw -eq 'NULL') {
        if ($id -ge 334 -and $id -le 353) { return '12' }
        return 'null'
    }
    $p = [int]$raw
    if ($p -eq 0) { return 'null' }
    return "$p"
}

$catMatches = [regex]::Matches($text, "INSERT \[dbo\]\.\[Category\].*?VALUES \((\d+), N'((?:[^']|'')*)', (\d+|NULL), .*?, (?:N'((?:[^']|'')*)'|NULL)\)")
$prodMatches = [regex]::Matches($text, "INSERT \[dbo\]\.\[Product\].*?VALUES \((\d+), N'((?:[^']|'')*)', (\d+), \d+, N'[^']*', N'((?:[^']|'')*)', (\d+), (\d+)\)")

if ($catMatches.Count -eq 0 -or $prodMatches.Count -eq 0) {
    throw "Parse failed: categories=$($catMatches.Count) products=$($prodMatches.Count)"
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('namespace DomainModel.DataSeeder;')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('public static class CatalogSeedData')
[void]$sb.AppendLine('{')
[void]$sb.AppendLine('    public sealed record CategorySeed(int Id, string Name, int? ParentId, string? MetaTitle);')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('    public sealed record ProductSeed(int Id, string Name, decimal Price, int CategoryId, int? SupplierId);')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('    public static readonly CategorySeed[] Categories =')
[void]$sb.AppendLine('    [')

foreach ($m in $catMatches) {
    $id = [int]$m.Groups[1].Value
    $name = $m.Groups[2].Value -replace "''","'"
    $parent = Map-Parent $id $m.Groups[3].Value
    $alt = $m.Groups[4].Value
    if ($alt) { $alt = $alt -replace "''","'" }
    $meta = if ([string]::IsNullOrWhiteSpace($alt)) { 'null' } else { Escape-Cs $alt }
    [void]$sb.AppendLine("        new($id, $(Escape-Cs $name), $parent, $meta),")
}

[void]$sb.AppendLine('    ];')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('    public static readonly ProductSeed[] Products =')
[void]$sb.AppendLine('    [')

$seenNames = @{}
$sortedProds = $prodMatches | Sort-Object { [int]$_.Groups[1].Value }
foreach ($m in $sortedProds) {
    $name = ($m.Groups[2].Value -replace "''","'").Trim()
    if ($seenNames.ContainsKey($name)) { continue }
    $seenNames[$name] = $true
    $id = $m.Groups[1].Value
    $price = $m.Groups[3].Value
    $catId = $m.Groups[5].Value
    $supplierId = $m.Groups[6].Value
    [void]$sb.AppendLine("        new($id, $(Escape-Cs $name), ${price}m, $catId, $supplierId),")
}

[void]$sb.AppendLine('    ];')
[void]$sb.AppendLine('}')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($output, $sb.ToString(), $utf8NoBom)
Write-Host "Wrote $output ($($catMatches.Count) categories, $($seenNames.Count) unique products from $($prodMatches.Count) rows)"
