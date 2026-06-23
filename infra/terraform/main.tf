# ============================================================
# VPC PRINCIPAL DEL PROYECTO TICKETGO
# ============================================================
# La VPC es la red privada principal donde se desplegarán
# los recursos de backend, base de datos, balanceador y servicios internos.
# CIDR 10.0.0.0/16 permite crear varias subredes dentro de esta red.
resource "aws_vpc" "ticketgo_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "ticketgo-vpc"
  }
}

# ============================================================
# ZONAS DE DISPONIBILIDAD DE LA REGIÓN
# ============================================================
# Terraform obtiene automáticamente las zonas disponibles
# en la región configurada, en este caso us-east-2.
# Se utilizarán al menos dos zonas para alta disponibilidad.
data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================
# SUBRED PÚBLICA EN AZ-1
# ============================================================
# Esta subred estará en la primera zona de disponibilidad.
# Se usará para componentes públicos como el Application Load Balancer.
# map_public_ip_on_launch permite asignar IP pública a recursos que lo requieran.
resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.ticketgo_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "ticketgo-public-az1"
  }
}

# ============================================================
# SUBRED PÚBLICA EN AZ-2
# ============================================================
# Segunda subred pública ubicada en otra zona de disponibilidad.
# Permite que el balanceador tenga alta disponibilidad entre AZ-1 y AZ-2.
resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.ticketgo_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "ticketgo-public-az2"
  }
}

# ============================================================
# INTERNET GATEWAY
# ============================================================
# Permite que la VPC tenga comunicación con Internet.
# Es necesario para que los recursos públicos, como el ALB,
# puedan recibir tráfico desde usuarios externos.
resource "aws_internet_gateway" "ticketgo_igw" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  tags = {
    Name = "ticketgo-igw"
  }
}

# ============================================================
# TABLA DE RUTAS PÚBLICA
# ============================================================
# Define la ruta de salida hacia Internet.
# La regla 0.0.0.0/0 significa "todo tráfico externo".
# Ese tráfico se envía al Internet Gateway.
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ticketgo_igw.id
  }

  tags = {
    Name = "ticketgo-public-rt"
  }
}

# ============================================================
# ASOCIACIÓN DE SUBRED PÚBLICA AZ-1 CON TABLA DE RUTAS
# ============================================================
# Conecta la subred pública AZ-1 con la tabla de rutas pública.
# Esto permite que esa subred use el Internet Gateway.
resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public_rt.id
}

# ============================================================
# ASOCIACIÓN DE SUBRED PÚBLICA AZ-2 CON TABLA DE RUTAS
# ============================================================
# Conecta la subred pública AZ-2 con la tabla de rutas pública.
# Así ambas subredes públicas quedan preparadas para alojar el ALB.
resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public_rt.id
}

# ============================================================
# SUBRED PRIVADA DE APLICACIÓN EN AZ-1
# ============================================================
# Esta subred alojará los contenedores ECS Fargate del backend.
# No tendrá acceso directo desde Internet ni IP pública.
# Solo recibirá tráfico proveniente del Application Load Balancer.
resource "aws_subnet" "private_app_az1" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "ticketgo-private-app-az1"
  }
}

# ============================================================
# SUBRED PRIVADA DE APLICACIÓN EN AZ-2
# ============================================================
# Segunda subred privada para garantizar alta disponibilidad.
# ECS Fargate desplegará tareas en ambas zonas de disponibilidad.
# Al no tener IP pública, incrementa la seguridad del backend.
resource "aws_subnet" "private_app_az2" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "ticketgo-private-app-az2"
  }
}

# ============================================================
# SUBRED PRIVADA DE DATOS EN AZ-1
# ============================================================
# Esta subred alojará recursos de datos como RDS PostgreSQL.
# No tendrá IP pública ni acceso directo desde Internet.
# Solo será accedida desde la capa de aplicación, es decir, ECS Fargate.
resource "aws_subnet" "private_data_az1" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "ticketgo-private-data-az1"
  }
}

# ============================================================
# SUBRED PRIVADA DE DATOS EN AZ-2
# ============================================================
# Segunda subred privada de datos para alta disponibilidad.
# Permitirá desplegar servicios como RDS Multi-AZ o Redis en más de una zona.
resource "aws_subnet" "private_data_az2" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "ticketgo-private-data-az2"
  }
}

# ============================================================
# SECURITY GROUP DEL APPLICATION LOAD BALANCER
# ============================================================
# Este grupo de seguridad permite que el ALB reciba tráfico HTTP
# desde Internet. Más adelante, cuando usemos dominio y certificado,
# también se podrá habilitar HTTPS.
resource "aws_security_group" "alb_sg" {
  name        = "ticketgo-alb-sg"
  description = "Permite trafico HTTP publico hacia el ALB"
  vpc_id      = aws_vpc.ticketgo_vpc.id

  ingress {
    description = "HTTP desde Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Salida permitida hacia cualquier destino"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ticketgo-alb-sg"
  }
}

# ============================================================
# SECURITY GROUP DE ECS FARGATE
# ============================================================
# Este grupo de seguridad protege los contenedores del backend.
# Solo permite tráfico desde el Security Group del ALB.
# Es decir, Internet no puede acceder directamente a ECS.
resource "aws_security_group" "ecs_sg" {
  name        = "ticketgo-ecs-sg"
  description = "Permite trafico hacia ECS solo desde el ALB"
  vpc_id      = aws_vpc.ticketgo_vpc.id

  ingress {
    description     = "HTTP desde ALB hacia ECS"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Salida permitida hacia cualquier destino"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ticketgo-ecs-sg"
  }
}

# ============================================================
# APPLICATION LOAD BALANCER - ALB
# ============================================================
# El ALB recibe tráfico HTTP desde Internet y lo distribuye
# hacia los servicios internos de la aplicación.
# Se coloca en las dos subredes públicas para alta disponibilidad.
resource "aws_lb" "ticketgo_alb" {
  name               = "ticketgo-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]

  subnets = [
    aws_subnet.public_az1.id,
    aws_subnet.public_az2.id
  ]

  tags = {
    Name = "ticketgo-alb"
  }
}

# ============================================================
# TARGET GROUP DEL BACKEND
# ============================================================
# El Target Group representa el destino al que el ALB enviará
# las solicitudes. Más adelante aquí se registrarán las tareas
# ECS Fargate que ejecutarán la API .NET.
resource "aws_lb_target_group" "ticketgo_tg" {
  name        = "ticketgo-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.ticketgo_vpc.id
  target_type = "ip"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "ticketgo-tg"
  }
}

# ============================================================
# LISTENER HTTP DEL ALB
# ============================================================
# El Listener escucha peticiones HTTP en el puerto 80.
# Cuando recibe tráfico, lo reenvía al Target Group del backend.
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.ticketgo_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ticketgo_tg.arn
  }
}

# ============================================================
# AMAZON ECR - REPOSITORIO DE IMÁGENES DOCKER
# ============================================================
# ECR almacenará la imagen Docker del backend .NET 8.
# Luego ECS Fargate descargará esta imagen para ejecutar la API.
resource "aws_ecr_repository" "ticketgo_api" {
  name                 = "ticketgo-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "ticketgo-api"
  }
}

# ============================================================
# ECS CLUSTER - TICKETGO
# ============================================================
# El cluster ECS será el contenedor lógico donde más adelante
# se ejecutarán las tareas Fargate del backend .NET 8.
# Crear el cluster por sí solo no ejecuta contenedores ni genera
# consumo de CPU o memoria.
resource "aws_ecs_cluster" "ticketgo_cluster" {
  name = "ticketgo-cluster"

  tags = {
    Name = "ticketgo-cluster"
  }
}

# ============================================================
# IAM ROLE PARA ECS TASK EXECUTION
# ============================================================
# Permite que ECS Fargate pueda descargar la imagen desde ECR
# y enviar logs hacia CloudWatch.
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ticketgo-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ticketgo-ecs-task-execution-role"
  }
}

# ============================================================
# POLÍTICA ADMINISTRADA PARA ECS TASK EXECUTION
# ============================================================
# Otorga permisos estándar para que ECS lea imágenes de ECR
# y escriba logs en CloudWatch.
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ============================================================
# CLOUDWATCH LOG GROUP PARA LA API
# ============================================================
# Aquí se almacenarán los logs del contenedor cuando ECS ejecute la API.
resource "aws_cloudwatch_log_group" "ticketgo_api_logs" {
  name              = "/ecs/ticketgo-api"
  retention_in_days = 7

  tags = {
    Name = "ticketgo-api-logs"
  }
}

# ============================================================
# ECS TASK DEFINITION - BACKEND TICKETGO
# ============================================================
# Define cómo se ejecutará el contenedor de la API .NET 8:
# imagen Docker, CPU, memoria, puerto y configuración de logs.
resource "aws_ecs_task_definition" "ticketgo_api_task" {
  family                   = "ticketgo-api-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "ticketgo-api"
      image     = "329871097383.dkr.ecr.us-east-2.amazonaws.com/ticketgo-api:v1"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/ticketgo-api"
          awslogs-region        = "us-east-2"
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
# ECS SERVICE TEMPORAL - PRUEBA SIN ALB
# ============================================================
# Ejecuta una tarea Fargate usando la imagen subida a ECR.
# Para evitar NAT Gateway por ahora, se ejecuta temporalmente
# en subredes públicas con IP pública.
resource "aws_ecs_service" "ticketgo_api_service" {
  name            = "ticketgo-api-service"
  cluster         = aws_ecs_cluster.ticketgo_cluster.id
  task_definition = aws_ecs_task_definition.ticketgo_api_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.public_az1.id,
      aws_subnet.public_az2.id
    ]

    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  tags = {
    Name = "ticketgo-api-service"
  }
}
