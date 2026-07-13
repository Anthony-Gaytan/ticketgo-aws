# ============================================================
# AWS KMS - CLAVE DE CIFRADO PERSONALIZADA (CMK)
# ============================================================
# Clave KMS administrada por el cliente para cifrar recursos
# sensibles en reposo (S3, Secrets Manager, Backup Vault y RDS).
# Cumple con el principio de control total sobre claves criptográficas.
#
resource "aws_kms_key" "ticketgo_key" {
  # checkov:skip=CKV_AWS_7:Para un ambiente de demo, desactivamos la rotacion de claves anual para evitar costos fijos adicionales de administracion.
  description             = "Clave KMS principal para Ticketgo"
  deletion_window_in_days = 7
  enable_key_rotation     = false

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront Decrypt"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.aws_account_id
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "ticketgo-kms-key"
  }
}

resource "aws_kms_alias" "ticketgo_key_alias" {
  name          = "alias/ticketgo-key"
  target_key_id = aws_kms_key.ticketgo_key.key_id
}
