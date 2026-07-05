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
  description = "Perfil de AWS CLI a usar. Cada integrante define el suyo en terraform.tfvars (no se sube al repo)."
  type        = string
}

variable "aws_account_id" {
  description = "ID de la cuenta AWS"
  type        = string
  default     = "329871097383"
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
  default     = false
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
