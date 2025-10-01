# 🚀 NestJS + MikroORM Template

A **starter template** for building APIs with [NestJS](https://nestjs.com/) + [MikroORM](https://mikro-orm.io/) (PostgreSQL).
I use this as a foundation for real-world APIs and other templates.

✨ Features included out-of-the-box:

- 🐳 **Automatic dev environment setup** with Docker and utility scripts:
  - `setup:dev` → spin up containers & bootstrap your DB
  - `teardown:dev` → shut everything down
  - `reset:dev` → reset the environment

- 🧪 **Dedicated database for unit testing**

- ✅ **Declarative `.env` schema validation** with `class-validator` + `class-transformer`

- 📜 **Migrations** support

- 🌱 **Seeders** for test/sample data

- 🏗️ **Data layer foundation** with a very thin and extensible **Base Repository**
  - Provides simple CRUD helpers (`create`, `update`, `delete`, `findOneByPk`, etc.)
  - Easily extended for entity-specific repositories
  - Built with transaction-aware helpers (`withTrx`) for consistent DB operations

---

## 🛠️ How to Use This Template

1. **Pick your DB credentials**
   Choose a database name, username, and password.
   👉 Defaults:
   - DB name: `main`
   - User: `user`
   - Password: `password`

2. **Replace the defaults**
   Update all references to these values in:
   - `.example.env`
   - `.env`
   - `setup.sh`
     _(Tip: use a search + replace tool to make this quick!)_

3. **Spin up your dev environment**

   ```bash
   yarn setup:dev
   ```

4. 🎉 **Start building your API!**
