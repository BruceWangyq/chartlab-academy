import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["learner", "editor", "admin"]);
export const subscriptionStatus = pgEnum("subscription_status", ["inactive", "trialing", "active", "past_due", "canceled"]);
export const progressStatus = pgEnum("progress_status", ["not_started", "in_progress", "completed"]);
export const attemptStatus = pgEnum("attempt_status", ["draft", "submitted"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  role: userRole("role").notNull().default("learner"),
  locale: text("locale").notNull().default("zh-CN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
  anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  level: text("level"), goal: text("goal"), weeklyMinutes: integer("weekly_minutes"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  learningReminders: boolean("learning_reminders").notNull().default(true),
  lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"), stripeSubscriptionId: text("stripe_subscription_id"),
  planKey: text("plan_key").notNull(), status: subscriptionStatus("status").notNull().default("inactive"),
  periodEnd: timestamp("period_end", { withTimezone: true }), graceEndsAt: timestamp("grace_ends_at", { withTimezone: true }), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("subscriptions_stripe_unique").on(table.stripeSubscriptionId), index("subscriptions_user_idx").on(table.userId)]);

export const entitlements = pgTable("entitlements", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(), source: text("source").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (table) => [uniqueIndex("entitlements_user_key_unique").on(table.userId, table.key)]);

export const courseEnrollments = pgTable("course_enrollments", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), courseId: text("course_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.courseId] })]);

export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(), status: progressStatus("status").notNull().default("not_started"),
  positionSeconds: integer("position_seconds").notNull().default(0), contentVersion: text("content_version").notNull().default("v1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("lesson_progress_user_lesson_unique").on(table.userId, table.lessonId)]);

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull(), answers: jsonb("answers").notNull(), score: integer("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("quiz_attempts_user_quiz_idx").on(table.userId, table.quizId)]);

export const chartCases = pgTable("chart_cases", {
  id: text("id").primaryKey(), datasetRef: text("dataset_ref").notNull(), rubric: jsonb("rubric").notNull(),
  visibility: text("visibility").notNull().default("free"), publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const chartAttempts = pgTable("chart_attempts", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  caseId: text("case_id").notNull().references(() => chartCases.id), status: attemptStatus("status").notNull().default("draft"),
  snapshot: jsonb("snapshot").notNull(), score: jsonb("score"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
}, (table) => [index("chart_attempts_user_case_idx").on(table.userId, table.caseId)]);

export const annotations = pgTable("annotations", {
  id: uuid("id").defaultRandom().primaryKey(), attemptId: uuid("attempt_id").notNull().references(() => chartAttempts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), points: jsonb("points").notNull(), style: jsonb("style"), label: text("label"),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), targetId: text("target_id").notNull(), content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("notes_user_target_unique").on(table.userId, table.targetType, table.targetId)]);

export const bookmarks = pgTable("bookmarks", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), targetType: text("target_type").notNull(), targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.targetType, table.targetId] })]);

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(), provider: text("provider").notNull(), eventId: text("event_id").notNull(),
  status: text("status").notNull(), payloadHash: text("payload_hash").notNull(), attempts: integer("attempts").notNull().default(1),
  processedAt: timestamp("processed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("webhook_provider_event_unique").on(table.provider, table.eventId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), resource: text("resource").notNull(), metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_logs_actor_idx").on(table.actorId)]);
