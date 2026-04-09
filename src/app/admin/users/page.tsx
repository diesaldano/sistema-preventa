'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';

type UserRecord = {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  active: boolean;
  createdAt: string;
  createdBy: string | null;
};

type ImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

export default function UsersPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [creating, setCreating] = useState(false);

  // Edit user
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // CSV Import
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const json = await res.json();
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function clearMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  async function handleCreateUser() {
    clearMessages();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al crear');
      setSuccessMsg(`Usuario ${json.data.email} creado`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('STAFF');
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(u: UserRecord) {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditActive(u.active);
    setEditPassword('');
    clearMessages();
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    clearMessages();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editEmail !== editingUser.email) body.email = editEmail;
      if (editRole !== editingUser.role) body.role = editRole;
      if (editActive !== editingUser.active) body.active = editActive;
      if (editPassword) body.password = editPassword;

      if (Object.keys(body).length === 0) {
        setEditingUser(null);
        return;
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al actualizar');
      setSuccessMsg(`Usuario ${json.data.email} actualizado`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    clearMessages();
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al eliminar');
      setSuccessMsg('Usuario eliminado');
      setDeletingId(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function handleImportCSV() {
    clearMessages();
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al importar');
      setImportResult(json.data);
      if (json.data.created > 0) {
        fetchUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
      }
    };
    reader.readAsText(file);
  }

  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader event="User Management" subtitle="DIEZ PRODUCCIONES - Gestión de Usuarios" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <div className="inline-block mb-4 w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
            <p>Verificando autenticación...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const activeUsers = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="User Management" subtitle="DIEZ PRODUCCIONES - Gestión de Usuarios" />

      <UserHeader
        email={user.email}
        role={user.role}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className={`inline-flex items-center gap-2 text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ← Panel de Validación
          </Link>
          <Link
            href="/admin/analytics"
            className={`inline-flex items-center gap-2 text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Analytics
          </Link>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className={`rounded-lg border p-4 mb-4 ${
            isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500/30 bg-emerald-50 text-emerald-700'
          }`}>
            {successMsg}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => { setShowCreateForm(!showCreateForm); setShowImport(false); clearMessages(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            + Nuevo Usuario
          </button>
          <button
            onClick={() => { setShowImport(!showImport); setShowCreateForm(false); clearMessages(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            📄 Importar CSV
          </button>
          <span className={`text-sm ml-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {activeUsers.length} activos · {inactiveUsers.length} inactivos
          </span>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className={`rounded-xl border p-5 mb-6 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
          }`}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Crear Nuevo Usuario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@ejemplo.com"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                      : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                      : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'STAFF')}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateUser}
                disabled={creating || !newEmail || !newPassword}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isDark
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                }`}
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* CSV Import */}
        {showImport && (
          <div className={`rounded-xl border p-5 mb-6 transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
          }`}>
            <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Importar Usuarios desde CSV
            </h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Formato: email, password, role (opcional: ADMIN o STAFF). Separador: coma o punto y coma.
            </p>

            <div className="mb-3">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              />
            </div>

            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={`email,password,role\nstaff1@ejemplo.com,password123,STAFF\nadmin2@ejemplo.com,admin456,ADMIN`}
              rows={5}
              className={`w-full px-3 py-2 rounded-lg text-sm border font-mono mb-3 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />

            <div className="flex gap-2">
              <button
                onClick={handleImportCSV}
                disabled={importing || !csvContent.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isDark
                    ? 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50'
                }`}
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
              <button
                onClick={() => { setShowImport(false); setImportResult(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
            </div>

            {importResult && (
              <div className={`mt-3 rounded-lg border p-3 text-sm ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}>
                <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  <span className="text-emerald-400 font-semibold">{importResult.created}</span> creados ·{' '}
                  <span className="text-yellow-400 font-semibold">{importResult.skipped}</span> omitidos (ya existen)
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-red-400 text-xs">{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className={`rounded-xl border p-5 mb-6 transition-colors ${
            isDark ? 'border-blue-500/30 bg-slate-900' : 'border-blue-300 bg-blue-50'
          }`}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Editar: {editingUser.email}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Rol
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'ADMIN' | 'STAFF')}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Estado
                </label>
                <select
                  value={editActive ? 'true' : 'false'}
                  onChange={(e) => setEditActive(e.target.value === 'true')}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                      : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="inline-block mb-4 w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p>Cargando usuarios...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}>
            No hay usuarios registrados
          </div>
        ) : (
          <div className={`rounded-xl border overflow-hidden transition-colors ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-slate-900' : 'bg-slate-50'}>
                    <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Rol</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estado</th>
                    <th className={`text-right py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Creado</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-t transition ${
                        isDark
                          ? `border-slate-800 ${u.active ? '' : 'opacity-50'}`
                          : `border-slate-100 ${u.active ? '' : 'opacity-50'}`
                      }`}
                    >
                      <td className={`py-3 px-4 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                            : isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          u.active
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className={`text-xs px-2 py-1 rounded transition ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            Editar
                          </button>
                          {deletingId === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className={`text-xs px-2 py-1 rounded transition ${
                                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(u.id)}
                              className={`text-xs px-2 py-1 rounded transition ${
                                isDark
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600'
                              }`}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
