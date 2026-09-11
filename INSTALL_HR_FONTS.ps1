param(
  [string]$FontsSource = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetDir = Join-Path $RepoRoot "assets\fonts"
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$CandidateRoots = @()
if ($FontsSource -and (Test-Path $FontsSource)) { $CandidateRoots += (Resolve-Path $FontsSource).Path }
$CandidateRoots += (Join-Path $RepoRoot "HR_Fonts")
$CandidateRoots += (Join-Path (Split-Path -Parent $RepoRoot) "HR_Fonts")
$CandidateRoots += (Join-Path $env:USERPROFILE "Downloads\HR_Fonts")
$CandidateRoots += (Join-Path $env:USERPROFILE "Desktop\HR_Fonts")
$CandidateRoots = $CandidateRoots | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

if (-not $CandidateRoots -or $CandidateRoots.Count -eq 0) {
  Write-Host "Fonts folder not found. Example:" -ForegroundColor Yellow
  Write-Host "INSTALL_HR_FONTS.cmd C:\HR_Fonts" -ForegroundColor Cyan
  exit 2
}

$AllFonts = foreach ($root in $CandidateRoots) {
  Get-ChildItem -Path $root -Recurse -File -Include *.ttf,*.otf,*.woff,*.woff2 -ErrorAction SilentlyContinue
}

function Find-Font($patterns) {
  foreach ($p in $patterns) {
    $hit = $AllFonts | Where-Object { $_.Name -like $p } | Select-Object -First 1
    if ($hit) { return $hit }
  }
  return $null
}

$Map = @(
  @{ Out='YaModernPro-Bold.otf'; Patterns=@('*Ya*Modern*Pro*Bold*.otf','*Ya-ModernPro-Bold.otf','*ModernPro*Bold*.otf','*Modern*Pro*.otf') },
  @{ Out='ZainMobile.ttf'; Patterns=@('*ZAIN*mob*variable*.ttf','*Zain*mob*.ttf','*ZAIN*.ttf','*Zain*.ttf') },
  @{ Out='SFSultan-Black.ttf'; Patterns=@('*سلطان*.ttf','*Sultan*Black*.ttf','*Sultan*.ttf') },
  @{ Out='Stencil.ttf'; Patterns=@('*STENCIL*.TTF','*STENCIL*.ttf','*Stencil*.ttf','*Stencil*.TTF') },
  @{ Out='ElfeeraScript.ttf'; Patterns=@('*Elfeera*Script*.ttf','*Elfeera*.ttf','*Elfeera*Script*.otf','*Elfeera*.otf') }
)

$Copied = 0
foreach ($item in $Map) {
  $font = Find-Font $item.Patterns
  $target = Join-Path $TargetDir $item.Out
  if ($font) {
    Copy-Item -LiteralPath $font.FullName -Destination $target -Force
    Write-Host "OK: copied $($font.Name) -> assets\fonts\$($item.Out)" -ForegroundColor Green
    $Copied++
  } else {
    Write-Host "WARN: font not found for $($item.Out)" -ForegroundColor Yellow
  }
}

if ($Copied -lt 5) {
  Write-Host "Copied $Copied/5 fonts. Check the fonts folder path." -ForegroundColor Yellow
  exit 3
}

Write-Host "Fonts installed. Run VERIFY_HR_FONTS.cmd then git add -A / commit / push." -ForegroundColor Cyan
exit 0
