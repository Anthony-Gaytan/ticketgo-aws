# ============================================================
# AWS LAMBDA - TICKETGO AWS
# ============================================================
# La función Lambda procesa mensajes de la cola SQS
# para generar notificaciones (email via SES en Fase 6).
#
# Flujo: SQS → Lambda (Event Source Mapping) → SES
#
# Runtime: Node.js 20.x
# Memoria: 128 MB (mínimo, suficiente para procesamiento de texto)
# Timeout: 10 segundos
#
# El código fuente está en lambda/index.mjs y se empaqueta
# como ZIP para el despliegue.
#
# Costo: Free Tier incluye 1 millón de invocaciones gratis
# y 400,000 GB-segundos de cómputo al mes.
# ============================================================

# ============================================================
# FUNCIÓN LAMBDA - PROCESADOR DE NOTIFICACIONES
# ============================================================
# Lee mensajes de SQS y los procesa. Actualmente es una
# función demo que loguea los mensajes recibidos.
# En fases posteriores integrará SES para enviar emails.
resource "aws_lambda_function" "ticketgo_notification_processor" {
  function_name = "ticketgo-notification-processor"
  role          = aws_iam_role.lambda_execution_role.arn
  runtime       = var.lambda_runtime
  handler       = "index.handler"

  filename         = "${path.module}/lambda/ticketgo-notification-processor.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/ticketgo-notification-processor.zip")

  timeout                        = var.lambda_timeout
  memory_size                    = var.lambda_memory
  reserved_concurrent_executions = 5

  environment {
    variables = {
      SES_SENDER_EMAIL = var.ses_email_identity
      AWS_SES_REGION   = var.aws_region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.ticketgo_lambda_logs
  ]

  tags = {
    Name = "ticketgo-notification-processor"
  }
}

# ============================================================
# EVENT SOURCE MAPPING - SQS → LAMBDA
# ============================================================
# Conecta la cola SQS con la función Lambda.
# Cada vez que llega un mensaje a la cola, Lambda se invoca
# automáticamente para procesarlo.
# batch_size = 1 procesa un mensaje a la vez (ideal para demo).
resource "aws_lambda_event_source_mapping" "ticketgo_sqs_trigger" {
  event_source_arn = aws_sqs_queue.ticketgo_notifications.arn
  function_name    = aws_lambda_function.ticketgo_notification_processor.arn
  batch_size       = 1
  enabled          = true
}
