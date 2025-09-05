require('dotenv').config();

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 6431,
  username: process.env.DB_USERNAME || 'default_user',
  password: process.env.DB_PASSWORD || 'default_password',
  database: process.env.DB_DATABASE || 'default_db',
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};
