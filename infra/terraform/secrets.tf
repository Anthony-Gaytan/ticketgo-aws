# ============================================================
# AWS SECRETS MANAGER - TICKETGO AWS (Fase 3)
# ============================================================
# Almacena de forma segura las credenciales sensibles:
#   - Connection string de PostgreSQL
#   - JWT Secret Key
#
# ECS Fargate leerá los secretos al iniciar el contenedor,
# inyectándolos como variables de entorno.
#
# Configuración planificada:
#   - Secret con JSON conteniendo las credenciales
#   - IAM Policy para que ECS Task Execution Role acceda
#   - Rotación automática deshabilitada (para demo)
#
# Costo: $0.40/mes por secreto + $0.05/10,000 API calls.
# ============================================================
