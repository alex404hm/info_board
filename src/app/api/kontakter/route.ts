import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePicture: string | null;
  role: string;
};

export async function GET() {
  const instructors = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      profilePicture: user.image,
    })
    .from(user)
    .where(and(eq(user.role, "teacher"), eq(user.emailVerified, true)));

  const contacts: Contact[] = instructors.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    phone: u.phone ?? null,
    profilePicture: u.profilePicture ?? null,
    role: "Instruktør",
  }));

  return NextResponse.json({ contacts });
}
