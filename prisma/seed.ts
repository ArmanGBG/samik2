// Seed demo data for Samic — run with: bun prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function rnd(len: number): string {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

async function main() {
  console.log("🌱 Seeding Samic demo data...");

  // clear existing
  await db.attendance.deleteMany();
  await db.session.deleteMany();
  await db.joinRequest.deleteMany();
  await db.enrollment.deleteMany();
  await db.class.deleteMany();
  await db.institute.deleteMany();
  await db.user.deleteMany();
  await db.otp.deleteMany();

  // ---------- Super Admin ----------
  const superAdmin = await db.user.create({
    data: {
      mobile: "09120000001",
      role: "SUPER_ADMIN",
      name: "مدیر",
      lastName: "سامیک",
      province: "تهران",
      city: "تهران",
      profileCompleted: true,
    },
  });

  // ---------- Institute + Manager ----------
  const manager = await db.user.create({
    data: {
      mobile: "09120000002",
      role: "INSTITUTE_MANAGER",
      name: "سارا",
      lastName: "کریمی",
      province: "تهران",
      city: "تهران",
      profileCompleted: true,
    },
  });

  const institute = await db.institute.create({
    data: {
      name: "آموزشگاه البرز",
      managerId: manager.id,
    },
  });

  // ---------- Teacher ----------
  const teacher = await db.user.create({
    data: {
      mobile: "09120000003",
      role: "TEACHER",
      teacherCode: `TCH-${rnd(6)}`,
      name: "محمد",
      lastName: "رضایی",
      province: "تهران",
      city: "تهران",
      profileCompleted: true,
      teachingSubject: "ریاضیات",
      bankCardNo: "6037997534123456",
      shebaNo: "IR820540102680020817909002",
      instituteId: institute.id,
    },
  });

  // ---------- Students ----------
  const student1 = await db.user.create({
    data: {
      mobile: "09120000004",
      role: "STUDENT",
      studentCode: `STU-${rnd(6)}`,
      name: "علی",
      lastName: "احمدی",
      province: "تهران",
      city: "تهران",
      profileCompleted: true,
      educationLevel: "HIGH_10_MATH",
      parentPhone1: "09121112233",
    },
  });

  // Ghost student — created by teacher via mobile, must complete profile on login
  const ghost = await db.user.create({
    data: {
      mobile: "09120000005",
      role: "STUDENT",
      studentCode: `STU-${rnd(6)}`,
      profileCompleted: false,
    },
  });

  // ---------- Classes ----------
  const mathClass = await db.class.create({
    data: {
      id: `CLS-${rnd(6)}`,
      name: "ریاضیات دهم",
      schedule: "شنبه و سه‌شنبه، ۱۶ تا ۱۸",
      qrToken: rnd(24),
      teacherId: teacher.id,
      instituteId: institute.id,
    },
  });

  const physicsClass = await db.class.create({
    data: {
      id: `CLS-${rnd(6)}`,
      name: "فیزیک یازدهم",
      schedule: "دوشنبه، ۱۷ تا ۱۹",
      qrToken: rnd(24),
      teacherId: teacher.id,
      instituteId: institute.id,
    },
  });

  // student1 enrolled in math class from session 1
  await db.enrollment.create({
    data: {
      studentId: student1.id,
      classId: mathClass.id,
      joinedAtSessionNum: 1,
    },
  });

  // ---------- Sessions for math class (3 sessions) ----------
  const day = 24 * 60 * 60 * 1000;
  const s1 = await db.session.create({
    data: {
      classId: mathClass.id,
      name: "جلسه ۱",
      sessionNum: 1,
      date: new Date(Date.now() - 14 * day),
    },
  });
  const s2 = await db.session.create({
    data: {
      classId: mathClass.id,
      name: "جلسه ۲",
      sessionNum: 2,
      date: new Date(Date.now() - 7 * day),
    },
  });
  const s3 = await db.session.create({
    data: {
      classId: mathClass.id,
      name: "جلسه فوق‌العاده",
      sessionNum: 3,
      date: new Date(Date.now() - 2 * day),
    },
  });

  // attendance for student1
  await db.attendance.createMany({
    data: [
      { sessionId: s1.id, studentId: student1.id, status: "PRESENT", assignmentDone: true },
      { sessionId: s2.id, studentId: student1.id, status: "LATE", assignmentDone: true },
      { sessionId: s3.id, studentId: student1.id, status: "PRESENT", assignmentDone: false },
    ],
  });

  // ghost student was invited by teacher to math class (pending TEACHER_INVITE)
  await db.joinRequest.create({
    data: {
      studentId: ghost.id,
      classId: mathClass.id,
      direction: "TEACHER_INVITE",
      status: "PENDING",
    },
  });

  // student1 requested to join physics class (pending STUDENT_REQUEST)
  await db.joinRequest.create({
    data: {
      studentId: student1.id,
      classId: physicsClass.id,
      direction: "STUDENT_REQUEST",
      status: "PENDING",
    },
  });

  console.log("✅ Seed complete:");
  console.log("   SuperAdmin:     09120000001");
  console.log("   Institute Mgr:  09120000002 (آموزشگاه البرز)");
  console.log(`   Teacher:        09120000003 (${teacher.teacherCode}) — ریاضیات دهم + فیزیک یازدهم`);
  console.log(`   Student:        09120000004 (${student1.studentCode}) — عضو ریاضیات دهم`);
  console.log("   Ghost Student:  09120000005 (پروفایل ناقص + دعوت در انتظار)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
