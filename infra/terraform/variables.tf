# ============================================================
# VARIABLES CENTRALES - TICKETGO AWS
# ============================================================
# Todas las variables reutilizables del proyecto están aquí.
# Los valores por defecto corresponden al ambiente de
# desarrollo y demostración académica.
# ============================================================

# ------------------------------------------------------------
# GENERAL
# ------------------------------------------------------------

variable "aws_region" {
  description = "Región AWS donde se despliegan los recursos"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "Perfil de AWS CLI a usar. Cada integrante define el suyo en terraform.tfvars (no se sube al repo). En CI/CD con OIDC se deja vacío (null)."
  type        = string
  default     = null
}

variable "aws_account_id" {
  description = "ID de la cuenta AWS"
  type        = string
  default     = "783111403254"
}

variable "project_name" {
  description = "Nombre del proyecto, usado como prefijo en nombres de recursos"
  type        = string
  default     = "ticketgo"
}

variable "environment" {
  description = "Ambiente de despliegue (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ------------------------------------------------------------
# RED (network.tf)
# ------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block principal de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ------------------------------------------------------------
# CONTENEDOR Y ECS (ecs.tf)
# ------------------------------------------------------------

variable "container_port" {
  description = "Puerto en el que escucha el contenedor de la API"
  type        = number
  default     = 8080
}

variable "ecr_image_tag" {
  description = "Tag de la imagen Docker en ECR"
  type        = string
  default     = "v1"
}

variable "ecs_cpu" {
  description = "CPU para la tarea ECS Fargate (256 = 0.25 vCPU)"
  type        = string
  default     = "256"
}

variable "ecs_memory" {
  description = "Memoria para la tarea ECS Fargate en MB"
  type        = string
  default     = "512"
}

variable "ecs_max_capacity" {
  description = "Cantidad maxima de tareas ECS permitida por Auto Scaling"
  type        = number
  default     = 3
}

# ------------------------------------------------------------
# LAMBDA (lambda.tf)
# ------------------------------------------------------------

variable "lambda_runtime" {
  description = "Runtime de la función Lambda"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory" {
  description = "Memoria asignada a la función Lambda en MB"
  type        = number
  default     = 128
}

variable "lambda_timeout" {
  description = "Timeout de la función Lambda en segundos"
  type        = number
  default     = 10
}

variable "enable_lambda_reserved_concurrency" {
  description = "Habilitar reserved concurrency en Lambda. Para cuentas demo puede deshabilitarse para evitar limites de concurrencia no reservada."
  type        = bool
  default     = false
}

# ------------------------------------------------------------
# OBSERVABILIDAD (cloudwatch.tf)
# ------------------------------------------------------------

variable "log_retention_days" {
  description = "Días de retención de logs en CloudWatch"
  type        = number
  default     = 7
}

# ------------------------------------------------------------
# BASE DE DATOS - Fase 4 (rds.tf)
# ------------------------------------------------------------

variable "db_instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Almacenamiento inicial de RDS en GiB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Limite de autoescalado de almacenamiento de RDS en GiB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Nombre de la base de datos PostgreSQL"
  type        = string
  default     = "ticketgo_db"
}

variable "db_username" {
  description = "Usuario administrador de la base de datos"
  type        = string
  default     = "ticketgo_admin"
}

variable "rds_multi_az" {
  description = "Habilitar Multi-AZ para RDS (duplica el costo)"
  type        = bool
  default     = true
}

variable "rds_backup_retention_days" {
  description = "Dias de retencion de backups automaticos de RDS"
  type        = number
  default     = 7
}

variable "rds_skip_final_snapshot" {
  description = "Omitir el snapshot final al eliminar RDS. Debe ser false en produccion."
  type        = bool
  default     = true
}

variable "rds_final_snapshot_identifier" {
  description = "Nombre del snapshot final utilizado al eliminar RDS"
  type        = string
  default     = "ticketgo-db-final-snapshot"
}

# ------------------------------------------------------------
# EMAIL - Fase 6 (ses.tf)
# ------------------------------------------------------------

variable "ses_email_identity" {
  description = "Dirección de correo para verificar en SES"
  type        = string
  default     = ""
}

# ------------------------------------------------------------
# PROTECCIÓN DE BORRADO - Checkov (rds.tf / alb.tf)
# ------------------------------------------------------------

variable "rds_deletion_protection" {
  description = "Habilitar proteccion contra eliminacion de la base de datos RDS"
  type        = bool
  default     = true
}

variable "alb_deletion_protection" {
  description = "Habilitar proteccion contra eliminacion del Application Load Balancer"
  type        = bool
  default     = false
}

# ------------------------------------------------------------
# DEMO/STAGING BOOTSTRAP AND FINOPS CONFIG
# ------------------------------------------------------------

variable "enable_waf" {
  description = "Habilitar AWS WAFv2 para la distribucion de CloudFront"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Habilitar CloudFront para servir el frontend. En cuentas AWS no verificadas puede dejarse en false y usar S3 static website para demo."
  type        = bool
  default     = false
}

variable "ecs_desired_count" {
  description = "Cantidad deseada de tareas ECS corriendo. Inicialmente 0 para permitir subir la imagen a ECR primero."
  type        = number
  default     = 0
}

variable "auto_migrate_database" {
  description = "Habilitar la ejecucion automatica de migraciones EF Core al iniciar el contenedor de ECS"
  type        = string
  default     = "true"
}

# ------------------------------------------------------------
# DOMINIO PROPIO Y CERTIFICADOS SSL (route53.tf / acm.tf)
# ------------------------------------------------------------

variable "domain_name" {
  description = "Nombre de dominio propio del proyecto (ej. ticketgo-aws.online)"
  type        = string
  default     = "ticketgo-aws.online"
}

variable "enable_custom_domain" {
  description = "Habilitar Route 53 + ACM + HTTPS con dominio propio. Requiere que los nameservers de Namecheap ya apunten a Route 53 antes de validar los certificados."
  type        = bool
  default     = false
}
