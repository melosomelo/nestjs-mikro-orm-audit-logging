import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min, validateSync } from 'class-validator';
import { config as dotenvConfig } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(dotenvConfig());

export enum NodeEnvironment {
  Development = 'dev',
  Testing = 'test',
  Production = 'prod',
}

export class Env {
  @IsEnum(NodeEnvironment)
  NODE_ENV!: NodeEnvironment;

  @IsInt()
  @Min(0)
  PORT!: number;

  @IsString()
  DB_HOST!: string;

  @IsInt()
  @Min(0)
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(Env, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errStr = [
      'Environment file validation has failed',
      ...errors.flatMap((e) => [
        `\t${e.property}:`,
        ...Object.values(e.constraints!).map((c) => `\t- ${c}`),
      ]),
    ].join('\n');

    throw new Error(errStr);
  }

  return validatedConfig;
}

export const env = process.env as unknown as Env;
