# ============================================================
# CLOUDWATCH LOG GROUPS - TICKETGO AWS
# ============================================================
# Centraliza la configuración de todos los Log Groups
# de CloudWatch del proyecto.
# Cada servicio que genera logs tiene su propio Log Group
# con una retención definida por var.log_retention_days.
#
# Log Groups:
#   1. /ecs/ticketgo-api → Logs del contenedor de la API
#   2. /aws/lambda/ticketgo-notification-processor → Logs de Lambda
# ============================================================

# ============================================================
# CLOUDWATCH LOG GROUP PARA LA API (ECS)
# ============================================================
# Aquí se almacenarán los logs del contenedor cuando ECS ejecute la API.
# La retención de 7 días es suficiente para debugging en desarrollo.
resource "aws_cloudwatch_log_group" "ticketgo_api_logs" {
  name              = "/ecs/ticketgo-api"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "ticketgo-api-logs"
  }
}

# ============================================================
# CLOUDWATCH LOG GROUP PARA LAMBDA
# ============================================================
# Almacena los logs de ejecución de la función Lambda
# que procesa notificaciones desde SQS.
resource "aws_cloudwatch_log_group" "ticketgo_lambda_logs" {
  name              = "/aws/lambda/ticketgo-notification-processor"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "ticketgo-lambda-logs"
  }
}
