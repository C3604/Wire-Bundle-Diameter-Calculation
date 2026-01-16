Param(
  [string]$Root,
  [string]$Output,
  [string]$Temp,
  [string]$Version = $null,
  [string]$Clean = '0'
)
$rawArgs = $args
if ($rawArgs -and $rawArgs.Length -gt 0) {
  for ($i = 0; $i -lt $rawArgs.Length; $i++) {
    $tok = [string]$rawArgs[$i]
    switch -Regex ($tok) {
      '^--version$' { if ($i + 1 -lt $rawArgs.Length) { $Version = [string]$rawArgs[$i+1]; $i++ } }
      '^--output$'  { if ($i + 1 -lt $rawArgs.Length) { $Output  = [string]$rawArgs[$i+1]; $i++ } }
      '^--clean$'   { $Clean = '1' }
    }
  }
}
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Date = Get-Date -Format 'yyyyMMdd'
$Time = Get-Date -Format 'HHmmss'
if (-not $Root -or $Root -eq '') {
  $Root = $PSScriptRoot
} else {
  $Root = $Root.Trim('"').Trim()
  try { $Root = [System.IO.Path]::GetFullPath($Root) } catch { $Root = $PSScriptRoot }
}
if ($Output) {
  $Output = $Output.Trim('"').Trim()
}
if ($Temp) {
  $Temp = $Temp.Trim('"').Trim()
}
$LogsDir = Join-Path $Root 'logs'
if (-not $Output -or $Output -eq '') { $Output = Join-Path $Root 'release' }
if (-not $Temp -or $Temp -eq '') { $Temp = Join-Path $Root '.build-temp' }
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
$LogPath = Join-Path $LogsDir "build-$Date-$Time.log"
Start-Transcript -Path $LogPath -Append | Out-Null
try {
  Write-Host "Start packaging"
  Write-Host ("Root=" + $Root)
  Write-Host ("Output=" + $Output)
  Write-Host ("Temp=" + $Temp)
  $manifestPath = Join-Path $Root 'manifest.json'
  if (!(Test-Path $manifestPath)) { throw "manifest.json missing" }
  $manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
  $projectName = if ($manifest.PSObject.Properties.Name -contains 'name' -and $manifest.name) { 
    if ($manifest.name -match '^__MSG_.+__$') { Split-Path $Root -Leaf } else { $manifest.name } 
  } else { 
    Split-Path $Root -Leaf 
  }
  $ver = if ($Version) { $Version } else {
    if ($manifest.PSObject.Properties.Name -contains 'version' -and $manifest.version) { $manifest.version } else { throw "version missing" }
  }
  $zipName = "${projectName}_v${ver}_${Date}.zip"
  if (!(Test-Path $Output)) { New-Item -ItemType Directory -Force -Path $Output | Out-Null }
  if (!(Test-Path $Temp)) { New-Item -ItemType Directory -Force -Path $Temp | Out-Null }
  if ($Clean -eq '1') {
    if (Test-Path $Temp) { Remove-Item -Recurse -Force $Temp }
    New-Item -ItemType Directory -Force -Path $Temp | Out-Null
    $zipPath = Join-Path $Output $zipName
    if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
  }
  $includeRoots = @('manifest.json','popup.html','src','_locales','icons','src/pages/help/assets','src/storage')
  $buildIgnorePath = Join-Path $Root '.buildignore'
  $excludePatterns = @()
  $negatePatterns = @()
  if (Test-Path $buildIgnorePath) {
    $content = Get-Content -Raw $buildIgnorePath -Encoding UTF8 -ErrorAction SilentlyContinue
    $lines = $content -split "`n"
    foreach ($line in $lines) {
      $p = $line.Trim()
      if ($p -eq '' -or $p.StartsWith('#')) { continue }
      if ($p.StartsWith('!')) { $negatePatterns += $p.Substring(1) } else { $excludePatterns += $p }
    }
  }
  function Match-Pattern([string]$rel,[string]$pattern) {
    $pat = $pattern.Trim()
    if ($pat.EndsWith('/')) {
      $prefix = $pat.TrimEnd('/')
      return $rel.StartsWith("$prefix/")
    } else {
      $wc = New-Object System.Management.Automation.WildcardPattern($pat,[System.Management.Automation.WildcardOptions]::IgnoreCase)
      return $wc.IsMatch($rel)
    }
  }
  function Should-Exclude([string]$rel) {
    $exMatched = $false
    foreach ($p in $excludePatterns) { if (Match-Pattern $rel $p) { $exMatched = $true; break } }
    if (-not $exMatched) { return $false }
    foreach ($p in $negatePatterns) { if (Match-Pattern $rel $p) { return $false } }
    $true
  }
  foreach ($r in $includeRoots) {
    $src = Join-Path $Root $r
    if (!(Test-Path $src)) { continue }
    $dst = Join-Path $Temp $r
    if ((Get-Item $src).PSIsContainer) {
      Copy-Item -Path $src -Destination $dst -Recurse -Force
    } else {
      $dstDir = Split-Path $dst -Parent
      if ($dstDir -and -not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
      Copy-Item -Path $src -Destination $dst -Force
    }
  }
  Get-ChildItem -Path $Temp -Recurse -Force -File | ForEach-Object {
    $rel = $_.FullName.Substring($Temp.Length).TrimStart('\','/')
    $rel = $rel -replace '\\','/'
    if (Should-Exclude $rel) { Remove-Item -Force $_.FullName }
  }
  Get-ChildItem -Path $Temp -Recurse -Directory | ForEach-Object {
    if (-not (Get-ChildItem -Path $_.FullName -Force)) { Remove-Item -Force $_.FullName }
  }
  $zipPath = Join-Path $Output $zipName
  if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
  Compress-Archive -Path (Join-Path $Temp '*') -DestinationPath $zipPath -Force
  if (!(Test-Path $zipPath)) { throw "zip not created" }
  $size = (Get-Item $zipPath).Length
  if ($size -le 0) { throw "zip empty" }
  Write-Host "OK: $zipPath size $size"
  try { if (Test-Path $Temp) { Remove-Item -Recurse -Force $Temp } } catch {}
  try { if (Test-Path $Output) { Start-Process explorer.exe $Output } } catch {}
  Stop-Transcript | Out-Null
  exit 0
} catch {
  Write-Error $_.Exception.Message
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}
