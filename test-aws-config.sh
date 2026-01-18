#!/bin/bash
# Test AWS Credentials and Secrets Manager Access
# Run this script on your EC2 instance to verify configuration

echo "=== AWS Configuration Test ==="
echo ""

# Check if running on EC2
echo "1. Checking if running on EC2..."
if curl -s --max-time 2 http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    echo "✓ Running on EC2 instance: $INSTANCE_ID"
else
    echo "❌ Not running on EC2 instance"
    echo "This test should be run on an EC2 instance with IAM role attached"
fi
echo ""

# Check IAM role
echo "2. Checking IAM role..."
IAM_ROLE=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null)
if [ -n "$IAM_ROLE" ]; then
    echo "✓ IAM Role attached: $IAM_ROLE"
else
    echo "❌ No IAM role attached to this instance"
    echo "   Please attach LabInstanceProfile to your EC2 instance"
fi
echo ""

# Check AWS CLI
echo "3. Checking AWS CLI..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    echo "✓ AWS CLI installed: $AWS_VERSION"
else
    echo "❌ AWS CLI not installed"
    echo "   Install with: sudo apt install awscli -y"
fi
echo ""

# Check environment variables
echo "4. Checking environment variables..."
if [ -f .env ]; then
    echo "✓ .env file found"
    if grep -q "USE_SECRETS_MANAGER=true" .env; then
        echo "✓ USE_SECRETS_MANAGER is set to true"
    else
        echo "⚠ USE_SECRETS_MANAGER is not set to true"
    fi
    
    if grep -q "DB_SECRET_ARN=" .env; then
        SECRET_ARN=$(grep "DB_SECRET_ARN=" .env | cut -d'=' -f2)
        echo "✓ DB_SECRET_ARN is set: $SECRET_ARN"
    else
        echo "❌ DB_SECRET_ARN is not set"
    fi
    
    if grep -q "AWS_REGION=" .env; then
        REGION=$(grep "AWS_REGION=" .env | cut -d'=' -f2)
        echo "✓ AWS_REGION is set: $REGION"
    else
        echo "⚠ AWS_REGION is not set (will use default: us-east-1)"
        REGION="us-east-1"
    fi
else
    echo "❌ .env file not found"
    exit 1
fi
echo ""

# Test Secrets Manager access
echo "5. Testing Secrets Manager access..."
if [ -n "$SECRET_ARN" ] && command -v aws &> /dev/null; then
    echo "Attempting to fetch secret..."
    SECRET_TEST=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_ARN" \
        --region "$REGION" \
        --query 'SecretString' \
        --output text 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully retrieved secret from Secrets Manager"
        echo ""
        echo "Secret contents (masked):"
        echo "$SECRET_TEST" | jq -r 'to_entries | .[] | "\(.key): " + (if .key == "password" then "****" else (.value | tostring) end)'
    else
        echo "❌ Failed to retrieve secret"
        echo "$SECRET_TEST"
        echo ""
        echo "Common issues:"
        echo "- IAM role doesn't have secretsmanager:GetSecretValue permission"
        echo "- Secret ARN is incorrect"
        echo "- Region mismatch"
    fi
else
    echo "⚠ Skipping Secrets Manager test (AWS CLI or SECRET_ARN not available)"
fi
echo ""

# Check Node.js
echo "6. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not installed"
fi
echo ""

# Check if app is built
echo "7. Checking Next.js build..."
if [ -d ".next" ]; then
    echo "✓ Next.js build found"
else
    echo "⚠ Next.js build not found. Run: npm run build"
fi
echo ""

echo "=== Test Complete ==="
echo ""
echo "Summary:"
echo "--------"
if [ -n "$IAM_ROLE" ] && [ -n "$SECRET_ARN" ] && [ $? -eq 0 ]; then
    echo "✅ Configuration looks good! You should be able to run the application."
    echo ""
    echo "To start the application:"
    echo "  npm start          # Development"
    echo "  pm2 start npm --name studentmanagement -- start  # Production"
else
    echo "⚠️  Some issues detected. Please review the output above."
fi
