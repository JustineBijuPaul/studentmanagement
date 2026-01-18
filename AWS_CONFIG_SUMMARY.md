# AWS Credentials Configuration Summary

## ✅ Configuration Complete

Your Student Management application is now configured to use AWS Secrets Manager for secure credential management.

## What Was Done

### 1. Updated Database Connection Layer
- ✅ Enhanced [`lib/db/connection.ts`](lib/db/connection.ts) with better logging
- ✅ Added environment-based credential switching
- ✅ Supports both local development and AWS production

### 2. Created Configuration Files
- ✅ [`.env.production`](.env.production) - Production environment template
- ✅ [`AWS_SETUP.md`](AWS_SETUP.md) - Quick start guide
- ✅ [`AWS_DEPLOYMENT_GUIDE.md`](AWS_DEPLOYMENT_GUIDE.md) - Detailed deployment steps

### 3. Created Helper Scripts
- ✅ [`setup-secrets-manager.sh`](setup-secrets-manager.sh) - Automates secret creation
- ✅ [`test-aws-config.sh`](test-aws-config.sh) - Verifies EC2 configuration

### 4. Updated Documentation
- ✅ Updated [`README.md`](README.md) with AWS deployment section
- ✅ Enhanced [`DEPLOYMENT.md`](DEPLOYMENT.md) already had Secrets Manager setup

## How It Works

### Local Development (Current - XAMPP)
```env
# .env file
USE_SECRETS_MANAGER=false
DB_HOST=localhost
DB_PORT=3306
DB_USER=studentuser
DB_PASSWORD=Student@123
DB_NAME=student_records
```

The application connects directly to your local XAMPP MySQL database.

### AWS Production Deployment
```env
# .env file on EC2
USE_SECRETS_MANAGER=true
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-credentials-AbCdEf
AWS_REGION=us-east-1
```

The application:
1. Reads the `USE_SECRETS_MANAGER=true` flag
2. Uses EC2 IAM role (LabInstanceProfile) to authenticate
3. Fetches credentials from AWS Secrets Manager
4. Connects to RDS MySQL database

**No hardcoded credentials in code or version control!**

## Next Steps for AWS Deployment

### Step 1: Setup AWS Secrets Manager

**Option A - Use the script:**
```bash
# On your local machine with AWS CLI configured
./setup-secrets-manager.sh
```

**Option B - Manual via AWS Console:**
1. Go to AWS Secrets Manager
2. Create new secret with:
   ```json
   {
     "host": "your-rds-endpoint.rds.amazonaws.com",
     "port": 3306,
     "username": "admin",
     "password": "YourSecurePassword",
     "database": "student_records"
   }
   ```
3. Name: `rds-db-credentials`
4. Copy the Secret ARN

### Step 2: Launch EC2 Instance

1. **Launch EC2:**
   - AMI: Ubuntu 22.04
   - Instance Type: t3.micro
   - Subnet: Public subnet
   - Auto-assign Public IP: Enabled
   - **IAM Role: LabInstanceProfile** ← Critical!

2. **Configure Security Group:**
   - Inbound: SSH (22), HTTP (80), HTTPS (443)
   - Outbound: All traffic

### Step 3: Deploy Application on EC2

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Clone/upload your application:
```bash
mkdir -p ~/studentmanagement
cd ~/studentmanagement
# Upload your files via scp or git
```

Install dependencies:
```bash
npm install
```

Create `.env` file:
```bash
nano .env
```

Add:
```env
USE_SECRETS_MANAGER=true
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:rds-db-credentials-XXXXXX
AWS_REGION=us-east-1
```

Build and start:
```bash
npm run build
pm2 start npm --name "studentmanagement" -- start
pm2 save
pm2 startup
```

### Step 4: Verify Configuration

Run the test script:
```bash
./test-aws-config.sh
```

This will verify:
- ✅ EC2 instance has IAM role attached
- ✅ Secrets Manager is accessible
- ✅ Environment variables are correct
- ✅ Application is ready to run

### Step 5: Test the Application

Access your application:
```
http://your-ec2-public-ip:3000
```

Check logs:
```bash
pm2 logs studentmanagement
```

## Security Benefits

### Before (Hardcoded)
❌ Database credentials in `.env` file
❌ Risk of committing secrets to Git
❌ Manual credential rotation
❌ Difficult to manage across environments

### After (Secrets Manager)
✅ Credentials stored securely in AWS
✅ No secrets in code or version control
✅ IAM role-based authentication
✅ Easy credential rotation
✅ Audit trail via CloudTrail
✅ Environment-specific secrets

## Troubleshooting

### Error: Access Denied
```
Error: Access denied for user 'studentuser'@'localhost'
```

**Cause:** Application is still using local .env config

**Solution:**
1. Check `.env` has `USE_SECRETS_MANAGER=true`
2. Restart the application
3. Clear Next.js cache: `rm -rf .next`

### Error: Cannot fetch secret
```
Error fetching credentials from Secrets Manager
```

**Cause:** IAM role or permissions issue

**Solution:**
1. Verify EC2 has LabInstanceProfile attached:
   ```bash
   curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```
2. Verify Secret ARN is correct in `.env`
3. Check region matches: `AWS_REGION=us-east-1`
4. Test manually:
   ```bash
   aws secretsmanager get-secret-value --secret-id rds-db-credentials --region us-east-1
   ```

### Error: Invalid Secret ARN
**Solution:** Copy the full ARN from AWS Secrets Manager console

### Application won't start
**Solution:**
```bash
# Check logs
pm2 logs studentmanagement

# Restart
pm2 restart studentmanagement

# Rebuild
npm run build
pm2 restart studentmanagement
```

## Files Reference

| File | Purpose |
|------|---------|
| [lib/db/connection.ts](lib/db/connection.ts) | Database connection with Secrets Manager integration |
| [.env](.env) | Local development configuration (XAMPP) |
| [.env.production](.env.production) | Template for production (EC2) |
| [AWS_SETUP.md](AWS_SETUP.md) | Quick start guide |
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | Detailed deployment instructions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Full AWS infrastructure guide |
| [setup-secrets-manager.sh](setup-secrets-manager.sh) | Automated secret creation |
| [test-aws-config.sh](test-aws-config.sh) | Configuration verification |

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [EC2 IAM Roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Status:** ✅ Ready for AWS deployment with secure credential management!
