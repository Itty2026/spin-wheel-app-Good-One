"use client";

import { useState } from "react";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [prizes, setPrizes] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    color: "#3b82f6",
    active: true,
    sort_order: 1,
  });

  async function loadPrizes(currentPasscode) {
    const res = await fetch("/api/admin/prizes", {
      headers: {
        "x-admin-passcode": currentPasscode,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to load prizes");
      return;
    }

    setPrizes(data);
    setMessage("");
  }

  async function handleLogin() {
    const res = await fetch("/api/admin/prizes", {
      headers: {
        "x-admin-passcode": passcode,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Wrong passcode");
      return;
    }

    setAuthorized(true);
    setPrizes(data);
    setMessage("");
  }

  async function handleCreate() {
    const res = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-passcode": passcode,
      },
      body: JSON.stringify({
        ...form,
        sort_order: Number(form.sort_order),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to create prize");
      return;
    }

    setMessage("Prize created");
    setForm({
      name: "",
      color: "#3b82f6",
      active: true,
      sort_order: prizes.length + 2,
    });

    loadPrizes(passcode);
  }

  async function handleUpdate(prize) {
    const res = await fetch(`/api/admin/prizes/${prize.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-passcode": passcode,
      },
      body: JSON.stringify({
        name: prize.name,
        color: prize.color,
        active: prize.active,
        sort_order: Number(prize.sort_order),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update prize");
      return;
    }

    setMessage("Prize updated");
    loadPrizes(passcode);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this prize?");
    if (!confirmed) return;

    const res = await fetch(`/api/admin/prizes/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-passcode": passcode,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to delete prize");
      return;
    }

    setMessage("Prize deleted");
    loadPrizes(passcode);
  }

  if (!authorized) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-4">Admin Login</h1>

          <input
            type="password"
            placeholder="Enter admin passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold"
          >
            Enter Admin
          </button>

          {message ? <p className="mt-4 text-red-600">{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold mb-6">Prize Admin</h1>

        {message ? (
          <div className="mb-6 p-3 rounded-lg bg-gray-100 border">{message}</div>
        ) : null}

        <div className="border rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add Prize</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Prize name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="border rounded-lg p-3"
            />

            <input
              type="text"
              placeholder="#3b82f6"
              value={form.color}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, color: e.target.value }))
              }
              className="border rounded-lg p-3"
            />

            <input
              type="number"
              placeholder="Sort order"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sort_order: e.target.value }))
              }
              className="border rounded-lg p-3"
            />

            <label className="flex items-center gap-2 border rounded-lg p-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
              Active
            </label>
          </div>

          <button
            onClick={handleCreate}
            className="mt-4 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold"
          >
            Add Prize
          </button>
        </div>

         <div>
          <h2 className="text-2xl font-semibold mb-4">Existing Prizes</h2>

          <div className="space-y-4">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
              >
                <input
                  type="text"
                  value={prize.name}
                  onChange={(e) =>
                    setPrizes((prev) =>
                      prev.map((p) =>
                        p.id === prize.id ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  className="border rounded-lg p-2"
                />

                <input
                  type="text"
                  value={prize.color}
                  onChange={(e) =>
                    setPrizes((prev) =>
                      prev.map((p) =>
                        p.id === prize.id ? { ...p, color: e.target.value } : p
                      )
                    )
                  }
                  className="border rounded-lg p-2"
                />

                <input
                  type="number"
                  value={prize.sort_order}
                  onChange={(e) =>
                    setPrizes((prev) =>
                      prev.map((p) =>
                        p.id === prize.id
                          ? { ...p, sort_order: e.target.value }
                          : p
                      )
                    )
                   }
                  className="border rounded-lg p-2"
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prize.active}
                    onChange={(e) =>
                      setPrizes((prev) =>
                        prev.map((p) =>
                          p.id === prize.id
                            ? { ...p, active: e.target.checked }
                            : p
                        )
                      )
                    }
                  />
                  Active
                </label>

                <button
                  onClick={() => handleUpdate(prize)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Save
                </button>

                <button
                  onClick={() => handleDelete(prize.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}