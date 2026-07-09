# Bootstrap — Terraform Remote Backend

Este directorio contiene el script de inicialización que **debe ejecutarse una sola vez por equipo**
antes de comenzar a usar Terraform en este proyecto.

## ¿Para qué sirve?

Crea los recursos AWS necesarios para guardar el estado de Terraform de forma remota y segura:

| Recurso | Nombre | Propósito |
|---|---|---|
| S3 Bucket | `ticketgo-terraform-state-329871097383` | Almacena el archivo `terraform.tfstate` |
| DynamoDB Table | `ticketgo-terraform-locks` | Evita conflictos si dos personas aplican al mismo tiempo |

## Para el equipo (3 integrantes)

Solo **un integrante** necesita ejecutar este script. Una vez creados los recursos en AWS, los demás no necesitan volver a ejecutarlo.

### Paso 1 — Ver tu perfil de AWS CLI

```powershell
aws configure list-profiles
```

### Paso 2 — Ejecutar el bootstrap (solo una vez por equipo)

```powershell
# Desde la raíz del proyecto, pasando tu perfil como parámetro
.\infra\bootstrap\setup-backend.ps1 -Profile "tu-perfil-aws"
```

### Paso 3 — Configurar tu terraform.tfvars (cada integrante)

Copia el archivo de ejemplo y edítalo con tus datos:

```powershell
# Desde la carpeta infra/terraform/
copy terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` y cambia `TU-PERFIL-AWS` por tu perfil real de AWS CLI.

### Paso 4 — Inicializar Terraform (cada integrante)

```powershell
cd infra/terraform
terraform init    # Conecta automáticamente al backend remoto en S3
terraform plan
```

## ⚠️ Importante

- El script es **idempotente**: si ya existe el bucket o la tabla, avisa pero continúa sin fallar.
- El bucket S3 y la tabla DynamoDB **no se destruyen** con `terraform destroy`,
  ya que no son gestionados por Terraform (son la base del estado).
- El archivo `terraform.tfvars` **no se sube al repositorio** (está en `.gitignore`). Cada integrante lo crea localmente.
