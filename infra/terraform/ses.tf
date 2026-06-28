# ============================================================
# AMAZON SES - TICKETGO AWS
# ============================================================
# Simple Email Service para enviar notificaciones por correo
# cuando se genera una compra o ticket.
#
# Flujo: SQS → Lambda → SES → Usuario
#
# Configuración:
#   - Email Identity verificada (modo sandbox)
#   - En sandbox solo se puede enviar a emails verificados
#   - Para producción se solicita salir de sandbox a AWS
#
# Costo: Free Tier incluye 62,000 emails/mes si se envían
# desde EC2/Lambda. Fuera de Free Tier: $0.10/1,000 emails.
# ============================================================

# ============================================================
# SES EMAIL IDENTITY
# ============================================================
# Verifica la dirección de correo electrónico del remitente.
# AWS enviará un email de verificación al crear este recurso.
# Mientras SES esté en modo sandbox, solo se pueden enviar
# correos a direcciones verificadas.
resource "aws_ses_email_identity" "ticketgo_sender" {
  email = var.ses_email_identity
}
