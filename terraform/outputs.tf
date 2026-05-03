output "ecr_repository_url" {
  value       = aws_ecr_repository.app_repo.repository_url
  description = "The URL of the ECR repository"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.app_bucket.id
  description = "The name of the provisioned S3 bucket"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.app_cluster.name
  description = "The name of the ECS cluster"
}

output "ecs_service_name" {
  value       = aws_ecs_service.app_service.name
  description = "The name of the ECS service"
}
