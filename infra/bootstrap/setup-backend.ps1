# ============================================================
# BOOTSTRAP - TERRAFORM REMOTE BACKEND
# ============================================================
# Este script crea los recursos necesarios para almacenar el
# estado de Terraform de forma remota y segura en AWS:
#
#   1. S3 Bucket        → Almacena el archivo terraform.tfstate
#   2. DynamoDB Table   → Bloqueo del estado (evita conflictos)
#
# EJECUCION: Solo se corre UNA vez por equipo, antes del primer
# terraform init. Cualquier integrante del equipo puede ejecutarlo.
#
# PARAMETRO: Pasar el perfil de AWS CLI de cada integrante.
#   .\setup-backend.ps1 -Profile "mi-perfil-aws"
#
# REQUISITO: Tener AWS CLI instalado y configurado localmente.
#   Para ver tus perfiles disponibles: aws configure list-profiles
# ============================================================

param(
  [Parameter(Mandatory = $true, HelpMessage = "Nombre del perfil de AWS CLI a usar (ej: default, mi-perfil)")]
  [string]$Profile
)

$AWS_REGION  = "us-east-2"
$BUCKET_NAME = "ticketgo-terraform-state-783111403254-us-east-2"
$TABLE_NAME  = "ticketgo-terraform-locks"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " TicketGo AWS - Bootstrap Terraform Backend" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Perfil AWS  : $Profile"
Write-Host "Region      : $AWS_REGION"
Write-Host "Bucket S3   : $BUCKET_NAME"
Write-Host "Tabla DDB   : $TABLE_NAME"
Write-Host ""

# ------------------------------------------------------------
# VERIFICACION: Confirmar que el perfil existe
# ------------------------------------------------------------
Write-Host "[0/5] Verificando perfil AWS '$Profile'..." -ForegroundColor Yellow

$profileCheck = aws sts get-caller-identity --profile $Profile 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: El perfil '$Profile' no existe o no tiene credenciales validas." -ForegroundColor Red
  Write-Host "       Ejecuta 'aws configure list-profiles' para ver tus perfiles." -ForegroundColor Red
  exit 1
}
Write-Host "OK: Perfil verificado." -ForegroundColor Green

# ------------------------------------------------------------
# PASO 1: Crear el bucket S3 con la ubicacion correcta
# ------------------------------------------------------------
Write-Host "[1/5] Creando bucket S3..." -ForegroundColor Yellow

aws s3api create-bucket `
  --bucket $BUCKET_NAME `
  --region $AWS_REGION `
  --create-bucket-configuration LocationConstraint=$AWS_REGION `
  --profile $Profile

if ($LASTEXITCODE -ne 0) {
  Write-Host "AVISO: El bucket puede que ya exista (si ya fue creado por otro integrante del equipo)." -ForegroundColor Yellow
  Write-Host "       Continuando con los siguientes pasos..." -ForegroundColor Yellow
}
else {
  Write-Host "OK: Bucket creado." -ForegroundColor Green
}

# ------------------------------------------------------------
# PASO 2: Habilitar versionamiento en el bucket
# Permite recuperar versiones anteriores del tfstate si algo sale mal.
# ------------------------------------------------------------
Write-Host "[2/5] Habilitando versionamiento en el bucket..." -ForegroundColor Yellow

aws s3api put-bucket-versioning `
  --bucket $BUCKET_NAME `
  --versioning-configuration Status=Enabled `
  --profile $Profile

if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: No se pudo habilitar el versionamiento." -ForegroundColor Red
  exit 1
}
Write-Host "OK: Versionamiento habilitado." -ForegroundColor Green

# ------------------------------------------------------------
# PASO 3: Bloquear acceso publico al bucket
# El tfstate puede contener informacion sensible (endpoints, ARNs).
# Nunca debe ser publico.
# ------------------------------------------------------------
Write-Host "[3/5] Bloqueando acceso publico al bucket..." -ForegroundColor Yellow

aws s3api put-public-access-block `
  --bucket $BUCKET_NAME `
  --public-access-block-configuration `
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
  --profile $Profile

if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: No se pudo bloquear el acceso publico." -ForegroundColor Red
  exit 1
}
Write-Host "OK: Acceso publico bloqueado." -ForegroundColor Green

# ------------------------------------------------------------
# NOTA: Cifrado SSE-S3 omitido intencionalmente.
# Desde abril 2023, AWS habilita SSE-S3 automaticamente en
# todos los buckets nuevos. No es necesario configurarlo.
# ------------------------------------------------------------
Write-Host "[4/5] Cifrado SSE-S3: habilitado por defecto en AWS (desde 2023)." -ForegroundColor Green

# ------------------------------------------------------------
# PASO 4 (antes 5): Crear la tabla DynamoDB para el bloqueo del estado
# La clave primaria DEBE llamarse "LockID" (requerido por Terraform).
# Usamos PAY_PER_REQUEST para no pagar capacidad reservada innecesaria.
# ------------------------------------------------------------
Write-Host "[5/5] Creando tabla DynamoDB para locks..." -ForegroundColor Yellow

aws dynamodb create-table `
  --table-name $TABLE_NAME `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $AWS_REGION `
  --profile $Profile

if ($LASTEXITCODE -ne 0) {
  Write-Host "AVISO: La tabla puede que ya exista (si ya fue creada por otro integrante del equipo)." -ForegroundColor Yellow
  Write-Host "       Esto es normal si el bootstrap ya fue ejecutado antes." -ForegroundColor Yellow
}
else {
  Write-Host "OK: Tabla DynamoDB creada." -ForegroundColor Green
}

# ------------------------------------------------------------
# RESULTADO FINAL
# ------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Backend listo!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host "  1. Copia el archivo terraform.tfvars.example y renombralo a terraform.tfvars"
Write-Host "  2. Edita terraform.tfvars y pon tu perfil AWS: aws_profile = `"$Profile`""
Write-Host "  3. Ejecuta: cd infra/terraform"
Write-Host "  4. Ejecuta: terraform init"
Write-Host "  5. Ejecuta: terraform plan"
Write-Host ""
