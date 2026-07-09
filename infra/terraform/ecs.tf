# ============================================================
# ECS FARGATE - TICKETGO AWS
# ============================================================
# Amazon ECS con Fargate ejecuta la API .NET 8 en contenedores
# sin necesidad de administrar servidores (serverless containers).
#
# Componentes:
#   1. ECS Cluster → Contenedor lógico para las tareas
#   2. Task Definition → Cómo ejecutar el contenedor
#   3. ECS Service → Mantiene las tareas corriendo y conecta con ALB
#
# NOTA: Para evitar costos de NAT Gateway (~$32/mes), las tareas
# se ejecutan temporalmente en subredes públicas con IP pública.
# En producción se usarían subredes privadas con NAT Gateway o
# VPC Endpoints para ECR.
# ============================================================

# ============================================================
# ECS CLUSTER - TICKETGO
# ============================================================
# El cluster ECS será el contenedor lógico donde se ejecutarán
# las tareas Fargate del backend .NET 8.
#
# Se habilita Container Insights para que CloudWatch recopile
# métricas de CPU, memoria, tareas y rendimiento del clúster.
# Esta configuración elimina el hallazgo CKV_AWS_65 de Checkov.
resource "aws_ecs_cluster" "ticketgo_cluster" {
  name = "ticketgo-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ticketgo-cluster"
  }
}

# ============================================================
# ECS TASK DEFINITION - BACKEND TICKETGO
# ============================================================
# Define cómo se ejecutará el contenedor de la API .NET 8:
# imagen Docker, CPU, memoria, puerto y configuración de logs.
# La imagen se construye desde variables para facilitar
# actualizaciones de versión.
resource "aws_ecs_task_definition" "ticketgo_api_task" {
  family                   = "ticketgo-api-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "ticketgo-api"
      image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/ticketgo-api:${var.ecr_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      secrets = [
        {
          name      = "ConnectionStrings__DefaultConnection"
          valueFrom = aws_secretsmanager_secret.ticketgo_db_credentials.arn
        },
        {
          name      = "Jwt__Key"
          valueFrom = aws_secretsmanager_secret.ticketgo_jwt_secret.arn
        }
      ]

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "AWS_SQS_QUEUE_URL"
          value = aws_sqs_queue.ticketgo_notifications.url
        },
        {
          name  = "AUTO_MIGRATE_DATABASE"
          value = var.auto_migrate_database
        },
        {
          name  = "Redis__ConnectionString"
          value = "${aws_elasticache_cluster.ticketgo_redis.cache_nodes[0].address}:${aws_elasticache_cluster.ticketgo_redis.cache_nodes[0].port}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/ticketgo-api"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "ticketgo-api-task"
  }
}

# ============================================================
# ECS SERVICE - BACKEND TICKETGO
# ============================================================
# Ejecuta una tarea Fargate usando la imagen subida a ECR.
# Las tareas se ejecutan de forma segura en subredes privadas,
# saliendo a Internet a través de los NAT Gateways de su zona.
# El servicio se conecta al ALB a través del Target Group.
resource "aws_ecs_service" "ticketgo_api_service" {
  name            = "ticketgo-api-service"
  cluster         = aws_ecs_cluster.ticketgo_cluster.id
  task_definition = aws_ecs_task_definition.ticketgo_api_task.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.private_app_az1.id,
      aws_subnet.private_app_az2.id
    ]

    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ticketgo_tg.arn
    container_name   = "ticketgo-api"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.http_listener
  ]

  tags = {
    Name = "ticketgo-api-service"
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# ============================================================
# AUTO SCALING DE ECS
# ============================================================
# Configura el escalado automático de las tareas Fargate
# según el uso de recursos para mantener el rendimiento y
# optimizar costos.

resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.ticketgo_cluster.name}/${aws_ecs_service.ticketgo_api_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Política de escalado: Target Tracking (CPU al 70%)
resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "ticketgo-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
