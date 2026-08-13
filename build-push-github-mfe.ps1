param (
  [string]$githubUser = "lchumi",
  [string]$tag = "latest"
)

# Obtener la raíz del workspace (donde está este script)
$workspaceRoot = $PSScriptRoot
Set-Location -Path $workspaceRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build & Push Microfrontends" -ForegroundColor Cyan
Write-Host "  Repo: $githubUser" -ForegroundColor Cyan
Write-Host "  Tag: $tag" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Buscar todos los proyectos que tengan Dockerfile en projects/
$projectsPath = Join-Path $workspaceRoot "projects"
if (-not (Test-Path $projectsPath)) {
  Write-Error "No se encontró la carpeta 'projects/'. ¿Estás en la raíz del workspace?"
  exit 1
}

$projectsWithDockerfile = Get-ChildItem -Path $projectsPath -Directory | Where-Object {
  Test-Path (Join-Path $_.FullName "Dockerfile")
}

if ($projectsWithDockerfile.Count -eq 0) {
  Write-Warning "No se encontraron proyectos con Dockerfile en projects/"
  exit 0
}

Write-Host "Proyectos encontrados: $($projectsWithDockerfile.Count)`n" -ForegroundColor Green

foreach ($project in $projectsWithDockerfile) {
  $projectName = $project.Name.Trim()

  if ([string]::IsNullOrWhiteSpace($projectName)) {
    Write-Warning "Nombre de proyecto vacío. Saltando..."
    continue
  }

  # Nombre de la imagen
  $imageName = "ghcr.io/$githubUser/$projectName`:$tag"
  $dockerfilePath = Join-Path $project.FullName "Dockerfile"

  Write-Host "----------------------------------------" -ForegroundColor DarkGray
  Write-Host "Proyecto: $projectName" -ForegroundColor Cyan
  Write-Host "Dockerfile: $dockerfilePath" -ForegroundColor DarkGray
  Write-Host "Imagen: $imageName" -ForegroundColor DarkGray
  Write-Host ""

  # Build (contexto = raíz del workspace, porque necesita node_modules, libs/, angular.json)
  Write-Host "Building..." -ForegroundColor Yellow
  docker build `
        -f $dockerfilePath `
        -t $imageName `
        $workspaceRoot

  if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló el build de $projectName"
    continue
  }

  Write-Host "Build exitoso" -ForegroundColor Green

  # Push
  Write-Host "Pushing to GHCR..." -ForegroundColor Yellow
  docker push $imageName

  if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló el push de $projectName"
    continue
  }

  Write-Host "Push exitoso" -ForegroundColor Green
  Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ¡Todo listo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Opcional: mostrar imágenes subidas
Write-Host "`nImágenes en GHCR:" -ForegroundColor Cyan
foreach ($project in $projectsWithDockerfile) {
  Write-Host "  ghcr.io/$githubUser/$($project.Name)`:$tag" -ForegroundColor White
}
