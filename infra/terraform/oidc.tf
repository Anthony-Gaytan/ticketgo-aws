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
            # El plan usa el sujeto de la rama y el apply, al estar protegido
            # por el entorno production, usa el sujeto del entorno.
            # En ambos casos se exige que la ejecución provenga de main.
            "token.actions.githubusercontent.com:sub" = [
              "repo:Anthony-Gaytan/ticketgo-aws:ref:refs/heads/main",
              "repo:Anthony-Gaytan/ticketgo-aws:environment:production"
            ]
            "token.actions.githubusercontent.com:ref" = "refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name = "ticketgo-github-actions-role"
  }
}

# Política de permisos para el rol de GitHub Actions.
# PowerUserAccess cubre recursos no-IAM; los permisos IAM se acotan a recursos ticketgo-*.
resource "aws_iam_role_policy_attachment" "github_actions_power_user" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

resource "aws_iam_role_policy" "github_actions_iam_policy" {
  name = "ticketgo-github-actions-iam-policy"
  role = aws_iam_role.github_actions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageTicketGoIamRolesAndPolicies"
        Effect = "Allow"
        Action = [
          "iam:AttachRolePolicy",
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:CreateRole",
          "iam:DeletePolicy",
          "iam:DeletePolicyVersion",
          "iam:DeleteRole",
          "iam:DeleteRolePolicy",
          "iam:DetachRolePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "iam:ListPolicyVersions",
          "iam:ListRolePolicies",
          "iam:PassRole",
          "iam:PutRolePolicy",
          "iam:TagPolicy",
          "iam:TagRole",
          "iam:UntagPolicy",
          "iam:UntagRole",
          "iam:UpdateAssumeRolePolicy",
          "iam:UpdateRole",
          "iam:UpdateRoleDescription"
        ]
        Resource = [
          "arn:aws:iam::${var.aws_account_id}:policy/ticketgo-*",
          "arn:aws:iam::${var.aws_account_id}:role/ticketgo-*"
        ]
      },
      {
        Sid    = "ManageTicketGoOidcProvider"
        Effect = "Allow"
        Action = [
          "iam:CreateOpenIDConnectProvider",
          "iam:DeleteOpenIDConnectProvider",
          "iam:GetOpenIDConnectProvider",
          "iam:TagOpenIDConnectProvider",
          "iam:UpdateOpenIDConnectProviderThumbprint"
        ]
        Resource = "arn:aws:iam::${var.aws_account_id}:oidc-provider/token.actions.githubusercontent.com"
      },
      {
        Sid    = "ReadIamMetadata"
        Effect = "Allow"
        Action = [
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:ListPolicies",
          "iam:ListRoles"
        ]
        Resource = [
          "arn:aws:iam::${var.aws_account_id}:policy/ticketgo-*",
          "arn:aws:iam::${var.aws_account_id}:role/ticketgo-*"
        ]
      }
    ]
  })
}
