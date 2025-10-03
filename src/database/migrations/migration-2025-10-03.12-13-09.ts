import { Migration } from '@mikro-orm/migrations';

export class Migration20251003121309 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "audit_log" add column "user_id" int null;`);
    this.addSql(`alter table "audit_log" add constraint "audit_log_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "audit_log" drop constraint "audit_log_user_id_foreign";`);

    this.addSql(`alter table "audit_log" drop column "user_id";`);
  }

}
