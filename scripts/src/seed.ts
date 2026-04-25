import {
  db,
  usersTable,
  eventsTable,
  registrationsTable,
  attendanceTable,
  certificatesTable,
  notificationsTable,
  feedbackTable,
} from "@workspace/db";

async function main() {
  // Wipe (in dependency order)
  await db.delete(notificationsTable);
  await db.delete(feedbackTable);
  await db.delete(certificatesTable);
  await db.delete(attendanceTable);
  await db.delete(registrationsTable);
  await db.delete(eventsTable);
  await db.delete(usersTable);

  console.log("Seeding users...");
  const users = await db
    .insert(usersTable)
    .values([
      // Students (10)
      {
        name: "Ayesha Khan",
        email: "ayesha.khan@cusit.edu.pk",
        role: "student",
        department: "Computer Science",
        registrationNumber: "FA22-BCS-001",
      },
      {
        name: "Hamza Iqbal",
        email: "hamza.iqbal@cusit.edu.pk",
        role: "student",
        department: "Computer Science",
        registrationNumber: "FA22-BCS-014",
      },
      {
        name: "Fatima Saleem",
        email: "fatima.saleem@cusit.edu.pk",
        role: "student",
        department: "Software Engineering",
        registrationNumber: "FA22-BSE-022",
      },
      {
        name: "Bilal Ahmed",
        email: "bilal.ahmed@cusit.edu.pk",
        role: "student",
        department: "Electrical Engineering",
        registrationNumber: "FA23-BEE-007",
      },
      {
        name: "Sana Tariq",
        email: "sana.tariq@cusit.edu.pk",
        role: "student",
        department: "Business Administration",
        registrationNumber: "FA23-BBA-031",
      },
      {
        name: "Usman Raza",
        email: "usman.raza@cusit.edu.pk",
        role: "student",
        department: "Computer Science",
        registrationNumber: "FA21-BCS-045",
      },
      {
        name: "Mariam Shahid",
        email: "mariam.shahid@cusit.edu.pk",
        role: "student",
        department: "Mathematics",
        registrationNumber: "FA22-BMTH-012",
      },
      {
        name: "Zain Abbas",
        email: "zain.abbas@cusit.edu.pk",
        role: "student",
        department: "Software Engineering",
        registrationNumber: "FA22-BSE-009",
      },
      {
        name: "Hira Naveed",
        email: "hira.naveed@cusit.edu.pk",
        role: "student",
        department: "Computer Science",
        registrationNumber: "FA23-BCS-019",
      },
      {
        name: "Daniyal Rauf",
        email: "daniyal.rauf@cusit.edu.pk",
        role: "student",
        department: "Electrical Engineering",
        registrationNumber: "FA21-BEE-038",
      },

      // Faculty
      {
        name: "Dr. Saqib Mehmood",
        email: "saqib.mehmood@cusit.edu.pk",
        role: "faculty",
        department: "Computer Science",
      },
      {
        name: "Dr. Nazia Anwar",
        email: "nazia.anwar@cusit.edu.pk",
        role: "faculty",
        department: "Software Engineering",
      },

      // Coordinators
      {
        name: "Mr. Adnan Latif",
        email: "adnan.latif@cusit.edu.pk",
        role: "coordinator",
        department: "Student Affairs",
      },

      // Society heads
      {
        name: "Hassan Javed",
        email: "hassan.javed@cusit.edu.pk",
        role: "society_head",
        department: "ACM Society",
      },
      {
        name: "Rabia Sohail",
        email: "rabia.sohail@cusit.edu.pk",
        role: "society_head",
        department: "Literary Society",
      },

      // Admin / SLC
      {
        name: "Prof. Tariq Mahmood",
        email: "slc.office@cusit.edu.pk",
        role: "admin",
        department: "Student Liaison Committee",
      },
    ])
    .returning();

  const byEmail = new Map(users.map((u) => [u.email, u] as const));
  const u = (e: string) => byEmail.get(e)!;

  console.log("Seeding events...");
  const now = new Date();
  const day = (offset: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const events = await db
    .insert(eventsTable)
    .values([
      {
        title: "AI in Education: Opportunities and Challenges",
        description:
          "A keynote seminar exploring how artificial intelligence is reshaping teaching, learning, and academic research in Pakistani universities. Featuring industry speakers and an open Q&A.",
        category: "seminar",
        status: "approved",
        organizerId: u("saqib.mehmood@cusit.edu.pk").id,
        startsAt: day(5, 11),
        endsAt: day(5, 13),
        venue: "Main Auditorium, Block A",
        capacity: 200,
        bannerUrl:
          "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&q=80",
      },
      {
        title: "CUSIT Hackathon 2026: Build for Good",
        description:
          "A 24-hour hackathon for student teams to build solutions for real social-impact problems. Cash prizes, mentorship, and free meals included. Open to all departments.",
        category: "competition",
        status: "approved",
        organizerId: u("hassan.javed@cusit.edu.pk").id,
        startsAt: day(12, 9),
        endsAt: day(13, 9),
        venue: "Computing Lab Complex",
        capacity: 80,
        bannerUrl:
          "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80",
      },
      {
        title: "Web Development Bootcamp with React",
        description:
          "Hands-on workshop introducing modern React, Vite, and TypeScript. Bring your laptop. Suitable for second-year students and above.",
        category: "workshop",
        status: "approved",
        organizerId: u("nazia.anwar@cusit.edu.pk").id,
        startsAt: day(2, 14),
        endsAt: day(2, 17),
        venue: "Lab 3, Block B",
        capacity: 40,
        bannerUrl:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
      },
      {
        title: "Inter-Department Cricket Tournament",
        description:
          "Annual inter-departmental cricket competition. Form your team and represent your department. Lunch and prizes provided.",
        category: "sports",
        status: "approved",
        organizerId: u("adnan.latif@cusit.edu.pk").id,
        startsAt: day(8, 9),
        endsAt: day(8, 18),
        venue: "University Sports Ground",
        capacity: 120,
        bannerUrl:
          "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80",
      },
      {
        title: "Cultural Night 2026",
        description:
          "Celebrate the diversity of Pakistan with music, dance, regional food stalls, and student performances. All families welcome.",
        category: "cultural",
        status: "approved",
        organizerId: u("rabia.sohail@cusit.edu.pk").id,
        startsAt: day(20, 18),
        endsAt: day(20, 22),
        venue: "University Lawn",
        capacity: 500,
        bannerUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
      },
      {
        title: "Career Fair: Tech & Beyond",
        description:
          "Meet recruiters from leading Pakistani and international tech companies. Bring printed CVs. CV review desk on-site.",
        category: "seminar",
        status: "approved",
        organizerId: u("slc.office@cusit.edu.pk").id,
        startsAt: day(15, 10),
        endsAt: day(15, 16),
        venue: "Main Hall",
        capacity: 300,
        bannerUrl:
          "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
      },
      {
        title: "Cybersecurity Awareness Workshop",
        description:
          "Learn the fundamentals of staying safe online — phishing, password hygiene, and basic threat modelling. Hosted by the IT department.",
        category: "workshop",
        status: "approved",
        organizerId: u("saqib.mehmood@cusit.edu.pk").id,
        startsAt: day(-7, 14),
        endsAt: day(-7, 16),
        venue: "Seminar Room 2",
        capacity: 60,
        bannerUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
      },
      {
        title: "Literary Evening: Urdu Poetry Mushaira",
        description:
          "An evening of Urdu poetry recitation by students and faculty. Open mic available for new poets. Tea and snacks served.",
        category: "society",
        status: "approved",
        organizerId: u("rabia.sohail@cusit.edu.pk").id,
        startsAt: day(-3, 17),
        endsAt: day(-3, 20),
        venue: "Library Reading Hall",
        capacity: 100,
        bannerUrl:
          "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
      },

      // Pending approvals
      {
        title: "Robotics Showcase",
        description:
          "Final-year robotics projects on display. Includes autonomous vehicles, drones, and IoT-based home automation prototypes.",
        category: "technical",
        status: "pending",
        organizerId: u("hassan.javed@cusit.edu.pk").id,
        startsAt: day(25, 10),
        endsAt: day(25, 16),
        venue: "Engineering Block Atrium",
        capacity: 150,
        bannerUrl:
          "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=1200&q=80",
      },
      {
        title: "Mental Health & Wellness Talk",
        description:
          "Open conversation with a clinical psychologist about exam stress, sleep, and student wellbeing. Confidential and free.",
        category: "seminar",
        status: "pending",
        organizerId: u("adnan.latif@cusit.edu.pk").id,
        startsAt: day(18, 12),
        endsAt: day(18, 14),
        venue: "Auditorium B",
        capacity: 180,
        bannerUrl:
          "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&q=80",
      },
    ])
    .returning();

  console.log("Seeding registrations...");
  const studentIds = users
    .filter((x) => x.role === "student")
    .map((x) => x.id);

  // Each approved/past event gets a chunk of students
  const regsToInsert: Array<{
    eventId: number;
    userId: number;
    registeredAt: Date;
  }> = [];
  for (const event of events) {
    if (event.status !== "approved") continue;
    const sampleSize = Math.min(
      studentIds.length,
      Math.max(3, Math.floor(event.capacity * 0.3)),
    );
    const shuffled = [...studentIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < sampleSize; i++) {
      const regDate = new Date();
      regDate.setDate(regDate.getDate() - Math.floor(Math.random() * 12));
      regsToInsert.push({
        eventId: event.id,
        userId: shuffled[i],
        registeredAt: regDate,
      });
    }
  }
  const regs = await db
    .insert(registrationsTable)
    .values(regsToInsert)
    .returning();

  console.log("Seeding attendance for past events...");
  const pastEventIds = events
    .filter((e) => e.endsAt < now && e.status === "approved")
    .map((e) => e.id);
  const pastRegs = regs.filter((r) => pastEventIds.includes(r.eventId));
  if (pastRegs.length > 0) {
    await db.insert(attendanceTable).values(
      pastRegs.map((r) => {
        const rand = Math.random();
        const status: "present" | "late" | "absent" =
          rand < 0.7 ? "present" : rand < 0.85 ? "late" : "absent";
        return { registrationId: r.id, status, markedAt: new Date() };
      }),
    );
  }

  console.log("Seeding certificates for past attendees...");
  const presentRows = await db
    .select({ reg: registrationsTable, att: attendanceTable })
    .from(attendanceTable)
    .innerJoin(
      registrationsTable,
      eq(attendanceTable.registrationId, registrationsTable.id),
    );
  const certsToInsert: Array<{
    eventId: number;
    userId: number;
    code: string;
  }> = [];
  for (const row of presentRows) {
    if (row.att.status === "absent") continue;
    if (!pastEventIds.includes(row.reg.eventId)) continue;
    certsToInsert.push({
      eventId: row.reg.eventId,
      userId: row.reg.userId,
      code: `CUSIT-${row.reg.eventId}-${row.reg.userId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
  }
  if (certsToInsert.length > 0) {
    await db.insert(certificatesTable).values(certsToInsert);
  }

  console.log("Seeding feedback...");
  const fbToInsert: Array<{
    eventId: number;
    userId: number;
    rating: number;
    comment: string | null;
  }> = [];
  const sampleComments = [
    "Very informative session, learned a lot.",
    "Good event but the venue was a bit small.",
    "Loved the energy and the speaker was excellent.",
    "Could have been better organized.",
    "Highly recommend to other students.",
    null,
  ];
  for (const eventId of pastEventIds) {
    const eventRegs = regs
      .filter((r) => r.eventId === eventId)
      .slice(0, 4);
    for (const r of eventRegs) {
      fbToInsert.push({
        eventId: r.eventId,
        userId: r.userId,
        rating: 3 + Math.floor(Math.random() * 3),
        comment:
          sampleComments[Math.floor(Math.random() * sampleComments.length)],
      });
    }
  }
  if (fbToInsert.length > 0) {
    // Avoid unique constraint duplicates
    const seen = new Set<string>();
    const filtered = fbToInsert.filter((f) => {
      const k = `${f.eventId}-${f.userId}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    await db.insert(feedbackTable).values(filtered);
  }

  console.log("Seeding notifications...");
  // Welcome notification for everyone
  await db.insert(notificationsTable).values(
    users.map((user) => ({
      userId: user.id,
      title: "Welcome to CUSIT Events",
      body: "Discover events, register online, and earn certificates — all in one place.",
      isRead: 0,
    })),
  );
  // Reminder for upcoming events to registered students
  const upcoming = events.filter(
    (e) => e.status === "approved" && e.startsAt > now,
  );
  for (const ev of upcoming.slice(0, 3)) {
    const evRegs = regs.filter((r) => r.eventId === ev.id);
    for (const r of evRegs.slice(0, 5)) {
      await db.insert(notificationsTable).values({
        userId: r.userId,
        title: "Upcoming event reminder",
        body: `Don't forget: "${ev.title}" is on ${ev.startsAt.toLocaleDateString()} at ${ev.venue}.`,
        eventId: ev.id,
        isRead: 0,
      });
    }
  }

  console.log(
    `Done. Users: ${users.length}, Events: ${events.length}, Regs: ${regs.length}.`,
  );
  process.exit(0);
}

import { eq } from "drizzle-orm";

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
