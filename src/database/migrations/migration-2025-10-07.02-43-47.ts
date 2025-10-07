import { Migration } from '@mikro-orm/migrations';

export class Migration20251007024347 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "organization" ("id" serial primary key, "domain" varchar(255) not null);`);

    this.addSql(`alter table "user" add column "organization_id" int null;`);
    this.addSql(`alter table "user" add constraint "user_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_organization_id_foreign";`);

    this.addSql(`drop table if exists "organization" cascade;`);

    this.addSql(`alter table "user" drop column "organization_id";`);
  }

}
