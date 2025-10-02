import { Migration } from '@mikro-orm/migrations';

export class Migration20251002201003 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "audit_log" ("uuid" uuid not null default gen_random_uuid(), "table_name" varchar(255) not null, "record_id" varchar(255) not null, "operation" varchar(255) not null, "diff" jsonb null, "created_at" timestamptz not null default now(), constraint "audit_log_pkey" primary key ("uuid"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_log" cascade;`);
  }

}
