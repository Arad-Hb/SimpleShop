$base = "http://127.0.0.1:5102"
$ErrorActionPreference = "Continue"
$failures = @()

function Run-Test([int]$n, [string]$label, [scriptblock]$Action) {
    try {
        & $Action
        Write-Host "[$n] PASS $label" -ForegroundColor Green
    } catch {
        $msg = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
        Write-Host "[$n] FAIL $label :: $msg" -ForegroundColor Red
        $script:failures += "${label}: $msg"
    }
}

$loginBody = '{"username":"admin","password":"Admin123!","role":"Admin"}'
$auth = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$h = @{ Authorization = "Bearer $($auth.token)" }

Run-Test 1 "Login" { if (-not $auth.token) { throw "no token" } }
Run-Test 2 "GET all" { $script:all = Invoke-RestMethod -Uri "$base/api/categories" -Method GET; if ($script:all.Count -lt 1) { throw "empty" } }
Run-Test 3 "GET tree" { Invoke-RestMethod -Uri "$base/api/categories/tree" -Method GET | Out-Null }
Run-Test 4 "SEARCH" { Invoke-RestMethod -Uri "$base/api/categories/search?pageIndex=0&pageSize=5" -Method GET | Out-Null }

$slug = "test-" + [guid]::NewGuid().ToString().Substring(0,8)
Run-Test 5 "CREATE with SEO" {
    $body = (@{ name="Test Cat"; slug=$slug; sortOrder=0; isActive=$true; metaTitle="T"; metaDescription="D"; metaKeywords="k1"; canonicalUrl="https://x.com"; ogTitle="OG"; ogDescription="OGD" } | ConvertTo-Json)
    $script:created = Invoke-RestMethod -Uri "$base/api/categories" -Method POST -Headers $h -Body $body -ContentType "application/json"
    $script:newId = $script:created.id
    if (-not $script:created.metaKeywords) { throw "metaKeywords missing" }
}

Run-Test 6 "GET by id" {
    $script:got = Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method GET
    if ($script:got.metaKeywords -ne "k1") { throw "metaKeywords not persisted" }
}

Run-Test 7 "UPDATE keep sortOrder" {
    $so = $script:created.sortOrder
    $body = (@{ name="Test Cat Updated"; slug=$slug; sortOrder=$so; isActive=$true; metaTitle="U"; metaKeywords="k2"; confirmShiftSortOrder=$false } | ConvertTo-Json)
    $script:updated = Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method PUT -Headers $h -Body $body -ContentType "application/json"
}

Run-Test 8 "Duplicate slug rejected" {
    $body = (@{ name="Dup"; slug=$slug; isActive=$true } | ConvertTo-Json)
    Invoke-RestMethod -Uri "$base/api/categories" -Method POST -Headers $h -Body $body -ContentType "application/json" | Out-Null
    throw "should have failed"
}

Run-Test 9 "SEARCH isActive" {
    $r = Invoke-RestMethod -Uri "$base/api/categories/search?isActive=true&pageSize=100" -Method GET
    if ($r.searchModel.recordCount -lt 1) { throw "no active categories" }
}

Run-Test 10 "CREATE child" {
    $cs = "child-" + [guid]::NewGuid().ToString().Substring(0,8)
    $body = (@{ name="Child"; slug=$cs; parentId=$script:newId; sortOrder=0; isActive=$true } | ConvertTo-Json)
    $script:child = Invoke-RestMethod -Uri "$base/api/categories" -Method POST -Headers $h -Body $body -ContentType "application/json"
    if ($script:child.depth -ne 1) { throw "depth=$($script:child.depth)" }
}

Run-Test 11 "SEARCH parentId" {
    $r = Invoke-RestMethod -Uri "$base/api/categories/search?parentId=$($script:newId)" -Method GET
    if ($r.searchModel.recordCount -lt 1) { throw "parent filter empty" }
}

Run-Test 12 "DELETE parent blocked" {
    Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method DELETE -Headers $h | Out-Null
    throw "should fail"
}

Run-Test 13 "File upload" {
    Add-Type -AssemblyName System.Drawing
    $bmp = New-Object System.Drawing.Bitmap 40,40
    $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::Green)
    $tmp = Join-Path $env:TEMP "cat-test.png"; $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
    $script:upload = Invoke-RestMethod -Uri "$base/api/files/upload" -Method POST -Headers $h -Form @{ file = Get-Item $tmp; folder = "categories" }
    if (-not $script:upload.id) { throw "no upload id" }
}

Run-Test 14 "UPDATE with images" {
    $so = $script:updated.sortOrder
    $body = (@{ name="Test Cat Updated"; slug=$slug; sortOrder=$so; isActive=$true; imageFileId=$script:upload.id; ogImageId=$script:upload.id; metaKeywords="k2" } | ConvertTo-Json)
    $script:withImg = Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method PUT -Headers $h -Body $body -ContentType "application/json"
    if (-not $script:withImg.imageUrl) { throw "imageUrl missing" }
    if (-not $script:withImg.ogImageUrl) { throw "ogImageUrl missing" }
}

Run-Test 15 "LIST has thumbnail" {
    $r = Invoke-RestMethod -Uri "$base/api/categories/search?search=Test%20Cat%20Updated" -Method GET
    $item = $r.items | Where-Object { $_.id -eq $script:newId } | Select-Object -First 1
    if (-not $item.thumbnailUrl) { throw "thumbnail missing" }
}

Run-Test 16 "409 sort conflict" {
    $body = (@{ name="Conflict"; slug="conf-$slug"; parentId=$script:newId; sortOrder=1; isActive=$true; confirmShiftSortOrder=$false } | ConvertTo-Json)
    try {
        Invoke-RestMethod -Uri "$base/api/categories" -Method POST -Headers $h -Body $body -ContentType "application/json" | Out-Null
        throw "expected 409"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw $_ }
    }
}

Run-Test 17 "409 confirm shift" {
    $body = (@{ name="Conflict2"; slug="conf2-$slug"; parentId=$script:newId; sortOrder=1; isActive=$true; confirmShiftSortOrder=$true } | ConvertTo-Json)
    $script:conflictId = (Invoke-RestMethod -Uri "$base/api/categories" -Method POST -Headers $h -Body $body -ContentType "application/json").id
}

Run-Test 18 "TOGGLE active" {
    $got = Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method GET
    $body = (@{ name=$got.name; slug=$got.slug; parentId=$got.parentId; sortOrder=$got.sortOrder; isActive=(-not $got.isActive); metaTitle=$got.metaTitle; metaDescription=$got.metaDescription; metaKeywords=$got.metaKeywords; canonicalUrl=$got.canonicalUrl; ogTitle=$got.ogTitle; ogDescription=$got.ogDescription; imageFileId=$got.imageFileId; ogImageId=$got.ogImageId } | ConvertTo-Json)
    Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method PUT -Headers $h -Body $body -ContentType "application/json" | Out-Null
}

Run-Test 19 "Cleanup" {
    Invoke-RestMethod -Uri "$base/api/categories/$($script:conflictId)" -Method DELETE -Headers $h | Out-Null
    Invoke-RestMethod -Uri "$base/api/categories/$($script:child.id)" -Method DELETE -Headers $h | Out-Null
    Invoke-RestMethod -Uri "$base/api/categories/$($script:newId)" -Method DELETE -Headers $h | Out-Null
}

Write-Host ""
Write-Host "Total failures: $($failures.Count)"
$failures | ForEach-Object { Write-Host " - $_" }
if ($failures.Count -gt 0) { exit 1 }
