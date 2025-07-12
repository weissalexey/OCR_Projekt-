"use client";

import Link from "next/link";

const clients = ["client-abc", "client-xyz"];

export default function TemplateListPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Saved Templates</h1>
        <Link
          href="/home"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back
        </Link>
      </div>

      <ul className="list-disc pl-6">
        {clients.map((client) => (
          <li key={client} className="mb-2">
            <span className="font-medium">{client}</span>: 
            <Link
              href={`http://localhost:8000/exports/${client}.json`}
              className="text-blue-600 underline ml-2"
              target="_blank"
            >
              Download JSON
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
