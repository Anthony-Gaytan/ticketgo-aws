# ============================================================
# OIDC GITHUB ACTIONS - TICKETGO AWS
# ============================================================
# Configura OpenID Connect (OIDC) para permitir que GitHub
# Actions asuma un rol en AWS sin necesidad de usar claves
# estáticas (Access Keys), mejorando enormemente la seguridad.
# ============================================================

# Proveedor de Identidad OIDC para GitHub
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
}

# Rol IAM que GitHub Actions asumirá
resource "aws_iam_role" "github_actions_role" {
  name = "ticketgo-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          # El subject valida que solo este repositorio pueda asumir el rol
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:*/ticketgo-aws:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "ticketgo-github-actions-role"
  }
}

# Política de permisos para el rol de GitHub Actions
# Se asigna AdministratorAccess porque el pipeline de Terraform
# necesita crear VPCs, RDS, ECS, IAM Roles, etc.
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
