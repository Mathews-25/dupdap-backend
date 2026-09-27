import { createConnection } from 'typeorm';
import { seedDatabase } from './db-seed';

const ALLOWED_ENVIRONMENTS = ['development', 'test'];
const FORCE_FLAGS = ['--yes-i-am-sure', '--force'];

async function main() {
  const nodeEnv = process.env.NODE_ENV;
  const force = process.argv.some((arg) => FORCE_FLAGS.includes(arg));

  if (!ALLOWED_ENVIRONMENTS.includes(nodeEnv ?? '') && !force) {
    console.error(
      `Refusing to reset the database: NODE_ENV is '${nodeEnv ?? 'undefined'}', which is not one of ${ALLOWED_ENVIRONMENTS.join(
        ', ',
      )}.`,
    );
    console.error(
      'This command drops the entire public schema and destroys all data. If you really intend to run it against this environment, re-run with --yes-i-am-sure.',
    );
    process.exit(1);
  }

  const database =
    nodeEnv === 'test'
      ? process.env.DB_NAME_TEST || 'dupdub_test'
      : process.env.DB_NAME || 'dupdub';

  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
  });

  await connection.query('DROP SCHEMA public CASCADE');
  await connection.query('CREATE SCHEMA public');

  await connection.runMigrations();
  await seedDatabase(connection, nodeEnv === 'test');

  await connection.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
