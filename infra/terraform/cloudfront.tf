# ============================================================
# AMAZON CLOUDFRONT - TICKETGO AWS (Fase 5)
# ============================================================
# CDN que distribuirá el frontend estático desde S3
# con caché global y HTTPS automático.
#
# Configuración planificada:
#   - Origin: S3 Bucket (vía OAC)
#   - Price Class: PriceClass_100 (solo NA y Europa, más barato)
#   - Default Root Object: index.html
#   - Error Pages: SPA routing (403/404 → index.html)
#   - WAF Web ACL asociada para protección
#
# Costo: Free Tier incluye 1 TB de transferencia al mes.
# ============================================================
