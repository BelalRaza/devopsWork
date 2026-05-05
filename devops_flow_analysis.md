# DevOps Flow & Architecture Analysis

Here is a simplified, high-level breakdown of the DevOps flow for the **ShopSmart** project, answering what we are building, the flow we are using, and the critical edge cases.

## 1. What are we creating? (The Application)
You are building a full-stack web application with two main components:
- **Frontend**: A React/Vite Single Page Application (SPA).
- **Backend**: A Node.js API server using Prisma ORM with an SQLite database.
- **Packaging**: Both parts are containerized using Docker (`Dockerfile` for the backend, `Dockerfile.frontend` for the frontend). The frontend uses Nginx to serve the React files and proxies API requests to the backend.

## 2. What is the Flow? (The CI/CD Pipeline)
Your DevOps pipeline is entirely automated using **GitHub Actions** (`ci.yml`) and **Terraform**. It follows a standard **Continuous Integration / Continuous Deployment (CI/CD)** flow.

Here is the step-by-step journey of your code:

### Phase 1: Continuous Integration (Testing)
Whenever someone pushes code or opens a Pull Request to the `main` or `master` branch:
1. **Backend Tests**: Sets up Node.js, installs dependencies, runs database migrations on a test SQLite DB, runs a linter, and executes backend tests.
2. **Frontend Tests**: Sets up Node.js, installs dependencies, runs a linter, executes frontend tests, and builds the React app.
3. **End-to-End Tests**: Uses **Playwright** to run comprehensive automated browser tests against the full application.
*(These 3 jobs must pass before deployment can happen).*

### Phase 2: Infrastructure Provisioning (Terraform)
If the event is a direct push to `main` (and Phase 1 passes):
1. The `terraform` job runs.
2. It uses `terraform/main.tf` to automatically provision or update AWS infrastructure:
   - **S3 Bucket**: A secure, versioned bucket (likely for app assets).
   - **ECR Repositories**: Two Docker image registries (`shopsmart-backend` & `shopsmart-frontend`).
   - **ECS Cluster & Fargate Task**: Sets up serverless container hosting (AWS Fargate).

### Phase 3: Continuous Deployment (Docker & ECS)
Once Terraform is done:
1. The `docker-deploy` job logs into AWS ECR.
2. It builds the Docker images for both the frontend and backend using the latest code.
3. It pushes these images to the ECR repositories.
4. It tells the AWS ECS Service to pull the new images and restart the containers, completing the deployment.

---

## 3. What Edge Cases / Flaws are we dealing with?
From a DevOps perspective, there are a few critical architectural edge cases ("gotchas") in this setup:

### ⚠️ CRITICAL: Ephemeral SQLite Database
- **The Issue**: Your backend uses an SQLite database (`prod.db`) stored *inside* the Docker container. AWS Fargate containers are "ephemeral" (stateless). Every time you deploy new code, or if AWS restarts the container for any reason, **your database will be completely wiped out**, and all user data will be lost.
- **The Fix**: You need to migrate from SQLite to a managed database like **AWS RDS (PostgreSQL/MySQL)** so the database exists outside the container lifecycle.

### ⚠️ The Sidecar Pattern & Nginx Proxy
- **The Issue**: Your AWS ECS Task Definition puts *both* the frontend and backend containers in the exact same task. Nginx (frontend) is configured to proxy `/api/` traffic to `localhost:5001`. 
- **The Edge Case**: If the backend crashes and takes time to restart, Nginx will throw `502 Bad Gateway` errors. Additionally, if you ever decide to split the frontend and backend into separate services (for independent scaling), you will have to rewrite the Nginx configuration.

### ⚠️ AWS Academy IAM Roles
- **The Issue**: Your Terraform code hardcodes `data "aws_iam_role" "ecs_execution_role" { name = "LabRole" }`. 
- **The Edge Case**: `LabRole` is specific to AWS Academy learner accounts. If you ever move this project to a standard, production AWS account, Terraform will fail because `LabRole` won't exist. You should create custom IAM roles in Terraform instead.

### ⚠️ Orphaned EC2 Workflow
- **The Issue**: You have a secondary GitHub Action (`deploy-ec2.yml`) that triggers on branches like `demo` or `aws-test`. It forcefully copies `index.html` via SSH to a raw EC2 instance.
- **The Edge Case**: This breaks the containerized flow. If developers mix up branches, they might accidentally deploy a broken or mismatched `index.html` directly to an EC2 server, completely bypassing Terraform and Docker. You should consider removing this legacy workflow to avoid confusion.
