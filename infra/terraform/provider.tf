# ============================================================
# PROVEEDOR AWS - TICKETGO
# ============================================================
# Configura el provider de AWS con la región y el perfil local.
# La región se obtiene de variables.tf para mantener consistencia
# con el resto de la configuración del proyecto.
# El perfil AWS CLI es local y específico de cada desarrollador.

terraform {
  required_version = ">= 1.14.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "anthony-admi"
}
