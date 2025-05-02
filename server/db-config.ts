// Import database configuration types
interface PostgresConfig {
  type: 'postgres';
  connectionString: string | undefined;
}

interface MySQLConfig {
  type: 'mysql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

type DrizzleConfig = PostgresConfig | MySQLConfig;

const dbType = process.env.DB_TYPE || 'postgres';

const postgresConfig: DrizzleConfig = {
  type: 'postgres',
  connectionString: process.env.DATABASE_URL
};

const mysqlConfig: DrizzleConfig = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || ''
};

export const dbConfig = dbType === 'mysql' ? mysqlConfig : postgresConfig;
export const databaseType = dbType;