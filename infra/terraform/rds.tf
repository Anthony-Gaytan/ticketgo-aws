# ============================================================
# AMAZON RDS POSTGRESQL - TICKETGO AWS
# ============================================================
# Base de datos relacional PostgreSQL 16 administrada por AWS.
# Almacena los datos del sistema: usuarios, eventos, tickets,
# órdenes y tipos de entrada.
#
# Configuración:
#   - Engine: PostgreSQL 16
#   - Instance: db.t3.micro (Free Tier elegible)
#   - Storage: 20 GB gp3
#   - Multi-AZ: Controlado por var.rds_multi_az (default: false)
#   - Backup: Retención automática de 7 días
#   - Subnets: private_data_az1, private_data_az2
#   - Security Group: Solo permite tráfico desde ECS (puerto 5432)
#   - Acceso público: Deshabilitado
#   - Password: Administrada automáticamente por AWS (Secrets Manager)
#
# Costo Single-AZ: ~$13/mes (db.t3.micro)
# Costo Multi-AZ: ~$26/mes (duplica el costo)
# ============================================================

# ============================================================
# DB SUBNET GROUP
# ============================================================
# Define en qué subredes privadas de datos se desplegará RDS.
# Utiliza las dos subredes privadas de datos para permitir
# Multi-AZ en caso de habilitarse.
resource "aws_db_subnet_group" "ticketgo_db_subnet_group" {
  name        = "ticketgo-db-subnet-group"
  description = "Subredes privadas de datos para RDS PostgreSQL"

  subnet_ids = [
    aws_subnet.private_data_az1.id,
    aws_subnet.private_data_az2.id
  ]

  tags = {
    Name = "ticketgo-db-subnet-group"
  }
}

# ============================================================
# DB PARAMETER GROUP
# ============================================================
# Define configuraciones avanzadas para PostgreSQL, habilitando
# logs de consultas para auditoria y debugging. Resuelve CKV2_AWS_30.
resource "aws_db_parameter_group" "ticketgo_db_pg" {
  name   = "ticketgo-db-pg"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# ============================================================
# INSTANCIA RDS POSTGRESQL
# ============================================================
# Base de datos PostgreSQL 16 en subredes privadas.
# La contraseña es administrada automáticamente por AWS
# y almacenada en Secrets Manager (manage_master_user_password).
# No tiene acceso público ni IP pública.
resource "aws_db_instance" "ticketgo_db" {
  identifier     = "ticketgo-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username

  # AWS genera y rota la contraseña automáticamente
  # La almacena en Secrets Manager de forma segura
  manage_master_user_password = true

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.ticketgo_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  multi_az               = var.rds_multi_az
  publicly_accessible    = false

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true
  deletion_protection        = var.rds_deletion_protection

  # Autenticación IAM habilitada (CKV_AWS_161)
  iam_database_authentication_enabled = true

  # Logs de base de datos a CloudWatch (CKV_AWS_129)
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Performance Insights y cifrado KMS (CKV_AWS_354)
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.ticketgo_key.arn

  # Monitoreo Mejorado (Enhanced Monitoring) (CKV_AWS_118)
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Parameter Group para Query Logging (CKV2_AWS_30)
  parameter_group_name = aws_db_parameter_group.ticketgo_db_pg.name

  backup_retention_period = 7
  skip_final_snapshot     = true

  tags = {
    Name = "ticketgo-db"
  }
}
