# AWS EC2 Deployment Guide

## Prerequisites
- EC2 instance with Ubuntu 22.04
- IAM Role: LabInstanceProfile (with Secrets Manager permissions)
- RDS MySQL database configured
- Security groups allowing HTTP/HTTPS traffic

## Step 1: Create Secrets in AWS Secrets Manager

1. Go to AWS Secrets Manager in the AWS Console
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Add the following key-value pairs:
   ```json
   {
     "host": "your-rds-endpoint.rds.amazonaws.com",
     "port": 3306,
     "username": "admin",
     "password": "your-secure-password",
     "database": "student_records"
   }
   ```
5. Name the secret: `rds-db-credentials`
6. Copy the Secret ARN (you'll need this)

## Step 2: SSH into EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 for process management
sudo npm install -g pm2
```

## Step 4: Clone and Setup Application

```bash
# Create app directory
mkdir -p ~/studentmanagement
cd ~/studentmanagement

# Upload your application files (use scp, git, or other method)
# Example with scp from local machine:
# scp -i your-key.pem -r /path/to/local/app/* ubuntu@your-ec2-ip:~/studentmanagement/

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 5: Configure Environment Variables

```bash
# Create production .env file
nano .env

# Add the following (update DB_SECRET_ARN with your actual ARN):
USE_SECRETS_MANAGER=true
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-credentials-AbCdEf
AWS_REGION=us-east-1
```

## Step 6: Setup Database Schema

```bash
# Connect to RDS MySQL from EC2
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p

# Create database and table
CREATE DATABASE IF NOT EXISTS student_records;
USE student_records;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  course VARCHAR(255) NOT NULL,
  enrollmentDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Step 7: Start Application with PM2

```bash
# Start the Next.js application
pm2 start npm --name "studentmanagement" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status
pm2 logs studentmanagement
```

## Step 8: Configure Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/studentmanagement

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/studentmanagement /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Configure Security Groups

Ensure your EC2 security group allows:
- Inbound: HTTP (80), HTTPS (443), SSH (22)
- Outbound: All traffic (or at least MySQL port 3306 to RDS)

Ensure your RDS security group allows:
- Inbound: MySQL (3306) from EC2 security group

## Step 10: Verify Deployment

```bash
# Check if application is running
curl http://localhost:3000

# Check PM2 logs
pm2 logs studentmanagement

# Test from browser
# Open: http://your-ec2-public-ip or http://your-domain.com
```

## Troubleshooting

### Check AWS credentials are working
```bash
# Verify IAM role is attached
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Test Secrets Manager access
aws secretsmanager get-secret-value --secret-id rds-db-credentials --region us-east-1
```

### View application logs
```bash
pm2 logs studentmanagement
pm2 monit
```

### Restart application
```bash
pm2 restart studentmanagement
```

### Update application
```bash
cd ~/studentmanagement
git pull  # or upload new files
npm install
npm run build
pm2 restart studentmanagement
```

## Important Notes

1. **IAM Role Permissions**: The LabInstanceProfile must have `secretsmanager:GetSecretValue` permission
2. **No Hardcoded Credentials**: Never commit .env files with actual credentials to Git
3. **RDS Endpoint**: Update the secret with your actual RDS endpoint
4. **Security**: Keep your EC2 and RDS in private subnets if possible, use Nginx as reverse proxy
5. **Monitoring**: Use CloudWatch for logs and monitoring
