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

# ============================================================
# CLOUDWATCH ALARMS - MONITOREO OPERACIONAL
# ============================================================
# Alarmas que alertan sobre problemas operacionales críticos.
# Sin SNS Topic asociado por ahora; las alarmas son visibles
# en la consola de CloudWatch y pueden integrarse con SNS
# en fases futuras para enviar notificaciones.

# Alarma: mensajes en la DLQ (notificaciones fallidas)
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "ticketgo-dlq-has-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "La DLQ tiene mensajes no procesados - revisar errores en Lambda"

  dimensions = {
    QueueName = aws_sqs_queue.ticketgo_notifications_dlq.name
  }

  tags = {
    Name = "ticketgo-dlq-alarm"
  }
}

# Alarma: errores en la función Lambda
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "ticketgo-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "La funcion Lambda de notificaciones tiene errores de ejecucion"

  dimensions = {
    FunctionName = aws_lambda_function.ticketgo_notification_processor.function_name
  }

  tags = {
    Name = "ticketgo-lambda-errors-alarm"
  }
}

