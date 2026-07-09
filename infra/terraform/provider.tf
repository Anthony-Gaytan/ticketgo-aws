# ============================================================
# PROVEEDOR AWS - TICKETGO
# ============================================================
# Configura el provider de AWS con la región y el perfil local.
# La región se obtiene de variables.tf para mantener consistencia
# con el resto de la configuración del proyecto.
# El perfil AWS CLI es configurable por desarrollador.
#
# Se definen tags globales automáticos para que todos los
# recursos creados tengan trazabilidad de proyecto, ambiente
# y herramienta de gestión.
# ============================================================

terraform {
  required_version = ">= 1.13.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # ============================================================
  # BACKEND REMOTO - ESTADO EN S3
  # ============================================================
  # Almacena el terraform.tfstate en S3 para que el estado sea
  # compartido y no quede atado a una sola máquina.
  #
  # El bucket y la tabla DynamoDB deben crearse ANTES del primer
  # terraform init, ejecutando:
  #   .\infra\bootstrap\setup-backend.ps1
  #
  # NOTA: El bloque backend no acepta variables de Terraform.
  # Los valores están escritos directamente aquí de forma intencional.
  # ============================================================
  backend "s3" {
    bucket         = "ticketgo-terraform-state-329871097383"
    key            = "terraform/ticketgo.tfstate"
    region         = "us-east-2"
    # profile        = "anthony-admi" # Comentado para soportar múltiples perfiles en el equipo
    dynamodb_table = "ticketgo-terraform-locks"
    encrypt        = true
  }
}

# ============================================================
# PROVIDER PRINCIPAL - REGIÓN DEL PROYECTO
# ============================================================
provider "aws" {
  region  = var.aws_region
  # profile se define solo en local (via terraform.tfvars).
  # En GitHub Actions con OIDC se omite (null) para usar las credenciales del entorno.
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ============================================================
# PROVIDER ALIAS - US-EAST-1 (requerido por WAF + CloudFront)
# ============================================================
# AWS WAF para CloudFront debe crearse obligatoriamente en
# us-east-1. Este provider alias permite crear recursos en
# esa región sin afectar el resto de la infraestructura.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  # profile se define solo en local (via terraform.tfvars).
  # En GitHub Actions con OIDC se omite (null) para usar las credenciales del entorno.
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
