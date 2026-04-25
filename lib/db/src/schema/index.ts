import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "faculty",
  "coordinator",
  "society_head",
  "admin",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "seminar",
  "workshop",
  "competition",
  "sports",
  "society",
  "cultural",
  "technical",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "absent",
  "present",
  "late",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  role: userRoleEnum("role").notNull(),
  department: varchar("department", { length: 200 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  category: eventCategoryEnum("category").notNull(),
  status: eventStatusEnum("status").notNull().default("pending"),
  organizerId: integer("organizer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  venue: varchar("venue", { length: 300 }).notNull(),
  capacity: integer("capacity").notNull(),
  bannerUrl: text("banner_url"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const registrationsTable = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueEventUser: uniqueIndex("registrations_event_user_unique").on(
      t.eventId,
      t.userId,
    ),
  }),
);

export const attendanceTable = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    registrationId: integer("registration_id")
      .notNull()
      .references(() => registrationsTable.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("absent"),
    markedAt: timestamp("marked_at", { withTimezone: true }),
  },
  (t) => ({
    uniqueRegistration: uniqueIndex("attendance_registration_unique").on(
      t.registrationId,
    ),
  }),
);

export const certificatesTable = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull().unique(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueEventUser: uniqueIndex("certificates_event_user_unique").on(
      t.eventId,
      t.userId,
    ),
  }),
);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body").notNull(),
  eventId: integer("event_id").references(() => eventsTable.id, {
    onDelete: "set null",
  }),
  isRead: integer("is_read").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const feedbackTable = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueEventUser: uniqueIndex("feedback_event_user_unique").on(
      t.eventId,
      t.userId,
    ),
  }),
);
