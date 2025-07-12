"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteLogo from "@/components/SiteLogo";

interface TemplateInfo {
  name: string;
  created: number;
}

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:8000/api/list-templates")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.templates || []).map((filename: string) => ({
          name: filename,
          created: data.timestamps?.[filename] || 0,
        }));
        setTemplates(list);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load templates");
        setLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const addTemplate = () => {
    const firm = prompt("Enter firm name:");
    if (!firm) return;

    const name = prompt("Enter template name:");
    if (!name) return;

    const user = localStorage.getItem("currentUser") || "unknown";
    const fullName = `${user}--${firm}--${name}`;
    localStorage.setItem("selectedClient", fullName);
    localStorage.removeItem("loadExistingTemplate");
    router.push("/templates");
  };

  const deleteTemplate = async (filename: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${filename}? This action cannot be undone.`);
    if (!confirmDelete) return;
    try {
      await fetch(`http://localhost:8000/api/delete-template/${filename}`, { method: "DELETE" });
      setTemplates(templates.filter((t) => t.name !== filename));
    } catch {
      alert("Failed to delete template");
    }
  };

  const username = localStorage.getItem("currentUser") || "";
  const isAdmin = username === "admin";

  const visibleTemplates = templates.filter((t) =>
    isAdmin || t.name.startsWith(`${username}--`) || t.name.startsWith("admin--")
  );

  const filtered = visibleTemplates
    .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.created - a.created;
    });

  return (
    <div className="p-6">
      <SiteLogo />
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Saved Templates</h1>
        <div className="flex gap-2">
          <button
            onClick={addTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add
          </button>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name"
          className="border p-2 rounded"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="space-y-2">
        {filtered.map((t) => {
          const name = t.name.replace(".json", "");
          const parts = name.split("--");
          const owner = parts[0];
          const firm = parts[1] || "(undefined)";
          const templateName = parts[2] || parts[1] || name;

          return (
            <li key={t.name} className="flex gap-4 items-center border p-3 rounded">
              <span className="font-medium">{owner} / {firm} / {templateName}</span>
              <button
                onClick={() => {
                  localStorage.setItem("selectedClient", name);
                  localStorage.setItem("loadExistingTemplate", "true");
                  router.push("/templates");
                }}
                className="text-blue-400 ml-2"
              >
                Edit
              </button>

              <button
                onClick={() => deleteTemplate(t.name)}
                className="text-red-600 underline"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
