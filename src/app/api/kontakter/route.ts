import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profilePicture: string;
  role: string;
  prioritized: boolean;
};

export async function GET() {
  // Absolute path to contacts.json
  const contactsPath = path.join(process.cwd(), "src/app/contacts.json");
  let contactsRaw;
  try {
    contactsRaw = await fs.readFile(contactsPath, "utf-8");
  } catch (err) {
    return NextResponse.json({ error: "contacts.json not found" }, { status: 500 });
  }

  let contactsData: any[];
  try {
    contactsData = JSON.parse(contactsRaw);
  } catch (err) {
    return NextResponse.json({ error: "contacts.json is invalid" }, { status: 500 });
  }

  // Filter and map contacts
  const contacts: Contact[] = contactsData
    .filter((c) => c.role === "Instruktør")
    .map((c, idx) => ({
      id: idx + 1,
      name: c.name,
      email: c.email,
      phone: c.phone ?? null,
      profilePicture: "https://tec.dk/img/placeholders/3.svg",
      role: c.role,
      prioritized: typeof c.prioritized === "boolean" ? c.prioritized : false,
    }));

  return NextResponse.json({ contacts });
}
