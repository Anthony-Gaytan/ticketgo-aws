# ============================================================
# AMAZON SES - TICKETGO AWS (Fase 6)
# ============================================================
# Simple Email Service para enviar notificaciones por correo
# cuando se genera una compra o ticket.
#
# Flujo: SQS → Lambda → SES → Usuario
#
# Configuración planificada:
#   - Email Identity verificada (modo sandbox)
#   - En sandbox solo se puede enviar a emails verificados
#   - Para producción se solicita salir de sandbox a AWS
#
# Costo: Free Tier incluye 62,000 emails/mes si se envían
# desde EC2/Lambda. Fuera de Free Tier: $0.10/1,000 emails.
# ============================================================
