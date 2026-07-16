# Bootstrap — Terraform Remote Backend

Este directorio contiene el script de inicialización que **debe ejecutarse una sola vez por equipo**
antes de comenzar a usar Terraform en este proyecto.

## ¿Para qué sirve?

Crea los recursos AWS necesarios para guardar el estado de Terraform de forma remota y segura:

| Recurso | Nombre | Propósito |
|---|---|---|
| S3 Bucket | `ticketgo-terraform-state-783111403254-us-east-2` | Almacena el archivo `terraform.tfstate` |
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

### Paso 5 — Crear el acceso OIDC inicial para GitHub Actions

GitHub Actions no puede crear su propio rol antes de autenticarse. Por eso, un administrador de la cuenta compartida debe ejecutar una sola vez:

```powershell
cd infra/terraform
terraform apply `
  -target=aws_iam_role_policy_attachment.github_actions_power_user `
  -target=aws_iam_role_policy.github_actions_iam_policy
```

Este comando crea el proveedor OIDC, el rol `ticketgo-github-actions-role` y sus políticas. Después, obtén el ARN:

```powershell
terraform output github_actions_role_arn
```

Guarda el resultado en GitHub como `AWS_ROLE_ARN`:

```text
Settings → Secrets and variables → Actions → New repository secret
```

No se deben guardar Access Keys ni contraseñas de usuarios IAM en GitHub.

### Paso 6 — Proteger el Apply con un Environment

Crea el Environment `aws-demo` en GitHub:

```text
Settings → Environments → New environment → aws-demo
```

Configura al menos un aprobador en `Required reviewers`. El workflow generará primero un plan y esperará la aprobación antes de ejecutar exactamente ese plan.

## ⚠️ Importante

- El script es **idempotente**: si ya existe el bucket o la tabla, avisa pero continúa sin fallar.
- El bucket S3 y la tabla DynamoDB **no se destruyen** con `terraform destroy`,
  ya que no son gestionados por Terraform (son la base del estado).
- El archivo `terraform.tfvars` **no se sube al repositorio** (está en `.gitignore`). Cada integrante lo crea localmente.
- La cuenta AWS oficial del proyecto es `783111403254`.
- El workflow Terraform se ejecuta manualmente; un merge a `main` ya no aplica infraestructura automáticamente.
