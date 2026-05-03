# Setup and Manual Requirements

Before the pipeline can successfully execute, there are some manual prerequisites you need to configure on your AWS and GitHub accounts. This file will guide you through gathering those configuration elements.

## 1. Setting up AWS Credentials

To allow GitHub Actions to safely interact with your AWS infrastructure, you need an IAM user programmed with the correct permissions.

### Steps to get your AWS credentials:
1. Log into your **AWS Management Console**.
2. Navigate to **IAM (Identity and Access Management)**.
3. Click on **Users** in the left sidebar, and then click **Add users**.
4. Give the user a name (e.g., `github-actions-user`) and click **Next**.
5. Under "Permissions options", select **Attach policies directly**.
6. For this project, you will need to grant broad permissions to create S3, ECR, and ECS resources. A quick way is to attach `AdministratorAccess` (though in production, you should lock this down to only ECS/S3/ECR/VPC permissions). Click **Next**, then **Create user**.
7. Once created, click on your new user and go to the **Security credentials** tab.
8. Scroll down to **Access keys** and click **Create access key**.
9. Select **Command Line Interface (CLI)**, acknowledge the prompt, and click **Next**.
10. You will now be presented with your **Access key ID** and **Secret access key**. 
**IMPORTANT**: Copy the secret access key immediately; it will not be shown again!

## 2. Setting up GitHub Secrets

Now you need to put those AWS credentials safely into your GitHub repository so your CI/CD pipeline can access them.

### Steps to add your repository secrets:
1. Go to your repository on **GitHub**.
2. Click on **Settings** in the top navigation bar of your repo.
3. On the left sidebar, expand **Secrets and variables**, then click **Actions**.
4. Click the green button **New repository secret**.
5. You must create **four separate secrets** matching exactly these names:

   * **Name:** `AWS_ACCESS_KEY_ID`
     * **Secret:** *(paste the Access key ID from step 10 above)*
   * **Name:** `AWS_SECRET_ACCESS_KEY`
     * **Secret:** *(paste the Secret access key from step 10 above)*
   * **Name:** `AWS_SESSION_TOKEN`
     * **Secret:** *(Optional unless you are using temporary credentials via an IAM role. If you are using standard IAM users, you can often leave this blank or input any default value depending on your academy/course requirements).*
   * **Name:** `AWS_REGION`
     * **Secret:** `us-east-1` *(or whichever region you prefer, such as `us-west-2`)*.

## 3. How to Run the Project Locally

If you just want to test everything on your own machine without using GitHub Actions, follow these steps:

1. **Prerequisites:** Ensure you have Node.js 20, Docker, and the AWS CLI installed on your machine.
2. **Install Dependencies:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. **Configure AWS CLI Locally:**
   Run `aws configure` in your terminal and paste the Access Keys, Secret Keys, and Default region (`us-east-1`) when prompted.
4. **Provision Infrastructure (Terraform):**
   ```bash
   cd terraform
   terraform init
   terraform apply
   # Type "yes" when asked to confirm the deployment.
   ```
5. **Run the Project Servers Locally:**
   - In terminal 1 (Backend): 
     ```bash
     cd server
     npx prisma generate
     npx prisma migrate dev
     npm run dev
     ```
   - In terminal 2 (Frontend):
     ```bash
     cd client
     npm run dev
     ```

Once configured and committed, any push to your `main` branch will automatically perform all steps defined in the rubric!
