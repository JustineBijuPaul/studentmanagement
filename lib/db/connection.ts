import mysql from 'mysql2/promise';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let pool: mysql.Pool | null = null;

interface DbCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

async function getDbCredentialsFromSecretsManager(): Promise<DbCredentials> {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  try {
    console.log('Fetching credentials from Secrets Manager...');
    console.log('Secret ARN:', process.env.DB_SECRET_ARN);
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');
    
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_ARN,
      })
    );

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      console.log('Successfully retrieved credentials from Secrets Manager');
      return {
        host: secret.host,
        port: secret.port || 3306,
        username: secret.username,
        password: secret.password,
        database: secret.database || 'student_records',
      };
    }
    throw new Error('Secret string not found');
  } catch (error) {
    console.error('Error fetching credentials from Secrets Manager:', error);
    console.error('Make sure:');
    console.error('1. DB_SECRET_ARN is set correctly in .env');
    console.error('2. IAM role (LabInstanceProfile) has secretsmanager:GetSecretValue permission');
    console.error('3. EC2 instance has the IAM role attached');
    throw error;
  }
}

function getLocalDbCredentials(): DbCredentials {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_records',
  };
}

export async function getDbConnection(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  let credentials: DbCredentials;

  const useSecretsManager = process.env.USE_SECRETS_MANAGER === 'true';
  console.log('USE_SECRETS_MANAGER:', useSecretsManager);

  if (useSecretsManager) {
    console.log('Using AWS Secrets Manager for database credentials');
    credentials = await getDbCredentialsFromSecretsManager();
  } else {
    console.log('Using local environment variables for database credentials');
    credentials = getLocalDbCredentials();
  }

  console.log('Connecting to database:', {
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    database: credentials.database,
  });

  pool = mysql.createPool({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
