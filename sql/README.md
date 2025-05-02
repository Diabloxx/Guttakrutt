# Database Setup Scripts for Guttakrutt Guild Website

This directory contains all the necessary SQL scripts to set up and maintain the database for the Guttakrutt Guild Website. The application supports both PostgreSQL and MySQL databases.

## Directory Structure

```
sql/
├── shared_schema_info.md    # Documentation of common schema elements
├── postgresql/              # PostgreSQL-specific scripts
│   ├── 01_init_schema.sql   # Initial schema creation
│   ├── 02_default_data.sql  # Default data insertion
│   ├── postgresql_master_setup.sql  # Master setup script
│   ├── migrations/          # Incremental schema changes
│   │   └── 001_add_character_fields.sql
│   └── utilities/           # Helper functions and utilities
│       └── postgres_json_helpers.sql
└── mysql/                   # MySQL-specific scripts
    ├── 01_init_schema.sql   # Initial schema creation
    ├── 02_default_data.sql  # Default data insertion
    ├── mysql_master_setup.sql  # Master setup script
    ├── migrations/          # Incremental schema changes
    │   └── 001_add_character_fields.sql
    └── utilities/           # Helper functions and utilities
        ├── mysql8_column_checker.sql
        ├── mysql_fix_zero_values.sql
        └── mysql_zero_value_converter.sql
```

## PostgreSQL Setup

To set up a new PostgreSQL database:

1. Create a PostgreSQL database:
   ```bash
   createdb guttakrutt_guild
   ```

2. Run the master setup script:
   ```bash
   cd sql/postgresql
   psql -U username -d guttakrutt_guild -f postgresql_master_setup.sql
   ```

## MySQL Setup

To set up a new MySQL database:

1. Create a MySQL database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE guttakrutt_guild CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. Run the master setup script:
   ```bash
   cd sql/mysql
   mysql -u username -p guttakrutt_guild < mysql_master_setup.sql
   ```

## Environment Configuration

After setting up the database, configure your environment variables accordingly:

### For PostgreSQL:
```
DB_TYPE=postgres
DATABASE_URL=postgresql://username:password@localhost:5432/guttakrutt_guild
```

### For MySQL:
```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=username
MYSQL_PASSWORD=password
MYSQL_DATABASE=guttakrutt_guild
```

## Adding New Migrations

When adding new database features:

1. Create a new migration script in the appropriate `migrations/` directory
2. Number it sequentially (e.g., `002_add_new_feature.sql`)
3. Update the `.env.example` file if necessary

## Database Type Detection

The application automatically detects the database type based on the `DB_TYPE` environment variable. If not specified, it defaults to PostgreSQL.