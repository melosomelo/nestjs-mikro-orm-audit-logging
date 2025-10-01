import { env, NodeEnvironment } from '@/env/env';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import _ from 'lodash';
import { DateTime } from 'luxon';

export default defineConfig({
  extensions: [Migrator, SeedManager],
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  dbName: env.DB_NAME,
  metadataProvider: TsMorphMetadataProvider,
  entitiesTs: ['./**/*.entity.ts'],
  discovery: {
    warnWhenNoEntities: false,
  },
  migrations: {
    pathTs: './src/database/migrations',
    fileName: (timestamp) =>
      `migration-${DateTime.fromFormat(timestamp, 'yyyyMMddHHmmss').toFormat('yyyy-MM-dd.HH-mm-ss')}`,
  },
  seeder: {
    pathTs: './src/database/seeders',
    fileName: (className: string) =>
      `${_.kebabCase(className.replace(/Seeder$/, ''))}.seeder`,
  },
  debug: env.NODE_ENV !== NodeEnvironment.Production,
});
