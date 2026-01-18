# AWS EC2 Deployment Checklist

Use this checklist when deploying the Student Management application to AWS EC2.

## Pre-Deployment (Local Machine)

- [ ] **AWS Account Setup**
  - [ ] AWS account with appropriate permissions
  - [ ] AWS CLI installed and configured
  - [ ] Access to AWS Console

- [ ] **Create RDS Database**
  - [ ] Launch RDS MySQL instance
  - [ ] Note down the endpoint: `__________________.rds.amazonaws.com`
  - [ ] Create database user and password
  - [ ] Configure security group to allow EC2 access
  - [ ] Test connection from EC2 or local machine

- [ ] **Setup AWS Secrets Manager**
  - [ ] Run `./setup-secrets-manager.sh` OR create manually
  - [ ] Secret name: `rds-db-credentials`
  - [ ] Copy Secret ARN: `______________________________________`
  - [ ] Verify secret contains: host, port, username, password, database

- [ ] **Verify IAM Role**
  - [ ] IAM role `LabInstanceProfile` exists
  - [ ] Has `secretsmanager:GetSecretValue` permission
  - [ ] Has `secretsmanager:DescribeSecret` permission

## EC2 Instance Setup

- [ ] **Launch EC2 Instance**
  - [ ] AMI: Ubuntu 22.04 LTS
  - [ ] Instance Type: t3.micro (or larger)
  - [ ] VPC: Select appropriate VPC
  - [ ] Subnet: Public subnet
  - [ ] Auto-assign Public IP: **Enabled**
  - [ ] **IAM Instance Profile: LabInstanceProfile** ← Critical!
  - [ ] Key pair for SSH access
  - [ ] Note Public IP: `___.___.___.___`

- [ ] **Configure Security Group**
  - [ ] Inbound Rules:
    - [ ] SSH (22) from your IP
    - [ ] HTTP (80) from 0.0.0.0/0
    - [ ] HTTPS (443) from 0.0.0.0/0
    - [ ] Custom TCP (3000) from 0.0.0.0/0 (for testing)
  - [ ] Outbound Rules:
    - [ ] All traffic to 0.0.0.0/0

- [ ] **SSH into EC2**
  ```bash
  ssh -i your-key.pem ubuntu@YOUR_EC2_IP
  ```

## Application Deployment on EC2

- [ ] **System Updates**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Install Node.js 20.x**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  node --version  # Should be v20.x
  npm --version
  ```

- [ ] **Install PM2**
  ```bash
  sudo npm install -g pm2
  ```

- [ ] **Install AWS CLI (if not installed)**
  ```bash
  sudo apt install -y awscli
  aws --version
  ```

- [ ] **Upload Application Files**
  
  **Option A - Using SCP (from local machine):**
  ```bash
  scp -i your-key.pem -r /path/to/studentmanagement ubuntu@YOUR_EC2_IP:~/
  ```
  
  **Option B - Using Git:**
  ```bash
  git clone your-repo-url studentmanagement
  cd studentmanagement
  ```
  
  **Option C - Manual upload via SFTP/FileZilla**

- [ ] **Navigate to App Directory**
  ```bash
  cd ~/studentmanagement
  ```

- [ ] **Create .env File**
  ```bash
  nano .env
  ```
  
  Add:
  ```env
  USE_SECRETS_MANAGER=true
  DB_SECRET_ARN=YOUR_SECRET_ARN_HERE
  AWS_REGION=us-east-1
  ```
  Save and exit (Ctrl+X, Y, Enter)

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```
  (This may take a few minutes)

## Verification & Testing

- [ ] **Test AWS Configuration**
  ```bash
  ./test-aws-config.sh
  ```
  Verify all checks pass

- [ ] **Test Secrets Manager Access**
  ```bash
  aws secretsmanager get-secret-value \
    --secret-id rds-db-credentials \
    --region us-east-1
  ```
  Should return the secret JSON

- [ ] **Test IAM Role**
  ```bash
  curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
  ```
  Should return: `LabInstanceProfile`

- [ ] **Setup Database Schema**
  ```bash
  # Connect to RDS
  mysql -h YOUR_RDS_ENDPOINT -u admin -p
  ```
  ```sql
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
  
  -- Verify
  SHOW TABLES;
  DESCRIBE students;
  ```

## Build & Start Application

- [ ] **Build the Application**
  ```bash
  npm run build
  ```
  (Takes 1-2 minutes)

- [ ] **Test Start (Manual)**
  ```bash
  npm start
  ```
  - [ ] Open browser: `http://YOUR_EC2_IP:3000`
  - [ ] Verify app loads
  - [ ] Test creating a student
  - [ ] Test viewing students list
  - [ ] Stop with Ctrl+C

- [ ] **Start with PM2**
  ```bash
  pm2 start npm --name "studentmanagement" -- start
  ```

- [ ] **Verify PM2 Status**
  ```bash
  pm2 status
  ```
  Should show "online"

- [ ] **Check Logs**
  ```bash
  pm2 logs studentmanagement --lines 50
  ```
  Should show "Ready on http://localhost:3000"

- [ ] **Save PM2 Configuration**
  ```bash
  pm2 save
  ```

- [ ] **Setup PM2 Auto-Start**
  ```bash
  pm2 startup
  # Copy and run the command it outputs
  ```

## Final Testing

- [ ] **Test Application**
  - [ ] Open: `http://YOUR_EC2_IP:3000`
  - [ ] Application loads correctly
  - [ ] Can view students (if any)
  - [ ] Can add a new student
  - [ ] Can edit a student
  - [ ] Can delete a student
  - [ ] No console errors in browser

- [ ] **Test Health Endpoint**
  ```bash
  curl http://localhost:3000/api/health
  ```
  Should return: `{"status":"ok","database":"connected","timestamp":"..."}`

- [ ] **Monitor Logs**
  ```bash
  pm2 logs studentmanagement
  ```
  - [ ] No error messages
  - [ ] Database connections successful
  - [ ] "USE_SECRETS_MANAGER: true" logged

## Optional: Nginx Setup (Production)

- [ ] **Install Nginx**
  ```bash
  sudo apt install -y nginx
  ```

- [ ] **Configure Nginx**
  ```bash
  sudo nano /etc/nginx/sites-available/studentmanagement
  ```
  
  Add:
  ```nginx
  server {
      listen 80;
      server_name YOUR_DOMAIN_OR_IP;

      location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- [ ] **Enable Site**
  ```bash
  sudo ln -s /etc/nginx/sites-available/studentmanagement /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl restart nginx
  ```

- [ ] **Test Nginx**
  - [ ] Open: `http://YOUR_EC2_IP` (port 80, not 3000)
  - [ ] Application loads through Nginx

## Post-Deployment

- [ ] **Document Deployment**
  - [ ] Note EC2 Public IP: `___.___.___.___`
  - [ ] Note RDS Endpoint: `________________`
  - [ ] Note Secret ARN: `________________`
  - [ ] Save SSH key securely
  - [ ] Document any custom configurations

- [ ] **Security Hardening**
  - [ ] Change default SSH port (optional)
  - [ ] Setup fail2ban (optional)
  - [ ] Enable CloudWatch logging
  - [ ] Review security group rules

- [ ] **Backup Plan**
  - [ ] Setup RDS automated backups
  - [ ] Create AMI of EC2 instance
  - [ ] Document recovery procedures

## Troubleshooting Checklist

If application doesn't work:

- [ ] Check PM2 logs: `pm2 logs studentmanagement`
- [ ] Check IAM role: `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/`
- [ ] Test Secrets Manager: `aws secretsmanager get-secret-value --secret-id rds-db-credentials`
- [ ] Verify .env file: `cat .env`
- [ ] Test RDS connection: `mysql -h RDS_ENDPOINT -u admin -p`
- [ ] Check security groups (EC2 can reach RDS on 3306)
- [ ] Rebuild app: `npm run build`
- [ ] Restart PM2: `pm2 restart studentmanagement`

## Deployment Complete! 🎉

Once all items are checked:
- [ ] Application is accessible
- [ ] Using Secrets Manager (no hardcoded credentials)
- [ ] PM2 monitoring active
- [ ] Auto-start configured
- [ ] Documentation complete

**Next Steps:**
- Setup monitoring/alerting
- Configure domain name (optional)
- Setup SSL/HTTPS with Let's Encrypt
- Implement CI/CD pipeline

---

**Deployment Date:** ____________  
**Deployed By:** ____________  
**EC2 IP:** ____________  
**Notes:** ____________
