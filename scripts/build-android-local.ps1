$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$androidRoot = Join-Path $projectRoot "apps\mobile\android"
$appJsonPath = Join-Path $projectRoot "apps\mobile\app.json"
$signingPath = Join-Path $env:USERPROFILE ".coparent-credentials\signing.json"
$nodeRoot = Join-Path $env:LOCALAPPDATA "Programs\nodejs-portable"
$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$javaHome = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
$drive = "X:"

foreach ($requiredPath in @($androidRoot, $appJsonPath, $signingPath, $nodeRoot, $sdkRoot, $javaHome)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    throw "Falta un requisito para compilar: $requiredPath"
  }
}

$signing = Get-Content -LiteralPath $signingPath -Raw | ConvertFrom-Json
$appConfig = Get-Content -LiteralPath $appJsonPath -Raw | ConvertFrom-Json
$version = $appConfig.expo.version
$versionCode = $appConfig.expo.android.versionCode
$createdMapping = $false

if (Test-Path "$drive\") {
  $existingRoot = (Resolve-Path "$drive\").Path.TrimEnd("\")
  if ($existingRoot -ne $projectRoot.TrimEnd("\")) {
    throw "$drive ya esta en uso por otra ubicacion."
  }
} else {
  subst $drive $projectRoot
  $createdMapping = $true
}

try {
  $env:JAVA_HOME = $javaHome
  $env:ANDROID_HOME = $sdkRoot
  $env:ANDROID_SDK_ROOT = $sdkRoot
  $env:GRADLE_OPTS = "-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv4Addresses=true"
  $env:PATH = "$nodeRoot;$javaHome\bin;$sdkRoot\platform-tools;$env:PATH"

  $env:COPARENT_UPLOAD_STORE_FILE = $signing.keystorePath
  $env:COPARENT_UPLOAD_STORE_PASSWORD = $signing.keystorePassword
  $env:COPARENT_UPLOAD_KEY_ALIAS = $signing.keyAlias
  $env:COPARENT_UPLOAD_KEY_PASSWORD = $signing.keyPassword

  $env:NODE_ENV = "production"
  $env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"
  $env:EXPO_PUBLIC_API_URL = "https://coparent-argentina-api.vercel.app"
  $env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "30610428855-foj7hpfcptq377h8lqpnedenqa3ta1mf.apps.googleusercontent.com"
  $env:EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "30610428855-ueh3tipa2h3aj508eufk3i4fphhd2qit.apps.googleusercontent.com"
  $env:EXPO_PUBLIC_WEB_URL = "https://coparent-global.vercel.app"

  Push-Location "$drive\apps\mobile\android"
  try {
    & .\gradlew.bat :app:bundleRelease --no-daemon "-Pkotlin.incremental=false"
    if ($LASTEXITCODE -ne 0) {
      throw "Gradle no pudo generar el AAB."
    }
  } finally {
    Pop-Location
  }

  $source = Join-Path $androidRoot "app\build\outputs\bundle\release\app-release.aab"
  $destination = Join-Path $env:USERPROFILE "Downloads\Coparent-Global-$version-$versionCode.aab"
  Copy-Item -LiteralPath $source -Destination $destination -Force
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $destination).Hash
  [System.IO.File]::WriteAllText("$destination.sha256", "$hash  Coparent-Global-$version-$versionCode.aab`r`n")

  Write-Host "AAB generado: $destination"
  Write-Host "SHA256: $hash"
} finally {
  if ($createdMapping) {
    subst $drive /D
  }
}
