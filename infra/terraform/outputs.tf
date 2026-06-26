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
