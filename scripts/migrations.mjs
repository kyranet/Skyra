import { readFile } from 'fs/promises';
import typeorm from 'typeorm';
import dbConfig from '../dist/lib/database/database.config.js';

const { config } = dbConfig;

const [sqlScript, connection] = await Promise.all([
	readFile(new URL('SetMigrations.sql', import.meta.url), { encoding: 'utf-8' }),
	typeorm.createConnection({ ...config, logging: true })
]);

await connection.query(sqlScript);
