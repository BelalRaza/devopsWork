# Setup and Manual Requirements

Before the pipeline can successfully execute, there are some manual prerequisites you need to configure on your AWS and GitHub accounts. This file will guide you through gathering those configuration elements.

## 1. Setting up AWS Credentials (AWS Academy/Vocareum)

Since you are using an AWS Student/Academy account, your credentials **rotate and expire every time you restart your lab**. You must update your GitHub Secrets every time you start a new lab session if you want your CI/CD pipeline to work.

### Steps to get your AWS credentials:
1. Log into your **AWS Academy / Vocareum** dashboard.
2. Start your lab environment.
3. Click on the **AWS Details** button (usually located at the top of the lab page).
4. Click the **Show** button to reveal the AWS CLI configuration block.
5. You will see three lines that look like this:
   ```
   aws_access_key_id=ASIA...
   aws_secret_access_key=...
   aws_session_token=...
   ```
6. Keep this window open. You will need to copy **all three of these exact values** into your GitHub Secrets.

## 2. Setting up GitHub Secrets

Now you need to put those AWS credentials safely into your GitHub repository so your CI/CD pipeline can access them.

### Steps to add your repository secrets:
1. Go to your repository on **GitHub**.
2. Click on **Settings** in the top navigation bar of your repo.
3. On the left sidebar, expand **Secrets and variables**, then click **Actions**.
4. Click the green button **New repository secret**.
5. You must create **four separate secrets** matching exactly these names:

   * **Name:** `AWS_ACCESS_KEY_ID`
     * **Secret:** *(paste the `aws_access_key_id` value from the lab details)*
   * **Name:** `AWS_SECRET_ACCESS_KEY`
     * **Secret:** *(paste the `aws_secret_access_key` value from the lab details)*
   * **Name:** `AWS_SESSION_TOKEN`
     * **Secret:** *(paste the massive `aws_session_token` value from the lab details. **CRITICAL:** For student accounts, the deployment will instantly fail if this is missing!)*
   * **Name:** `AWS_REGION`
     * **Secret:** `us-east-1` *(or whichever region your lab is hosted in)*.

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
