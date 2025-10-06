import { Migration } from '@mikro-orm/migrations';

export class Migration20251006162859 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "address_street" varchar(255) not null, add column "address_postal_code" varchar(255) not null, add column "address_city" varchar(255) not null, add column "address_country" varchar(255) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "address_street", drop column "address_postal_code", drop column "address_city", drop column "address_country";`);
  }

}
