# ============================================================
# IAM ROLES Y POLÍTICAS - TICKETGO AWS
# ============================================================
# Define los roles IAM que permiten a los servicios AWS
# interactuar entre sí de forma segura.
# Cada rol sigue el principio de mínimo privilegio:
# solo los permisos estrictamente necesarios.
#
# Roles:
#   1. ECS Task Execution Role → permite a ECS descargar
#      imágenes de ECR y escribir logs en CloudWatch.
#   2. Lambda Execution Role → permite a Lambda leer
#      mensajes de SQS y escribir logs en CloudWatch.
# ============================================================

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
# IAM ROLE PARA LAMBDA EXECUTION
# ============================================================
# Permite que Lambda asuma este rol para procesar
# mensajes de SQS y escribir logs en CloudWatch.
resource "aws_iam_role" "lambda_execution_role" {
  name = "ticketgo-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ticketgo-lambda-execution-role"
  }
}

# ============================================================
# POLÍTICA INLINE PARA LAMBDA (SQS + CLOUDWATCH LOGS)
# ============================================================
# Otorga a Lambda los permisos para:
#   1. Escribir logs en el Log Group específico de Lambda
#   2. Leer y eliminar mensajes de la cola SQS de notificaciones
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "ticketgo-lambda-sqs-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ticketgo_lambda_logs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.ticketgo_notifications.arn
      }
    ]
  })
}
