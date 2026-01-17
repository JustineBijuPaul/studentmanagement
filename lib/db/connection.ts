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
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_ARN,
      })
    );

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
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

  if (process.env.USE_SECRETS_MANAGER === 'true') {
    credentials = await getDbCredentialsFromSecretsManager();
  } else {
    credentials = getLocalDbCredentials();
  }

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
