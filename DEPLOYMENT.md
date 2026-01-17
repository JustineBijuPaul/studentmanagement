# Student Records Management System - Deployment Guide

## AWS Infrastructure Setup

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Basic knowledge of AWS services (EC2, RDS, VPC, ALB, Auto Scaling)

---

## Architecture Overview

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
Auto Scaling Group (EC2 Instances)
    ↓
Amazon RDS MySQL (Private Subnet)
    ↑
AWS Secrets Manager
```

---

## Step 1: VPC and Network Setup

### Create VPC
1. Go to AWS VPC Console
2. Create VPC with:
   - CIDR: `10.0.0.0/16`
   - Enable DNS hostnames
   - Enable DNS resolution

### Create Subnets
Create 4 subnets across 2 Availability Zones:

**Public Subnets (for ALB and EC2):**
- Public Subnet 1: `10.0.1.0/24` (AZ-1)
- Public Subnet 2: `10.0.2.0/24` (AZ-2)

**Private Subnets (for RDS):**
- Private Subnet 1: `10.0.10.0/24` (AZ-1)
- Private Subnet 2: `10.0.11.0/24` (AZ-2)

### Create Internet Gateway
1. Create Internet Gateway
2. Attach to VPC

### Configure Route Tables
**Public Route Table:**
- Route: `0.0.0.0/0` → Internet Gateway
- Associate with Public Subnets

**Private Route Table:**
- No internet route (default local only)
- Associate with Private Subnets

---

## Step 2: Security Groups

### ALB Security Group
- **Name:** `student-app-alb-sg`
- **Inbound Rules:**
  - HTTP: Port 80, Source: `0.0.0.0/0`
  - HTTPS: Port 443, Source: `0.0.0.0/0` (optional)

### EC2 Security Group
- **Name:** `student-app-ec2-sg`
- **Inbound Rules:**
  - HTTP: Port 3000, Source: ALB Security Group
  - SSH: Port 22, Source: Your IP (for management)

### RDS Security Group
- **Name:** `student-app-rds-sg`
- **Inbound Rules:**
  - MySQL: Port 3306, Source: EC2 Security Group

---

## Step 3: RDS MySQL Database

### Create DB Subnet Group
1. Go to RDS Console → Subnet Groups
2. Create DB Subnet Group:
   - Name: `student-app-db-subnet-group`
   - Add Private Subnet 1 and Private Subnet 2

### Create RDS Instance
1. Go to RDS Console → Create Database
2. Configuration:
   - Engine: MySQL 8.0
   - Template: Free tier (or Dev/Test for POC)
   - DB Instance Identifier: `student-app-db`
   - Master Username: `admin`
   - Master Password: (create strong password)
   - Instance Class: `db.t3.micro` or `db.t4g.micro`
   - Storage: 20 GB GP2
   - VPC: Your VPC
   - Subnet Group: `student-app-db-subnet-group`
   - Public Access: **No**
   - VPC Security Group: `student-app-rds-sg`
   - Database Name: `student_records`

3. Wait for database to be available (~10 minutes)

### Create Database Schema
Connect to RDS from a bastion host or EC2 instance and run:

```sql
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  enrollmentDate DATE NOT NULL,
  major VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active',
  graduationYear INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);
```

---

## Step 4: AWS Secrets Manager

### Store RDS Credentials
1. Go to Secrets Manager Console
2. Create Secret:
   - Secret Type: Other type of secret
   - Key/Value pairs:
     ```json
     {
       "host": "student-app-db.xxxxxx.us-east-1.rds.amazonaws.com",
       "port": 3306,
       "username": "admin",
       "password": "your_password",
       "database": "student_records"
     }
     ```
   - Secret Name: `student-app/db-credentials`
   - Copy the ARN (you'll need this later)

---

## Step 5: IAM Role for EC2

### Create IAM Role
1. Go to IAM Console → Roles → Create Role
2. Trusted Entity: AWS Service → EC2
3. Attach Policies:
   - `AmazonSSMManagedInstanceCore` (for Systems Manager)
   - Create custom inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:student-app/db-credentials*"
    }
  ]
}
```

4. Role Name: `student-app-ec2-role`

---

## Step 6: EC2 Launch Template

### Build Application
On your local machine:

```bash
# Build Next.js application
npm run build

# Create deployment package
tar -czf student-app.tar.gz .next package.json package-lock.json public lib app next.config.ts
```

### Create Launch Template
1. Go to EC2 Console → Launch Templates → Create
2. Configuration:
   - Name: `student-app-launch-template`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: `t3.micro` or `t2.micro`
   - Key Pair: Select or create SSH key
   - Network Settings:
     - VPC: Your VPC
     - Security Group: `student-app-ec2-sg`
   - IAM Instance Profile: `student-app-ec2-role`
   - User Data (see below)

### User Data Script

```bash
#!/bin/bash
# Update system
apt-get update -y
apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create app directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Download and extract application
# Option 1: From S3 (recommended)
# aws s3 cp s3://your-bucket/student-app.tar.gz .
# tar -xzf student-app.tar.gz

# Option 2: Clone from repository
# git clone https://github.com/your-repo/student-app.git .
# npm ci --production

# Set environment variables
cat > .env.production.local <<EOF
USE_SECRETS_MANAGER=true
DB_SECRET_ARN=arn:aws:secretsmanager:REGION:ACCOUNT:secret:student-app/db-credentials
AWS_REGION=us-east-1
NODE_ENV=production
PORT=3000
EOF

# Start application with PM2
pm2 start npm --name "student-app" -- start
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Set ownership
chown -R ubuntu:ubuntu /home/ubuntu/app
```

---

## Step 7: Application Load Balancer

### Create Target Group
1. Go to EC2 Console → Target Groups → Create
2. Configuration:
   - Target Type: Instances
   - Name: `student-app-tg`
   - Protocol: HTTP
   - Port: 3000
   - VPC: Your VPC
   - Health Check:
     - Path: `/api/health`
     - Interval: 30 seconds
     - Timeout: 5 seconds
     - Healthy Threshold: 2
     - Unhealthy Threshold: 3

### Create Application Load Balancer
1. Go to EC2 Console → Load Balancers → Create
2. Configuration:
   - Type: Application Load Balancer
   - Name: `student-app-alb`
   - Scheme: Internet-facing
   - IP Address Type: IPv4
   - VPC: Your VPC
   - Availability Zones: Select Public Subnet 1 & 2
   - Security Group: `student-app-alb-sg`
   - Listener:
     - Protocol: HTTP
     - Port: 80
     - Default Action: Forward to `student-app-tg`

---

## Step 8: Auto Scaling Group

### Create Auto Scaling Group
1. Go to EC2 Console → Auto Scaling Groups → Create
2. Configuration:
   - Name: `student-app-asg`
   - Launch Template: `student-app-launch-template`
   - VPC: Your VPC
   - Subnets: Public Subnet 1 & 2
   - Load Balancing:
     - Attach to existing ALB
     - Target Group: `student-app-tg`
   - Health Checks:
     - ELB Health Checks: Enabled
     - Grace Period: 300 seconds
   - Group Size:
     - Desired: 2
     - Minimum: 1
     - Maximum: 4
   - Scaling Policies:
     - Target Tracking:
       - Metric: Average CPU Utilization
       - Target Value: 70%

---

## Step 9: Testing

### Access Application
1. Get ALB DNS Name:
   - EC2 Console → Load Balancers → Copy DNS Name
   - Example: `student-app-alb-123456789.us-east-1.elb.amazonaws.com`

2. Open in browser:
   ```
   http://student-app-alb-123456789.us-east-1.elb.amazonaws.com
   ```

### Verify Functionality
- View students list
- Add new student
- Edit student record
- Delete student record

### Test Health Check
```bash
curl http://your-alb-dns/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-17T15:13:00.000Z",
  "database": "connected"
}
```

---

## Step 10: Load Testing

### Install Apache Bench (ab)
```bash
# On Linux/Mac
sudo apt-get install apache2-utils  # Ubuntu/Debian
brew install ab                      # macOS

# On Windows
# Download from Apache website or use WSL
```

### Run Load Test
```bash
# Test with 1000 requests, 50 concurrent
ab -n 1000 -c 50 http://your-alb-dns/

# Monitor Auto Scaling
# Watch EC2 Console for new instances being launched
```

### Monitor Scaling
- CloudWatch → Metrics → EC2 → Auto Scaling Group
- Watch for:
  - CPU Utilization increase
  - New instances launching
  - Target Group healthy host count

---

## Maintenance and Monitoring

### CloudWatch Alarms
Create alarms for:
- High CPU Utilization (> 80%)
- Unhealthy Target Count (> 0)
- RDS CPU/Memory/Storage
- Application errors (from logs)

### Logs
- Application logs: EC2 instances (use CloudWatch Logs Agent)
- ALB Access logs: S3 bucket
- RDS logs: CloudWatch Logs

### Backup
- RDS: Enable automated backups (default)
- Retention period: 7 days minimum

---

## Cost Optimization

### Estimated Monthly Costs (POC)
- EC2 (2 x t3.micro): ~$15
- RDS (t3.micro): ~$15
- ALB: ~$20
- Data Transfer: ~$5
- **Total: ~$55/month**

### Cost Reduction Tips
1. Use Reserved Instances for predictable workloads
2. Schedule ASG to scale down during off-hours
3. Use RDS Multi-AZ only for production
4. Enable S3 lifecycle policies for logs

---

## Security Best Practices

1. **No Public RDS Access:** Database in private subnet only
2. **Secrets Manager:** No hardcoded credentials
3. **IAM Roles:** EC2 instances use IAM roles, not access keys
4. **Security Groups:** Minimal access, specific sources
5. **HTTPS:** Add SSL/TLS certificate via ACM (recommended for production)
6. **WAF:** Add AWS WAF for additional protection (optional)
7. **Regular Updates:** Keep OS and packages updated

---

## Troubleshooting

### Application Won't Start
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@instance-ip

# Check application logs
pm2 logs student-app

# Check PM2 status
pm2 status

# Restart application
pm2 restart student-app
```

### Database Connection Issues
- Verify Security Group allows EC2 → RDS on port 3306
- Check Secrets Manager credentials
- Test RDS connection from EC2:
  ```bash
  mysql -h your-rds-endpoint -u admin -p
  ```

### Load Balancer Issues
- Check Target Group health status
- Verify health check path `/api/health` returns 200
- Check Security Groups allow ALB → EC2 on port 3000

---

## Clean Up (After POC)

To avoid ongoing charges:
1. Delete Auto Scaling Group
2. Terminate EC2 instances
3. Delete Load Balancer
4. Delete Target Group
5. Delete RDS instance (create final snapshot)
6. Delete Secrets Manager secret
7. Delete IAM roles and policies
8. Delete Security Groups
9. Delete VPC (if not used elsewhere)

---

## Next Steps for Production

1. **HTTPS:** Add SSL/TLS certificate
2. **Custom Domain:** Route 53 + ACM
3. **Multi-Region:** For disaster recovery
4. **CI/CD:** CodePipeline or GitHub Actions
5. **Monitoring:** Enhanced monitoring with X-Ray
6. **Authentication:** Add Cognito or Auth0
7. **Rate Limiting:** API Gateway or WAF rules
8. **Data Encryption:** RDS encryption at rest

---

## Support

For issues or questions:
- AWS Documentation: https://docs.aws.amazon.com
- AWS Support: https://console.aws.amazon.com/support
- Next.js Documentation: https://nextjs.org/docs
