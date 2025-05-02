// Database configuration types

export interface PostgresConfig {
  type: 'postgres';
  connectionString: string | undefined;
}

export interface MySQLConfig {
  type: 'mysql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export type DrizzleConfig = PostgresConfig | MySQLConfig;