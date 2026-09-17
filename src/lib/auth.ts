// Session auth: HMAC-signed token stored in httpOnly cookie.
// No external dependency — uses Node crypto only.

import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SECRET = process.env.AUTH_SECRET || "samic-dev-secret-change-in-production";
const COOKIE_NAME = "samic_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: string;
  iat: number;
  exp: number;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: object): string {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string): SessionPayload | null {
  try {
    const [body, mac] = token.split(".");
    if (!body || !mac) return null;
    const expect = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Create session cookie for user */
export async function createSession(userId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ uid: userId, iat: now, exp: now + MAX_AGE });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export type Role = "SUPER_ADMIN" | "INSTITUTE_MANAGER" | "TEACHER" | "STUDENT";

export interface SessionUser {
  id: string;
  mobile: string;
  role: Role;
  name: string | null;
  lastName: string | null;
  profileCompleted: boolean;
  studentCode: string | null;
  teacherCode: string | null;
  instituteId: string | null;
  instituteName: string | null;
  province: string | null;
  city: string | null;
}

/** Get the logged-in user (or null). Safe to call in route handlers. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.uid },
    include: { managedInstitute: true, institute: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    mobile: user.mobile,
    role: user.role as Role,
    name: user.name,
    lastName: user.lastName,
    profileCompleted: user.profileCompleted,
    studentCode: user.studentCode,
    teacherCode: user.teacherCode,
    instituteId: user.instituteId ?? (user.managedInstitute ? user.managedInstitute.id : null),
    instituteName: user.managedInstitute?.name ?? user.institute?.name ?? null,
    province: user.province,
    city: user.city,
  };
}

/** Helper for API routes: returns user or throws a 401-shaped error */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("ابتدا وارد حساب خود شوید", 401);
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("دسترسی غیرمجاز", 403);
  return user;
}

export function publicUser(u: {
  id: string;
  mobile: string;
  role: string;
  name: string | null;
  lastName: string | null;
  profileCompleted: boolean;
  studentCode: string | null;
  teacherCode: string | null;
  province?: string | null;
  city?: string | null;
  teachingSubject?: string | null;
  educationLevel?: string | null;
}) {
  return {
    id: u.id,
    mobile: u.mobile,
    role: u.role,
    name: u.name,
    lastName: u.lastName,
    profileCompleted: u.profileCompleted,
    studentCode: u.studentCode,
    teacherCode: u.teacherCode,
    province: u.province ?? null,
    city: u.city ?? null,
    teachingSubject: u.teachingSubject ?? null,
    educationLevel: u.educationLevel ?? null,
  };
}
