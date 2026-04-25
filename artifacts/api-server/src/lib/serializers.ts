import type {
  usersTable,
  eventsTable,
  registrationsTable,
  attendanceTable,
  certificatesTable,
  notificationsTable,
  feedbackTable,
} from "@workspace/db";

type UserRow = typeof usersTable.$inferSelect;
type EventRow = typeof eventsTable.$inferSelect;
type RegistrationRow = typeof registrationsTable.$inferSelect;
type AttendanceRow = typeof attendanceTable.$inferSelect;
type CertificateRow = typeof certificatesTable.$inferSelect;
type NotificationRow = typeof notificationsTable.$inferSelect;
type FeedbackRow = typeof feedbackTable.$inferSelect;

export function serializeUser(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department ?? null,
    registrationNumber: u.registrationNumber ?? null,
    avatarUrl: u.avatarUrl ?? null,
  };
}

export function serializeEvent(
  e: EventRow,
  organizer: { name: string; role: UserRow["role"] },
  registrationCount: number,
) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    status: e.status,
    organizerId: e.organizerId,
    organizerName: organizer.name,
    organizerRole: organizer.role,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    venue: e.venue,
    capacity: e.capacity,
    registrationCount,
    bannerUrl: e.bannerUrl ?? null,
    rejectionReason: e.rejectionReason ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

export function serializeRegistration(
  r: RegistrationRow,
  user: UserRow,
) {
  return {
    id: r.id,
    eventId: r.eventId,
    userId: r.userId,
    userName: user.name,
    userEmail: user.email,
    userDepartment: user.department ?? null,
    registeredAt: r.registeredAt.toISOString(),
  };
}

export function serializeAttendanceRow(
  reg: RegistrationRow,
  user: UserRow,
  att: AttendanceRow | null,
) {
  return {
    registrationId: reg.id,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userDepartment: user.department ?? null,
    status: (att?.status ?? "absent") as "absent" | "present" | "late",
    markedAt: att?.markedAt ? att.markedAt.toISOString() : null,
  };
}

export function serializeCertificate(c: CertificateRow) {
  return {
    id: c.id,
    eventId: c.eventId,
    userId: c.userId,
    code: c.code,
    issuedAt: c.issuedAt.toISOString(),
  };
}

export function serializeNotification(n: NotificationRow) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    body: n.body,
    eventId: n.eventId ?? null,
    createdAt: n.createdAt.toISOString(),
    isRead: n.isRead === 1,
  };
}

export function serializeFeedback(f: FeedbackRow, user: UserRow) {
  return {
    id: f.id,
    eventId: f.eventId,
    userId: f.userId,
    userName: user.name,
    rating: f.rating,
    comment: f.comment ?? null,
    createdAt: f.createdAt.toISOString(),
  };
}
