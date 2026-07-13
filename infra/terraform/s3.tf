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
  # checkov:skip=CKV_AWS_144:Para un ambiente de demo, no es necesaria la replicacion de datos en otra region de AWS, lo que ahorra costos de transferencia y almacenamiento.
  # checkov:skip=CKV2_AWS_62:El bucket solo almacena el frontend estatico y no se realizan acciones reactivas ante la subida de objetos, por lo que no requiere notificaciones de eventos.
  # checkov:skip=CKV2_AWS_6:En la demo sin CloudFront, el bucket requiere Public Access Block permisivo para servir el sitio estatico por S3 Website Endpoint.
  bucket = "ticketgo-frontend-${var.aws_account_id}"

  logging {
    target_bucket = aws_s3_bucket.ticketgo_s3_logging.id
    target_prefix = "log/"
  }

  tags = {
    Name = "ticketgo-frontend"
  }
}

# ============================================================
# CIFRADO EN REPOSO PREDETERMINADO
# ============================================================
# Habilita el cifrado SSE-KMS administrado con clave KMS personalizada (CMK).
# Resuelve CKV_AWS_145.
resource "aws_s3_bucket_server_side_encryption_configuration" "ticketgo_frontend_encryption" {
  bucket = aws_s3_bucket.ticketgo_frontend.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.ticketgo_key.arn
      sse_algorithm     = "aws:kms"
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
  # checkov:skip=CKV_AWS_53:En la demo sin CloudFront, se permite acceso publico controlado por bucket policy para servir el frontend por S3 Website Endpoint.
  # checkov:skip=CKV_AWS_54:En la demo sin CloudFront, se permite una bucket policy publica minima de solo lectura para el frontend estatico.
  # checkov:skip=CKV_AWS_56:En la demo sin CloudFront, restrict_public_buckets debe quedar desactivado para que el S3 Website Endpoint pueda servir index.html.
  bucket = aws_s3_bucket.ticketgo_frontend.id

  block_public_acls       = var.enable_cloudfront
  block_public_policy     = var.enable_cloudfront
  ignore_public_acls      = true
  restrict_public_buckets = var.enable_cloudfront
}

# ============================================================
# S3 STATIC WEBSITE - DEMO SIN CLOUDFRONT
# ============================================================
# Permite servir el frontend directamente desde S3 cuando
# CloudFront está deshabilitado por restricciones de cuenta.
resource "aws_s3_bucket_website_configuration" "ticketgo_frontend" {
  count  = var.enable_cloudfront ? 0 : 1
  bucket = aws_s3_bucket.ticketgo_frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# ============================================================
# BUCKET POLICY - ACCESO FRONTEND
# ============================================================
# Con CloudFront habilitado, solo permite acceso vía OAC.
# Sin CloudFront, permite lectura pública temporal para demo S3 website.
resource "aws_s3_bucket_policy" "ticketgo_frontend" {
  # checkov:skip=CKV_AWS_70:En la demo sin CloudFront, el frontend se publica temporalmente con Principal "*" y permiso exclusivo s3:GetObject sobre objetos del bucket.
  bucket = aws_s3_bucket.ticketgo_frontend.id

  policy = var.enable_cloudfront ? jsonencode({
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
            "AWS:SourceArn" = aws_cloudfront_distribution.ticketgo_cdn[0].arn
          }
        }
      }
    ]
    }) : jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowPublicReadForS3WebsiteDemo"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.ticketgo_frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.ticketgo_frontend]
}

# ============================================================
# S3 BUCKET - REGISTROS DE ACCESO (LOGGING)
# ============================================================
# Almacena los logs de acceso del bucket del frontend.
resource "aws_s3_bucket" "ticketgo_s3_logging" {
  # checkov:skip=CKV_AWS_18:Este es el bucket de logs de S3, no requiere tener habilitado el registro de accesos sobre si mismo.
  # checkov:skip=CKV_AWS_144:Para un ambiente de demo, no se requiere replicacion region cruzada del bucket de logs.
  # checkov:skip=CKV2_AWS_62:El bucket de logs no requiere notificaciones de eventos.
  bucket = "ticketgo-s3-logs-${var.aws_account_id}"

  tags = {
    Name = "ticketgo-s3-logs"
  }
}

resource "aws_s3_bucket_public_access_block" "ticketgo_s3_logging" {
  bucket = aws_s3_bucket.ticketgo_s3_logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ticketgo_s3_logging_encryption" {
  bucket = aws_s3_bucket.ticketgo_s3_logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.ticketgo_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "ticketgo_s3_logging_versioning" {
  bucket = aws_s3_bucket.ticketgo_s3_logging.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ============================================================
# LOGS S3 LIFECYCLE CONFIGURATION
# ============================================================
# Elimina los logs antiguos después de 30 días para controlar costos.
resource "aws_s3_bucket_lifecycle_configuration" "ticketgo_s3_logging_lifecycle" {
  bucket = aws_s3_bucket.ticketgo_s3_logging.id

  rule {
    id     = "cleanup-old-logs"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.ticketgo_s3_logging_versioning]
}
