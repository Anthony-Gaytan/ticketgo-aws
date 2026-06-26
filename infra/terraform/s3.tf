# ============================================================
# AMAZON S3 - TICKETGO AWS (Fase 5)
# ============================================================
# Almacenará el frontend estático (React/Vite) que será
# servido a través de CloudFront.
#
# Configuración planificada:
#   - Bucket privado (sin acceso público directo)
#   - Acceso exclusivo via CloudFront OAC (Origin Access Control)
#   - Versionado deshabilitado (para minimizar costos)
#
# Costo: Free Tier incluye 5 GB de almacenamiento S3 Standard.
# ============================================================
