CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY,
  "title" varchar(120) NOT NULL,
  CONSTRAINT "tasks_title_nonempty" CHECK (length(trim("title")) > 0)
);
