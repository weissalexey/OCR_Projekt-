"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SiteLogo from "@/components/SiteLogo";

export default function AdminPage() {
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [logoAlign, setLogoAlign] = useState("center");
  const router = useRouter();

  useEffect(() => {
    // Zugriffsschutz für Adminbereich
    if (
      localStorage.getItem("isLoggedIn") !== "true" ||
      localStorage.getItem("currentUser") !== "admin"
    ) {
      router.push("/login");
    } else {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => alert("Failed to load users"));
    }
  }, []);

  const refreshUsers = () => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  const addUser = async () => {
    if (!username || !password) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      refreshUsers();
      setUsername("");
      setPassword("");
    } else {
      alert("Error adding user");
    }
  };

  const deleteUser = async (user: string) => {
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user }),
    });
    if (res.ok) refreshUsers();
  };

  const changePassword = async () => {
    if (!selectedUser || !newPassword) return;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: selectedUser, password: newPassword }),
    });
    if (res.ok) {
      refreshUsers();
      alert(`Password for "${selectedUser}" updated`);
      setSelectedUser("");
      setNewPassword("");
    }
  };

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  // Bilddatei auswählen und base64 speichern
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          localStorage.setItem("siteLogo", reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogoAlign = () => {
    localStorage.setItem("siteLogoAlign", logoAlign);
    alert("Logo alignment saved.");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Anzeige des Logos mit Ausrichtung */}
      <SiteLogo />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/home")}>Home</Button>
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Add User</h3>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2"
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-2"
          />
          <Button onClick={addUser} className="bg-green-600 hover:bg-green-700 text-white w-full">
            Add User
          </Button>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Change Password</h3>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
          >
            <option value="">Select user</option>
            {Object.keys(users).map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <Input
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-2"
          />
          <Button onClick={changePassword} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Change Password
          </Button>
        </div>
      </div>

      {/* Konfiguration für das Seitenlogo */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-2">Site Logo Settings</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="mb-2"
        />
        <div className="flex gap-4 mb-2">
          <label>
            <input type="radio" name="align" value="left" checked={logoAlign === "left"} onChange={(e) => setLogoAlign(e.target.value)} />
            Left
          </label>
          <label>
            <input type="radio" name="align" value="center" checked={logoAlign === "center"} onChange={(e) => setLogoAlign(e.target.value)} />
            Center
          </label>
          <label>
            <input type="radio" name="align" value="right" checked={logoAlign === "right"} onChange={(e) => setLogoAlign(e.target.value)} />
            Right
          </label>
        </div>
        <Button onClick={saveLogoAlign} className="bg-blue-600 text-white">Save Logo Alignment</Button>
      </div>

      {/* Benutzerliste */}
      <div className="mt-6 border-t pt-6">
        <h3 className="text-xl font-semibold mb-2">Users</h3>
        <ul className="space-y-2">
          {Object.keys(users).map((u) => (
            <li key={u} className="flex justify-between items-center border p-2 rounded">
              <span>{u}</span>
              {u !== "admin" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteUser(u)}
                >
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
