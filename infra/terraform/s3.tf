# ============================================================
# AMAZON S3 - TICKETGO AWS
# ============================================================
# Almacena el frontend estático (React/Vite) que será
# servido a través de CloudFront.
#
# Configuración:
#   - Bucket privado (sin acceso público directo)
#   - Acceso exclusivo via CloudFront OAC (Origin Access Control)
#   - Versionado deshabilitado (para minimizar costos)
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
