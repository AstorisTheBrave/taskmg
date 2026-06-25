# plan.md

## Roles

### ADMIN

Permissions:

* create_task
* update_task
* delete_task
* assign_task
* view_all_tasks
* manage_users
* view_activity_logs

### MEMBER

Permissions:

* view_assigned_tasks
* update_assigned_tasks
* create_comments

---

## Task Status

```ts
enum TaskStatus {
  TODO,
  IN_PROGRESS,
  REVIEW,
  DONE
}
```

---

## Task Priority

```ts
enum TaskPriority {
  LOW,
  MEDIUM,
  HIGH
}
```

---

## Database
????

### users

```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
role TEXT NOT NULL

created_at TIMESTAMP
updated_at TIMESTAMP
```

### tasks

```sql
id UUID PRIMARY KEY

title TEXT NOT NULL
description TEXT

status TEXT NOT NULL
priority TEXT NOT NULL

due_date TIMESTAMP

assigned_to UUID NOT NULL
created_by UUID NOT NULL

created_at TIMESTAMP
updated_at TIMESTAMP

FOREIGN KEY (assigned_to) REFERENCES users(id)
FOREIGN KEY (created_by) REFERENCES users(id)
```

### comments

```sql
id UUID PRIMARY KEY

task_id UUID NOT NULL
user_id UUID NOT NULL

content TEXT NOT NULL

created_at TIMESTAMP

FOREIGN KEY (task_id) REFERENCES tasks(id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

### activity_logs

```sql
id UUID PRIMARY KEY

task_id UUID
user_id UUID

action TEXT NOT NULL
metadata JSONB

created_at TIMESTAMP

FOREIGN KEY (task_id) REFERENCES tasks(id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

---

## Authorization

### Update Task

```ts
if (user.role !== "ADMIN") {
  if (task.assigned_to !== user.id) {
    throw new ForbiddenError();
  }
}
```

### Delete Task

```ts
if (user.role !== "ADMIN") {
  throw new ForbiddenError();
}
```

### Assign Task

```ts
if (user.role !== "ADMIN") {
  throw new ForbiddenError();
}
```

### View Task

```ts
if (user.role === "ADMIN") {
  allow();
}

if (task.assigned_to === user.id) {
  allow();
}

deny();
```

---

## API

### Tasks

```http
GET    /tasks
GET    /tasks/:id

POST   /tasks

PATCH  /tasks/:id

DELETE /tasks/:id
```

### Assignment

```http
PATCH /tasks/:id/assign
```

Body:

```json
{
  "assignedTo": "user-id"
}
```

### Status

```http
PATCH /tasks/:id/status
```

Body:

```json
{
  "status": "IN_PROGRESS"
}
```

### Comments

```http
GET  /tasks/:id/comments

POST /tasks/:id/comments
```

### Users

```http
GET  /users
POST /users
PATCH /users/:id
DELETE /users/:id
```

### Activity

```http
GET /activity
```

---

## Dashboard Queries

### Assigned To Me

```sql
SELECT *
FROM tasks
WHERE assigned_to = :user_id;
```

### Overdue

```sql
SELECT *
FROM tasks
WHERE due_date < NOW()
AND status != 'DONE';
```

### Completed

```sql
SELECT *
FROM tasks
WHERE status = 'DONE';
```

---

## Activity Events

```text
TASK_CREATED
TASK_UPDATED
TASK_DELETED
TASK_ASSIGNED
TASK_STATUS_CHANGED
COMMENT_CREATED
USER_CREATED
USER_UPDATED
USER_DELETED
```

---

## Validation

### Create Task

Required:

```text
title
priority
assigned_to
```

### Update Status

Allowed:

```text
TODO
IN_PROGRESS
REVIEW
DONE
```

### Assign Task

```text
assigned_to must exist
assigned_to must be MEMBER or ADMIN
```

---

## MVP

* Auth
* RBAC
* CRUD Tasks
* Assign Tasks
* Status Updates
* Comments
* Dashboard
* Activity Logs
* Search
* Filters
