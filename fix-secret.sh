#!/bin/bash
# Fix the secret structure in AWS Secrets Manager

echo "Updating AWS Secrets Manager secret..."
echo ""

aws secretsmanager update-secret \
  --secret-id student-db-secret \
  --secret-string '{
    "username":"admin",
    "password":"qwertyuiop",
    "host":"webapp-rds.ch5wpqv5ixo9.us-east-1.rds.amazonaws.com",
    "port":3306,
    "database":"studentdb"
  }' \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Secret updated successfully!"
    echo ""
    echo "The secret now uses 'database' instead of 'dbname'"
    echo "Region corrected to 'us-east-1' (not 'us-east-1a')"
    echo ""
    echo "On your EC2 instance, update .env file:"
    echo "AWS_REGION=us-east-1"
    echo ""
    echo "Then restart the application:"
    echo "pm2 restart studentmanagement"
else
    echo "❌ Failed to update secret"
fi
