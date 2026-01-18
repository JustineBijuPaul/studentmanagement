const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('Setting up database...');
  
  // Get credentials from AWS Secrets Manager
  const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
  
  const secretArn = process.env.DB_SECRET_ARN || 'arn:aws:secretsmanager:us-east-1:408071407903:secret:student-db-secret-ieTvOg';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log('Fetching credentials from Secrets Manager...');
  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const secret = JSON.parse(response.SecretString);
  
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: secret.host,
    port: secret.port || 3306,
    user: secret.username,
    password: secret.password,
    database: secret.dbname || 'studentdb',
    multipleStatements: true
  });
  
  console.log('Connected successfully!');
  
  // Read schema file
  const schemaPath = path.join(__dirname, 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove the CREATE DATABASE and USE statements since we're already connected to the database
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.includes('CREATE DATABASE') && !s.includes('USE student_records'));
  
  console.log('Executing schema...');
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await connection.query(statement);
    }
  }
  
  console.log('Database setup completed successfully!');
  
  // Verify table was created
  const [tables] = await connection.query('SHOW TABLES');
  console.log('\nTables in database:', tables);
  
  const [count] = await connection.query('SELECT COUNT(*) as count FROM students');
  console.log('Student records:', count[0].count);
  
  await connection.end();
}

setupDatabase().catch(error => {
  console.error('Error setting up database:', error);
  process.exit(1);
});
