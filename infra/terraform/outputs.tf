# ============================================================
# OUTPUTS - TICKETGO AWS
# ============================================================
# Valores de salida útiles para validación después de
# terraform apply. Permiten verificar rápidamente que los
# recursos se crearon correctamente.
# ============================================================

# ------------------------------------------------------------
# RED
# ------------------------------------------------------------

output "vpc_id" {
  description = "ID de la VPC principal"
  value       = aws_vpc.ticketgo_vpc.id
}

output "public_subnet_ids" {
  description = "IDs de las subredes públicas"
  value = [
    aws_subnet.public_az1.id,
    aws_subnet.public_az2.id
  ]
}

output "private_app_subnet_ids" {
  description = "IDs de las subredes privadas de aplicación"
  value = [
    aws_subnet.private_app_az1.id,
    aws_subnet.private_app_az2.id
  ]
}

output "private_data_subnet_ids" {
  description = "IDs de las subredes privadas de datos"
  value = [
    aws_subnet.private_data_az1.id,
    aws_subnet.private_data_az2.id
  ]
}

# ------------------------------------------------------------
# ALB
# ------------------------------------------------------------

output "alb_dns_name" {
  description = "DNS público del Application Load Balancer"
  value       = aws_lb.ticketgo_alb.dns_name
}

output "alb_url" {
  description = "URL completa para acceder a la API via ALB"
  value       = "http://${aws_lb.ticketgo_alb.dns_name}/health"
}

# ------------------------------------------------------------
# ECR
# ------------------------------------------------------------

output "ecr_repository_url" {
  description = "URL del repositorio ECR para push de imágenes Docker"
  value       = aws_ecr_repository.ticketgo_api.repository_url
}

# ------------------------------------------------------------
# ECS
# ------------------------------------------------------------

output "ecs_cluster_name" {
  description = "Nombre del cluster ECS"
  value       = aws_ecs_cluster.ticketgo_cluster.name
}

output "ecs_service_name" {
  description = "Nombre del servicio ECS"
  value       = aws_ecs_service.ticketgo_api_service.name
}

# ------------------------------------------------------------
# PROCESAMIENTO ASÍNCRONO
# ------------------------------------------------------------

output "sqs_queue_url" {
  description = "URL de la cola SQS de notificaciones"
  value       = aws_sqs_queue.ticketgo_notifications.url
}

output "sqs_dlq_url" {
  description = "URL de la Dead Letter Queue"
  value       = aws_sqs_queue.ticketgo_notifications_dlq.url
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda"
  value       = aws_lambda_function.ticketgo_notification_processor.function_name
}

# ------------------------------------------------------------
# BASE DE DATOS
# ------------------------------------------------------------

output "rds_endpoint" {
  description = "Endpoint de conexión a RDS PostgreSQL"
  value       = aws_db_instance.ticketgo_db.endpoint
}

output "rds_db_name" {
  description = "Nombre de la base de datos"
  value       = aws_db_instance.ticketgo_db.db_name
}

# ------------------------------------------------------------
# SEGURIDAD
# ------------------------------------------------------------

output "secrets_db_arn" {
  description = "ARN del secreto de credenciales de base de datos"
  value       = aws_secretsmanager_secret.ticketgo_db_credentials.arn
}

output "secrets_jwt_arn" {
  description = "ARN del secreto de clave JWT"
  value       = aws_secretsmanager_secret.ticketgo_jwt_secret.arn
}

# ------------------------------------------------------------
# FRONTEND (CDN)
# ------------------------------------------------------------

output "cloudfront_domain" {
  description = "Dominio de CloudFront para acceder al frontend"
  value       = aws_cloudfront_distribution.ticketgo_cdn.domain_name
}

output "cloudfront_url" {
  description = "URL completa del frontend"
  value       = "https://${aws_cloudfront_distribution.ticketgo_cdn.domain_name}"
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3 del frontend"
  value       = aws_s3_bucket.ticketgo_frontend.id
}

# ------------------------------------------------------------
# IAM / CI-CD
# ------------------------------------------------------------

output "github_actions_role_arn" {
  description = "ARN del rol OIDC de GitHub Actions. Copiar este valor como secreto AWS_ROLE_ARN en el repositorio de GitHub."
  value       = aws_iam_role.github_actions_role.arn
}

output "cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront (necesario para invalidar caché en el deploy del frontend)"
  value       = aws_cloudfront_distribution.ticketgo_cdn.id
}
