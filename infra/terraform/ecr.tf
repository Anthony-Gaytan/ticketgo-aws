# ============================================================
# AMAZON ECR - TICKETGO AWS
# ============================================================
# ECR (Elastic Container Registry) almacena las imágenes Docker
# del backend .NET 8. ECS Fargate descarga la imagen desde
# este repositorio para ejecutar la API.
#
# scan_on_push habilitado para detectar vulnerabilidades
# automáticamente al subir una nueva imagen.
#
# image_tag_mutability MUTABLE permite reusar tags como "v1"
# durante desarrollo. En producción se recomienda IMMUTABLE.
# ============================================================

# ============================================================
# AMAZON ECR - REPOSITORIO DE IMÁGENES DOCKER
# ============================================================
# ECR almacenará la imagen Docker del backend .NET 8.
# Luego ECS Fargate descargará esta imagen para ejecutar la API.
resource "aws_ecr_repository" "ticketgo_api" {
  name                 = "ticketgo-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "ticketgo-api"
  }
}
