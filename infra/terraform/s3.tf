# ============================================================
# AMAZON S3 - TICKETGO AWS
# ============================================================
# Almacena el frontend estático (React/Vite) que será
# servido a través de CloudFront.
#
# Configuración:
#   - Bucket privado (sin acceso público directo)
#   - Acceso exclusivo via CloudFront OAC (Origin Access Control)
#   - Versionado habilitado con políticas de ciclo de vida (Checkov)
#   - Cifrado en reposo predeterminado habilitado (Checkov)
#   - Bloqueo total de acceso público
#
# Costo: Free Tier incluye 5 GB de almacenamiento S3 Standard.
# ============================================================

# ============================================================
# S3 BUCKET - FRONTEND ESTÁTICO
# ============================================================
# Bucket privado que almacena los archivos compilados del
# frontend React (HTML, CSS, JS, imágenes).
resource "aws_s3_bucket" "ticketgo_frontend" {
  bucket = "ticketgo-frontend-${var.aws_account_id}"

  tags = {
    Name = "ticketgo-frontend"
  }
}

# ============================================================
# CIFRADO EN REPOSO PREDETERMINADO
# ============================================================
# Habilita el cifrado AES-256 administrado por S3 (SSE-S3).
# Resuelve CKV_AWS_145 de forma gratuita.
resource "aws_s3_bucket_server_side_encryption_configuration" "ticketgo_frontend_encryption" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================
# VERSIONADO DE ARCHIVOS
# ============================================================
# Habilita el versionado de objetos para recuperacion ante borrados.
# Resuelve CKV_AWS_21.
resource "aws_s3_bucket_versioning" "ticketgo_frontend_versioning" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ============================================================
# POLÍTICA DE CICLO DE VIDA (LIFECYCLE)
# ============================================================
# Controla el costo del versionado eliminando versiones antiguas
# no actuales después de 14 días. Resuelve CKV2_AWS_61.
resource "aws_s3_bucket_lifecycle_configuration" "ticketgo_frontend_lifecycle" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 14
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.ticketgo_frontend_versioning]
}

# ============================================================
# BLOQUEO DE ACCESO PÚBLICO
# ============================================================
# Bloquea cualquier intento de hacer público el bucket.
# El frontend solo se sirve a través de CloudFront.
resource "aws_s3_bucket_public_access_block" "ticketgo_frontend" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================
# BUCKET POLICY - ACCESO EXCLUSIVO DESDE CLOUDFRONT
# ============================================================
# Solo permite que CloudFront (via OAC) lea los objetos del bucket.
# Ningún otro servicio o usuario puede acceder directamente.
resource "aws_s3_bucket_policy" "ticketgo_frontend" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.ticketgo_frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.ticketgo_cdn.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.ticketgo_frontend]
}
