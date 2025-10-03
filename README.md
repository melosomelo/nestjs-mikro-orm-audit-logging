# 🚀 NestJS + MikroORM + Audit Logging

This project is based on the [**nestjs-mikro-orm-template**](https://github.com/melosomelo/nestjs-mikro-orm-template),
and extends it with **audit logging**, implemented in a **non-intrusive, customizable way**.

Audit logging is enabled via **decorators**, integrated with a **ContextModule** that uses **Node.js AsyncLocalStorage** to automatically inject the current user from each request.

---

## 🔍 What is Audit Logging?

**Audit logging** means automatically recording important actions performed in your system.
It helps answer questions like:

- _Who_ made a change?
- _What_ was changed (before/after)?
- _When_ did it happen?

This is essential for:

- ✅ Security & compliance (e.g., GDPR, HIPAA, SOC2)
- 🐛 Debugging issues in production
- 📜 Transparency & accountability

---

## ✨ Audit Logging Features

- **Entity-level logging via decorators** → apply `@Auditable()` to any entity
- **Customizable operations** → optionally restrict which CRUD events are logged
- **Ignore sensitive fields** → exclude things like passwords with `@AuditIgnore()`
- **Automatic user attribution** → powered by a `ContextModule` built on **AsyncLocalStorage**
- **Structured audit entries** → logs stored in a dedicated table with full details

---

## 🛠️ Usage

### 1. Enable Audit Logging for an Entity

By default, `@Auditable()` logs **all CRUD operations** (`create`, `read`, `update`, `delete`):

```ts
@Entity()
@Auditable() // Logs Create, Read, Update, Delete by default
export class User {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  password: string;
}
```

### 2. Limit to Specific Operations

If you only want to log certain actions, pass them as arguments:

```ts
@Entity()
@Auditable([AuditLogOperation.Create, AuditLogOperation.Update])
export class Product {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;
}
```

### 3. Ignore Fields in Logs

```ts
@Entity()
export class User {
  @PrimaryKey()
  id: number;

  @Property()
  email: string;

  @Property()
  @AuditIgnore()
  password: string;
}
```

---

## 📊 Example Audit Log Entry

Based on the `AuditLog` entity:

```json
{
  "uuid": "b3c7f3c8-2a24-4c7d-9f6c-6a3b4f4b7e5a",
  "tableName": "user",
  "recordId": "42",
  "operation": "UPDATE",
  "diff": {
    "email": { "old": "old@mail.com", "new": "new@mail.com" }
  },
  "createdAt": "2025-10-03T14:12:00Z",
  "user": {
    "id": "admin-123",
    "email": "admin@mail.com"
  }
}
```

---

## ✅ When to Use

This project is ideal when you need:

- Transparent **audit trails** for compliance or debugging
- **Minimal boilerplate** logging (just decorators)
- Fine-grained control: **choose operations, ignore fields, capture user context**
- Reliable **request-scoped context** backed by **AsyncLocalStorage**
