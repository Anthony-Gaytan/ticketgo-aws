# ============================================================
# AWS BACKUP - TICKETGO AWS (Fase 7)
# ============================================================
# Servicio de backup centralizado que protege los datos
# de RDS PostgreSQL con copias de seguridad automatizadas.
#
# Configuración planificada:
#   - Backup Vault: ticketgo-backup-vault
#   - Backup Plan: Backup diario a las 03:00 UTC
#   - Retención: 7 días
#   - Backup Selection: RDS PostgreSQL
#   - IAM Role: Permisos para que Backup acceda a RDS
#
# NOTA: Esta fase requiere que RDS exista (Fase 4).
# Se puede desplegar junto con RDS para la demostración final.
#
# Costo: Solo cobra por el almacenamiento de backups.
# Con 20 GB de RDS: ~$0.10/mes (despreciable).
# ============================================================
