# Workflow Plans

This document contains two workflow plans:
1. High-Level CI/CD Execution Workflow (What is executed in the project).
2. Internal Scratch Workflow (How to run everything manually from Phase 1 and the internal mechanisms).

---

## 1. High-Level CI/CD Execution Workflow

This workflow represents the automated pipeline implemented in `.github/workflows/ci.yml`. It ensures that every code change is tested, infrastructure is validated and applied, and the updated application is built and deployed seamlessly.

**Trigger**: Code is pushed or a Pull Request is merged to the `main` or `master` branch.

**Workflow Execution Order:**
1. **Testing Phase (Phase 1)**
   - `backend`: Checks out code, sets up Node.js 20, generates Prisma client, runs migrations, and executes `npm test` and linting on the `server` directory.
   - `frontend`: Checks out code, sets up Node.js 20, runs `npm test`, linting, and builds the `client` directory.
   - `e2e`: Waits for both `backend` and `frontend` to pass, sets up the full-stack locally (Prisma db, Vite UI), installs Playwright, and runs E2E tests generating test artifacts.

2. **Infrastructure Provisioning Phase (Phase 2)**
   - `terraform`: Waits for all tests (`e2e`, `backend`, `frontend`) to pass. 
   - Checks out the code and sets up Terraform CLI.
   - Configures AWS credentials via GitHub Secrets.
   - Changes directory to `terraform/`.
   - Runs `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply -auto-approve` to ensure S3 buckets, ECR, ECS Cluster, and Fargate configurations match the desired state.

3. **Container Build and ECS Deployment Phase (Phase 3)**
   - `docker-deploy`: Waits for the `terraform` job to successfully provision infrastructure.
   - Logs into AWS ECR using GitHub Secrets.
   - Builds the Docker image securely using the multi-stage `Dockerfile`.
   - Tags the image with the latest commit SHA and pushes it to the ECR repository (`shopsmart-backend`).
   - Forces a new deployment on the ECS Service (`shopsmart-service`) in the ECS Cluster (`shopsmart-cluster`) so that Fargate automatically pulls the new image and replaces running tasks seamlessly.

---

## 2. Internal Scratch Workflow & Architecture

This workflow details exactly how the pieces function together under the hood and lists the commands you would run if you were to trigger this entire process manually on your local machine starting from Phase 1.

### Internal Architecture Map:
- **Application Flow**: The frontend is a React/Vite app. The backend is an Express Node.js API that interfaces with a database using Prisma. 
- **Docker Flow**: Our `Dockerfile` runs a multi-stage process. First, it bundles all `server` dependencies securely. Second, it creates a pristine Node.js alpine image, switches to a non-root `appuser` (for security), copies only necessary backend files, and exposes port 5001. A healthcheck is also run periodically.
- **Terraform Flow**: Our `terraform/main.tf` acts as the single source of truth for cloud resources. It defines an S3 Bucket (versioning and AES256 encryption enabled, public access blocked), an ECR image repo, an ECS cluster, and a Fargate Task spanning a VPC with secure IAM roles.

### Manual Commands from Phase 1 to Phase 3:

**Phase 1: Local Testing**
```bash
# 1. Run Backend Tests
cd server
npm ci
npx prisma generate
npx prisma migrate dev
npm test
cd ..

# 2. Run Frontend Tests
cd client
npm ci
npm test
npm run build
cd ..

# 3. Run End-to-End Tests
npm ci
npx playwright install --with-deps chromium
npx playwright test
```

**Phase 2: Local Terraform Provisioning**
```bash
# 1. Provide Local AWS Config via terminal:
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"

# 2. Initialize and Apply Terraform
cd terraform
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply "tfplan"
cd ..
```

**Phase 3: Local Docker Build and ECS Deployment**
```bash
# 1. Authenticate Docker with AWS ECR (Replace <ACCOUNT_ID> and <REGION>)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build Docker image matching the required ECS Tag
docker build -t shopsmart-backend:latest .

# 3. Tag Docker image for ECR
docker tag shopsmart-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-backend:latest

# 4. Push Docker image to ECR
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-backend:latest

# 5. Force ECS Deployment to pull the new Image
aws ecs update-service --cluster shopsmart-cluster --service shopsmart-service --force-new-deployment
```
