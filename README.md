# todo-backend

## Setup

Add correct database credentials and dialect to `config/database.json`.
It should work with all dialects supported by sequelize but only tested with mySQL.

Create the mySQL database with `sequelize db:create` if it doesn't exist.

```bash
    sequelize db:create
```

Run migrations.

```bash
    sequelize db:migrate
```

Start the server.

```bash
    npm start
```

## Querying

### Login

```
    POST /login
```

#### Body

```json
{
  "username": "username",
  "password": "password"
}
```

### Register

```
    POST /register
```

#### Body

```json
{
  "username": "username",
  "password": "password"
}
```

### Change password

```
    PUT /user
```

#### Body

```json
{
  "username": "username",
  "password": "newPassword"
}
```

### Delete user

```
    DELETE /user
```

#### Body

```json
```

### Get all tasks

```
    GET /tasks
```

#### Body

```json
```

### Add task

```
    POST /tasks
```

#### Body

```json
{
  "task": "task"
}
```

### Update task

```
    PUT /tasks
```

#### Body

```json
{
  "uuid": "uuid",
  "task": "task",
  "completed": true
}
```

### Delete task

```
    DELETE /tasks
```

#### Body

```json
{
  "uuid": "uuid"
}
```
