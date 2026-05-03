terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------
# S3 Bucket Configuration (Phase 2 Rubric Requirements)
# ---------------------------------------------------------

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Unique bucket name
resource "aws_s3_bucket" "app_bucket" {
  bucket = "shopsmart-app-bucket-${random_id.bucket_suffix.hex}"
}

# Versioning enabled
resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption enabled (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket_encryption" {
  bucket = aws_s3_bucket.app_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public access blocked
resource "aws_s3_bucket_public_access_block" "app_bucket_public_access_block" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------
# ECR Repository
# ---------------------------------------------------------

resource "aws_ecr_repository" "app_repo" {
  name                 = "shopsmart-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ---------------------------------------------------------
# Network Configuration
# ---------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ---------------------------------------------------------
# ECS Cluster
# ---------------------------------------------------------

resource "aws_ecs_cluster" "app_cluster" {
  name = "shopsmart-cluster"
}

# ---------------------------------------------------------
# IAM Roles for ECS
# ---------------------------------------------------------

resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_execution_role_shopsmart"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---------------------------------------------------------
# Security Group for ECS Task
# ---------------------------------------------------------

resource "aws_security_group" "ecs_sg" {
  name        = "ecs-task-sg-shopsmart"
  description = "Allow inbound traffic to ECS task on port 5001"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------------------
# ECS Task Definition & Service
# ---------------------------------------------------------

resource "aws_ecs_task_definition" "app_task" {
  family                   = "shopsmart-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "shopsmart-backend"
      image     = "${aws_ecr_repository.app_repo.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 5001
          hostPort      = 5001
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5001"
        },
        {
          name  = "DATABASE_URL"
          value = "file:./prod.db"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/shopsmart-backend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app_service" {
  name            = "shopsmart-service"
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  # Ignore changes to task definition so Terraform doesn't revert deployments made by CI/CD
  lifecycle {
    ignore_changes = [task_definition]
  }
}
