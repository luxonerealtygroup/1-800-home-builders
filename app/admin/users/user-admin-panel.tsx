"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole, useAuth } from "../../_components/auth-provider";

export function UserAdminPanel() {
  const router = useRouter();
  const { addUser, canManageUsers, deleteUser, updateUser, user, users } =
    useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("sales_rep");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("sales_rep");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  if (!canManageUsers) {
    return (
      <section className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Admin access required</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Only admins can add users or change workspace access.
        </p>
        <button
          className="mt-5 h-11 rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 px-4 text-sm font-semibold text-slate-950"
          type="button"
          onClick={() => router.push("/")}
        >
          Back to dashboard
        </button>
      </section>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addUser({ name, email, role, password });
    setMessage(result.message);

    if (result.ok) {
      setName("");
      setEmail("");
      setRole("sales_rep");
      setPassword("");
      setShowPassword(false);
    }
  }

  function startEditingUser(workspaceUser: (typeof users)[number]) {
    setEditingUserId(workspaceUser.id);
    setEditName(workspaceUser.name);
    setEditEmail(workspaceUser.email);
    setEditRole(workspaceUser.role);
    setEditPassword("");
    setShowEditPassword(false);
    setMessage("");
  }

  function cancelEditingUser() {
    setEditingUserId("");
    setEditName("");
    setEditEmail("");
    setEditRole("sales_rep");
    setEditPassword("");
    setShowEditPassword(false);
  }

  function saveEditingUser() {
    const result = updateUser(editingUserId, {
      name: editName,
      email: editEmail,
      role: editRole,
      password: editPassword || undefined,
    });

    setMessage(result.message);

    if (result.ok) {
      cancelEditingUser();
    }
  }

  function handleDeleteUser(workspaceUser: (typeof users)[number]) {
    const confirmed = window.confirm(
      `Delete ${workspaceUser.name} from this CRM?`,
    );

    if (!confirmed) {
      return;
    }

    const result = deleteUser(workspaceUser.id);
    setMessage(result.message);

    if (result.ok && editingUserId === workspaceUser.id) {
      cancelEditingUser();
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-white">Add team member</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Keep this invite list tight. The workspace cap is set to 10 users.
        </p>

        <div className="mt-5 space-y-4">
          <UserInput label="Name" value={name} onChange={setName} />
          <UserInput label="Email" type="email" value={email} onChange={setEmail} />
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Role</span>
            <select
              className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition focus:border-sky-300/70"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="sales_rep">Sales rep</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <PasswordInput
            label="Temporary password"
            showPassword={showPassword}
            toggleShowPassword={() => setShowPassword((current) => !current)}
            value={password}
            onChange={setPassword}
          />
        </div>

        {message && (
          <p className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            {message}
          </p>
        )}

        <button
          className="mt-5 h-12 w-full rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:brightness-110"
          type="submit"
        >
          Add user
        </button>
      </form>

      <div className="rounded-lg border border-white/10 bg-[#0b1018]/74 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Current users</h2>
          <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-300">
            {users.length}/10 seats
          </span>
        </div>

        <div className="mt-5 divide-y divide-white/10">
          {users.map((workspaceUser) => (
            <article key={workspaceUser.id} className="py-4">
              {editingUserId === workspaceUser.id ? (
                <div className="space-y-3 rounded-lg border border-sky-300/20 bg-sky-300/[0.055] p-3">
                  <UserInput
                    label="Name"
                    value={editName}
                    onChange={setEditName}
                  />
                  <UserInput
                    label="Email"
                    type="email"
                    value={editEmail}
                    onChange={setEditEmail}
                  />
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">
                      Role
                    </span>
                    <select
                      className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition focus:border-sky-300/70"
                      value={editRole}
                      onChange={(event) =>
                        setEditRole(event.target.value as UserRole)
                      }
                    >
                      <option value="sales_rep">Sales rep</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <PasswordInput
                    label="New password (optional)"
                    showPassword={showEditPassword}
                    toggleShowPassword={() =>
                      setShowEditPassword((current) => !current)
                    }
                    value={editPassword}
                    onChange={setEditPassword}
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="h-11 rounded-lg border border-white/10 bg-white/[0.06] text-sm font-semibold text-zinc-200"
                      type="button"
                      onClick={cancelEditingUser}
                    >
                      Cancel
                    </button>
                    <button
                      className="h-11 rounded-lg bg-gradient-to-r from-sky-300 to-emerald-300 text-sm font-semibold text-slate-950"
                      type="button"
                      onClick={saveEditingUser}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">
                      {workspaceUser.name}
                    </h3>
                    <p className="truncate text-sm text-zinc-400">
                      {workspaceUser.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-xs font-semibold capitalize text-sky-100">
                      {workspaceUser.role}
                    </span>
                    <p className="mt-2 text-xs text-zinc-500">
                      Added {workspaceUser.createdAt}
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:border-sky-300/40 hover:text-white"
                        type="button"
                        onClick={() => startEditingUser(workspaceUser)}
                      >
                        Edit
                      </button>
                      <button
                        className="h-9 rounded-lg border border-rose-300/30 bg-rose-400/[0.06] px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        disabled={workspaceUser.id === user?.id}
                        onClick={() => handleDeleteUser(workspaceUser)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PasswordInput({
  label,
  onChange,
  showPassword,
  toggleShowPassword,
  value,
  required = true,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  showPassword: boolean;
  toggleShowPassword: () => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-white/10 bg-black/35 transition focus-within:border-sky-300/70">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-zinc-600"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
        <button
          className="border-l border-white/10 px-4 text-sm font-semibold text-sky-200 transition hover:bg-white/[0.06] hover:text-white"
          type="button"
          onClick={toggleShowPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

function UserInput({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-300/70"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
