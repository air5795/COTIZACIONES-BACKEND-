import { registerAs } from '@nestjs/config';
export default registerAs('config', () => {
  const db = `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=disable`;
  return {
    postgresUrl: db,
  };
});
