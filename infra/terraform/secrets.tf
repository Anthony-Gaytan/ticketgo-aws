# ============================================================
# AWS SECRETS MANAGER - TICKETGO AWS
# ============================================================
# Almacena de forma segura las credenciales sensibles:
#   - Connection string de PostgreSQL
#   - JWT Secret Key
#
# ECS Fargate leerá los secretos al iniciar el contenedor,
# inyectándolos como variables de entorno seguras.
#
# NOTA: Los valores de los secretos NO se definen en Terraform
# para evitar que queden en el tfstate. Se poblan manualmente
# después del apply con AWS CLI o la consola de AWS.
#
# Costo: $0.40/mes por secreto + $0.05/10,000 API calls.
# ============================================================

# ============================================================
# SECRETO - CREDENCIALES DE BASE DE DATOS
# ============================================================
# Almacena la connection string de PostgreSQL que ECS
# inyectará como variable de entorno al contenedor.
resource "aws_secretsmanager_secret" "ticketgo_db_credentials" {
  # checkov:skip=CKV2_AWS_57:Para un ambiente de demo, la rotacion automatica de secretos no esta habilitada para evitar la complejidad y costos asociados de desplegar Lambdas de rotacion y dependencias de red.
  name                    = "ticketgo/db-credentials"
  description             = "Connection string de RDS PostgreSQL para la API"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.ticketgo_key.arn

  tags = {
    Name = "ticketgo-db-credentials"
  }
}

# ============================================================
# SECRETO - CLAVE JWT
# ============================================================
# Almacena la clave secreta utilizada para firmar y validar
# los tokens JWT de autenticación.
resource "aws_secretsmanager_secret" "ticketgo_jwt_secret" {
  # checkov:skip=CKV2_AWS_57:Para un ambiente de demo, la rotacion automatica de secretos no esta habilitada para evitar la complejidad y costos asociados de desplegar Lambdas de rotacion y dependencias de red.
  name                    = "ticketgo/jwt-secret"
  description             = "Clave secreta para firma de tokens JWT"
  recovery_window_in_days = 0
  kms_key_id              = aws_kms_key.ticketgo_key.arn

  tags = {
    Name = "ticketgo-jwt-secret"
  }
}
