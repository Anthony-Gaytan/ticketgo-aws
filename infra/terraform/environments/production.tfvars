# Configuracion objetivo de produccion para TicketGo.
# No contiene credenciales ni secretos.

aws_account_id = "783111403254"
aws_region     = "us-east-2"
project_name   = "ticketgo"
environment    = "production"

# API en ECS Fargate: alta disponibilidad minima entre dos AZ.
ecs_cpu           = "512"
ecs_memory        = "1024"
ecs_desired_count = 2
ecs_max_capacity  = 6
ecr_image_tag     = "latest"

# Las migraciones se ejecutaran como una tarea controlada, no al iniciar cada contenedor.
auto_migrate_database    = "false"
frontend_allowed_origins = "https://ticketgo-aws.online,https://www.ticketgo-aws.online"

# PostgreSQL productivo.
db_instance_class             = "db.t4g.small"
db_allocated_storage          = 50
db_max_allocated_storage      = 200
rds_multi_az                  = true
rds_backup_retention_days     = 30
rds_deletion_protection       = true
rds_skip_final_snapshot       = false
rds_final_snapshot_identifier = "ticketgo-production-final-snapshot"

# Proteccion del punto de entrada.
alb_deletion_protection = true

# Perimetro web productivo.
enable_cloudfront    = true
enable_waf           = true
enable_custom_domain = true
domain_name          = "ticketgo-aws.online"

# Operacion y procesamiento asincrono.
log_retention_days                 = 30
lambda_memory                      = 256
lambda_timeout                     = 30
enable_lambda_reserved_concurrency = true
