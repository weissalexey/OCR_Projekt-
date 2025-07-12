import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/data/users.json");

export async function GET() {
  try {
    const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  try {
    const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (users[username]) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    users[username] = password;
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error adding user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { username, password } = await req.json();
  try {
    const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!users[username]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    users[username] = password;
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error updating password" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { username } = await req.json();
  try {
    const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (username === "admin") {
      return NextResponse.json({ error: "Cannot delete admin" }, { status: 403 });
    }
    delete users[username];
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
