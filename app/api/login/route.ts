import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const filePath = path.join(process.cwd(), "app/data/users.json");
  const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log("Login attempt:", username, password); // ДЛЯ ОТЛАДКИ

  if (users[username] && users[username] === password) {
    return NextResponse.json({
      success: true,
      role: username === "admin" ? "admin" : "user",
    });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
