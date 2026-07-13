# ============================================================
# PROCESAMIENTO ASÍNCRONO (SQS) - TICKETGO AWS
# ============================================================
# Amazon SQS desacopla el procesamiento de notificaciones
# del flujo principal de la API.
#
# Flujo: API → SQS Queue → Lambda → SES (email)
#
# La Dead Letter Queue (DLQ) captura mensajes que fallan
# después de 3 intentos, evitando pérdida de datos y
# permitiendo investigar errores.
#
# Seguridad: Ambas colas tienen encriptación en reposo
# habilitada con SSE-SQS (clave administrada por AWS, sin costo).
# Esto cumple con AWS Well-Architected Framework SEC09-BP01
# y satisface el check de seguridad CKV_AWS_27.
#
# Costo: Free Tier incluye 1 millón de mensajes SQS gratis.
# ============================================================

# ============================================================
# SQS - DEAD LETTER QUEUE
# ============================================================
# Captura mensajes que no pudieron ser procesados después
# de maxReceiveCount intentos. Permite debugging y reproceso.
resource "aws_sqs_queue" "ticketgo_notifications_dlq" {
  name = "ticketgo-notifications-dlq"

  # Encriptación en reposo con clave administrada por SQS (SSE-SQS)
  # Cumple CKV_AWS_27 
  sqs_managed_sse_enabled = true

  tags = {
    Name = "ticketgo-notifications-dlq"
  }
}

# ============================================================
# SQS - COLA DE NOTIFICACIONES
# ============================================================
# Cola principal que recibe mensajes de la API cuando se
# genera una compra o ticket. Lambda procesa estos mensajes
# para enviar notificaciones por email.
# Si un mensaje falla 3 veces, se mueve automáticamente a la DLQ.
resource "aws_sqs_queue" "ticketgo_notifications" {
  name = "ticketgo-notifications"

  # Encriptación en reposo con clave administrada por SQS (SSE-SQS)
  # Cumple CKV_AWS_27 
  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ticketgo_notifications_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "ticketgo-notifications"
  }
}
