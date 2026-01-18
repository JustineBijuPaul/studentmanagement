# Quick AWS Setup for EC2 Deployment

## Overview
This application is configured to use **AWS Secrets Manager** for database credentials when deployed on EC2, eliminating hardcoded credentials.

## Files Created
- [`.env.production`](.env.production) - Production environment template
- [`AWS_DEPLOYMENT_GUIDE.md`](AWS_DEPLOYMENT_GUIDE.md) - Detailed deployment steps
- [`setup-secrets-manager.sh`](setup-secrets-manager.sh) - Script to create AWS secret
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Full AWS infrastructure guide

## Quick Start for EC2 Deployment

### 1. Setup AWS Secrets Manager

**Option A: Use the automated script**
```bash
./setup-secrets-manager.sh
```

**Option B: Manual setup via AWS Console**
1. Go to AWS Secrets Manager
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Add key-value pairs:
   ```json
   {
     "host": "your-rds-endpoint.rds.amazonaws.com",
     "port": 3306,
     "username": "admin",
     "password": "YourSecurePassword",
     "database": "student_records"
   }
   ```
5. Name it: `rds-db-credentials`
6. Copy the Secret ARN

**Option C: Using AWS CLI**
```bash
aws secretsmanager create-secret \
    --name rds-db-credentials \
    --description "Student Management DB Credentials" \
    --secret-string '{"host":"your-endpoint","port":3306,"username":"admin","password":"pass","database":"student_records"}' \
    --region us-east-1
```

### 2. Update Environment Variables on EC2

Create/update `.env` file on your EC2 instance:
```bash
USE_SECRETS_MANAGER=true
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-credentials-AbCdEf
AWS_REGION=us-east-1
```

### 3. Ensure IAM Role is Attached

Your EC2 instance must have the **LabInstanceProfile** IAM role attached with this policy:

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
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:rds-db-credentials-*"
    }
  ]
}
```

### 4. Deploy Application

```bash
# On EC2 instance
npm install
npm run build
npm start

# Or with PM2
pm2 start npm --name "studentmanagement" -- start
```

## Local Development (XAMPP)

For local development with XAMPP, keep `USE_SECRETS_MANAGER=false` in `.env`:

```bash
USE_SECRETS_MANAGER=false
DB_HOST=localhost
DB_PORT=3306
DB_USER=studentuser
DB_PASSWORD=Student@123
DB_NAME=student_records
```

## How It Works

The application checks the `USE_SECRETS_MANAGER` environment variable:

- **`true`**: Fetches credentials from AWS Secrets Manager using the IAM role
- **`false`**: Uses credentials from environment variables (local development)

See [lib/db/connection.ts](lib/db/connection.ts) for implementation details.

## Troubleshooting

### Access Denied Error
```
Error: Access denied for user 'X'@'Y'
```
**Solution**: 
- Verify `USE_SECRETS_MANAGER=true` in .env
- Check IAM role is attached to EC2
- Verify Secret ARN is correct
- Ensure IAM role has `secretsmanager:GetSecretValue` permission

### Cannot Fetch Secret
```
Error fetching credentials from Secrets Manager
```
**Solution**:
- Check `DB_SECRET_ARN` is correct
- Verify `AWS_REGION` matches secret region
- Check EC2 security group allows outbound HTTPS (443)
- Verify IAM role permissions

### Test Secrets Manager Access
```bash
# On EC2 instance
aws secretsmanager get-secret-value \
    --secret-id rds-db-credentials \
    --region us-east-1
```

## Security Best Practices

✅ **Do:**
- Use AWS Secrets Manager for production
- Attach IAM roles to EC2 (not access keys)
- Keep `.env` out of version control
- Use different secrets for dev/staging/prod
- Rotate credentials regularly

❌ **Don't:**
- Commit `.env` files with real credentials
- Use hardcoded credentials in code
- Share AWS access keys
- Use root database user in production

## Additional Resources

- [Full Deployment Guide](DEPLOYMENT.md)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [EC2 IAM Roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
