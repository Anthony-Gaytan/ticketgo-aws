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
  required_version = ">= 1.14.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# ============================================================
# PROVIDER PRINCIPAL - REGIÓN DEL PROYECTO
# ============================================================
provider "aws" {
  region  = var.aws_region
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
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
