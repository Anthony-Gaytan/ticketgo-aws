# ============================================================
# AWS BACKUP - TICKETGO AWS
# ============================================================
# Servicio de backup centralizado que protege los datos
# de RDS PostgreSQL con copias de seguridad automatizadas.
#
# Configuración:
#   - Backup Vault: ticketgo-backup-vault
#   - Backup Plan: Backup diario a las 03:00 UTC
#   - Retención: 7 días
#   - Backup Selection: RDS PostgreSQL
#   - IAM Role: Permisos para que Backup acceda a RDS
#
# Costo: Solo cobra por el almacenamiento de backups.
# Con 20 GB de RDS: ~$0.10/mes (despreciable).
# ============================================================

# ============================================================
# IAM ROLE PARA AWS BACKUP
# ============================================================
# Permite que el servicio AWS Backup acceda a los recursos
# de RDS para crear y restaurar snapshots.
resource "aws_iam_role" "backup_role" {
  name = "ticketgo-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ticketgo-backup-role"
  }
}

# Política administrada de AWS para operaciones de backup
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# ============================================================
# BACKUP VAULT
# ============================================================
# Almacén seguro donde se guardan los puntos de recuperación.
resource "aws_backup_vault" "ticketgo_vault" {
  name        = "ticketgo-backup-vault"
  kms_key_arn = aws_kms_key.ticketgo_key.arn

  tags = {
    Name = "ticketgo-backup-vault"
  }
}

# ============================================================
# BACKUP PLAN - DIARIO A LAS 03:00 UTC
# ============================================================
# Ejecuta un backup automático cada día a las 3:00 AM UTC.
# Los backups se retienen durante 7 días y luego se eliminan.
resource "aws_backup_plan" "ticketgo_plan" {
  name = "ticketgo-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.ticketgo_vault.name
    schedule          = "cron(0 3 * * ? *)"

    lifecycle {
      delete_after = 7
    }
  }

  tags = {
    Name = "ticketgo-backup-plan"
  }
}

# ============================================================
# BACKUP SELECTION - RDS POSTGRESQL
# ============================================================
# Selecciona la instancia RDS como recurso a respaldar
# según el plan de backup diario definido arriba.
resource "aws_backup_selection" "ticketgo_rds" {
  name         = "ticketgo-rds-selection"
  plan_id      = aws_backup_plan.ticketgo_plan.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_db_instance.ticketgo_db.arn
  ]
}
