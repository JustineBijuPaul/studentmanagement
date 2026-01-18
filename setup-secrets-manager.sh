#!/bin/bash
# AWS Secrets Manager Setup Script
# Run this script to create the database credentials secret in AWS Secrets Manager

set -e

echo "=== AWS Secrets Manager Setup for Student Management App ==="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

echo "✓ AWS CLI is installed"
echo ""

# Prompt for values
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Enter RDS Endpoint (e.g., mydb.xxx.rds.amazonaws.com): " RDS_HOST
if [ -z "$RDS_HOST" ]; then
    echo "❌ RDS Endpoint is required"
    exit 1
fi

read -p "Enter Database Name (default: student_records): " DB_NAME
DB_NAME=${DB_NAME:-student_records}

read -p "Enter Database Username (default: admin): " DB_USER
DB_USER=${DB_USER:-admin}

read -sp "Enter Database Password: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Database Password is required"
    exit 1
fi

read -p "Enter Database Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

# Create secret JSON
SECRET_JSON=$(cat <<EOF
{
  "host": "$RDS_HOST",
  "port": $DB_PORT,
  "username": "$DB_USER",
  "password": "$DB_PASSWORD",
  "database": "$DB_NAME"
}
EOF
)

echo ""
echo "Creating secret in AWS Secrets Manager..."
echo ""

# Create or update the secret
SECRET_NAME="rds-db-credentials"
SECRET_ARN=$(aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Database credentials for Student Management Application" \
    --secret-string "$SECRET_JSON" \
    --region "$AWS_REGION" \
    --query 'ARN' \
    --output text 2>&1) || \
SECRET_ARN=$(aws secretsmanager update-secret \
    --secret-id "$SECRET_NAME" \
    --secret-string "$SECRET_JSON" \
    --region "$AWS_REGION" \
    --query 'ARN' \
    --output text 2>&1)

if [ $? -eq 0 ]; then
    echo "✓ Secret created/updated successfully!"
    echo ""
    echo "Secret ARN: $SECRET_ARN"
    echo ""
    echo "Update your .env file with:"
    echo "USE_SECRETS_MANAGER=true"
    echo "DB_SECRET_ARN=$SECRET_ARN"
    echo "AWS_REGION=$AWS_REGION"
    echo ""
    echo "✓ Setup complete!"
else
    echo "❌ Failed to create secret"
    echo "$SECRET_ARN"
    exit 1
fi
