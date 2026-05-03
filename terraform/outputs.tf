output "ecr_repository_url" {
  value       = aws_ecr_repository.app_repo.repository_url
  description = "The URL of the backend ECR repository"
}

output "ecr_frontend_repository_url" {
  value       = aws_ecr_repository.frontend_repo.repository_url
  description = "The URL of the frontend ECR repository"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.app_bucket.id
  description = "The name of the provisioned S3 bucket"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.app_cluster.name
  description = "The name of the ECS cluster"
}

output "ecs_backend_service_name" {
  value       = aws_ecs_service.app_service.name
  description = "The name of the backend ECS service"
}

output "ecs_frontend_service_name" {
  value       = aws_ecs_service.frontend_service.name
  description = "The name of the frontend ECS service"
}
