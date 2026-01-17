import mysql from 'mysql2/promise';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Database credentials interface
interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// Connection pool variable
let pool: mysql.Pool | null = null;

/**
 * Fetch database credentials from AWS Secrets Manager
 */
async function getDatabaseCredentials(): Promise<DatabaseCredentials> {
  const secretName = process.env.AWS_SECRET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!secretName) {
    throw new Error('AWS_SECRET_NAME environment variable is not set');
  }

  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }

    const secret = JSON.parse(response.SecretString);

    return {
      host: secret.host,
      port: secret.port || 3306,
      username: secret.username,
      password: secret.password,
      database: secret.database || 'studentdb',
    };
  } catch (error) {
    console.error('Error retrieving secret from AWS Secrets Manager:', error);
    throw error;
  }
}

/**
 * Get or create MySQL connection pool
 */
export async function getPool(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  // For local development, use environment variables directly
  if (process.env.NODE_ENV === 'development' && process.env.DB_HOST) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'studentdb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('Database pool created using local environment variables');
    return pool;
  }

  // For production, use AWS Secrets Manager
  try {
    const credentials = await getDatabaseCredentials();

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

    console.log('Database pool created using AWS Secrets Manager credentials');
    return pool;
  } catch (error) {
    console.error('Failed to create database pool:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Execute a query on the database
 */
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const connection = await getPool();
  const [rows] = await connection.execute(sql, params);
  return rows as T;
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}
