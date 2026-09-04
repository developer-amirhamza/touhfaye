
"use client";
import React, { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface User {
    id: string;  firstName: string; lastName?: string | null;
    email: string; mobile: string | null;
    avatar: string | null; role: string; status: string;
    verify_email: boolean; last_login_date: string | null; createdAt: string;
}

// Legacy "USER" accounts are consumers.
const normalise = (role: string) => (role === 'USER' || !role ? 'CONSUMER' : role);

// Roles an admin can assign. OWNER is deliberately absent — it's set once,
// directly in the database, and can never be granted or changed via the UI.
const ASSIGNABLE_ROLES = [
    { value: 'CONSUMER', label: 'Consumer' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TRADE', label: 'Trade Partners' },
    { value: 'RETAILER', label: 'Retailer' },
    { value: 'DISTRIBUTOR', label: 'Distributor' },
    { value: 'NDIS_COORDINATOR', label: 'NDIS/Aged Care Provider' },
];

const ROLE_BADGE: Record<string, string> = {
    OWNER: 'bg-amber-100 text-amber-800 border-amber-300',
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    TRADE: 'bg-blue-100 text-blue-800 border-blue-300',
    NDIS_COORDINATOR: 'bg-teal-100 text-teal-800 border-teal-300',
    CONSUMER: 'bg-gray-100 text-gray-700 border-gray-300',
};

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [exporting, setExporting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllUser });
            if (response.data?.success) setUsers(response.data.data || []);
            else toast.error(response.data?.message || 'Failed to fetch users');
        } catch (error) { AxiosToastError(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        let result = users;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(u => u.firstName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        if (roleFilter !== 'ALL') result = result.filter(u => normalise(u.role) === roleFilter);
        if (statusFilter !== 'ALL') result = result.filter(u => u.status === statusFilter);
        setFiltered(result);
    }, [users, search, roleFilter, statusFilter]);

    const handleUpdateUser = async (id: string, data: { status?: string; role?: string }) => {
        try {
            setActionLoading(id);
            const response = await Axios({ ...SummeryApi.updateUserByAdmin, data: { id, ...data } });
            if (response.data?.success) {
                toast.success('User updated successfully');
                setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data } : u)));
            } else toast.error(response.data?.message || 'Update failed');
        } catch (error) { AxiosToastError(error); } finally { setActionLoading(null); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            setActionLoading(id);
            const response = await Axios({ ...SummeryApi.deleteUser, data: { id } });
            if (response.data?.success) { toast.success('User deleted'); setUsers(prev => prev.filter(u => u.id !== id)); }
            else toast.error(response.data?.message || 'Delete failed');
        } catch (error) { AxiosToastError(error); } finally { setActionLoading(null); }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return '—'; }
    };

    // Export the CURRENTLY FILTERED list to a real .xlsx workbook.
    // xlsx is imported dynamically so it never weighs down the main bundle.
    const handleExport = async () => {
        try {
            setExporting(true);
            const XLSX = await import('xlsx');
            const rows = filtered.map(u => ({
                'First Name': u.firstName  || '',
                'Last Name': u.lastName || '',
                'Email': u.email,
                'Mobile': u.mobile || '',
                'Role': normalise(u.role),
                'Status': u.status,
                'Email Verified': u.verify_email ? 'Yes' : 'No',
                'Last Login': u.last_login_date ? format(new Date(u.last_login_date), 'dd MMM yyyy HH:mm') : '',
                'Joined': u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '',
                'User ID': u.id,
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            // Sensible column widths so the sheet opens readable.
            ws['!cols'] = [
                { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 14 },
                { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 38 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Users');
            XLSX.writeFile(wb, `users-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            toast.success(`Exported ${rows.length} user${rows.length !== 1 ? 's' : ''}`);
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 py-12">
            <div className="flex justify-between items-center my-6">
                <h1 className="text-2xl font-bold">All Users</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
                    <button onClick={handleExport} disabled={exporting || loading || filtered.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50">
                        {exporting ? 'Exporting…' : '⬇ Export to Excel'}
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Roles</option>
                    <option value="CONSUMER">Consumer</option>
                    <option value="TRADE">Trade</option>
                    <option value="NDIS_COORDINATOR">NDIS Coordinator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
            </div>
            {loading ? <div className="text-center py-12 text-gray-500">Loading users...</div> : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            {['User', 'Email', 'Mobile', 'Role', 'Status', 'Verified', 'Last Login', 'Joined', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found.</td></tr>
                            ) : filtered.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button onClick={() => setSelectedUser(user)} className="flex items-center gap-3 group text-left">
                                            {user.avatar ? <img src={user.avatar} alt={user.firstName} className="w-8 h-8 rounded-full object-cover" /> :
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">{user.firstName? user?.firstName.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}</div>}
                                            <span className="font-medium text-gray-900 text-sm group-hover:text-blue-600 group-hover:underline">
                                                {`${user.firstName} ${user.lastName ?? ''}`.trim()}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.mobile || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {normalise(user.role) === 'OWNER' ? (
                                            // The owner's role is permanent — no dropdown, just a badge.
                                            <span className={`inline-block text-xs font-semibold rounded border px-2 py-1 ${ROLE_BADGE.OWNER}`}>
                                                👑 Owner
                                            </span>
                                        ) : (
                                            <select value={normalise(user.role)} disabled={actionLoading === user.id}
                                                onChange={e => handleUpdateUser(user.id, { role: e.target.value })}
                                                className={`text-xs rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 ${ROLE_BADGE[normalise(user.role)] ?? ROLE_BADGE.CONSUMER}`}>
                                                {ASSIGNABLE_ROLES.map(r => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {normalise(user.role) === 'OWNER' ? (
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                                        ) : (
                                            <button disabled={actionLoading === user.id}
                                                onClick={() => handleUpdateUser(user.id, { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                                                className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                                                {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.verify_email ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.verify_email ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.last_login_date)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-900 text-sm">View</button>
                                            {normalise(user.role) === 'OWNER' ? (
                                                <span className="text-xs text-gray-400">Protected</span>
                                            ) : (
                                                <button disabled={actionLoading === user.id} onClick={() => handleDelete(user.id, user.firstName)}
                                                    className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50">
                                                    {actionLoading === user.id ? '...' : 'Delete'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* User details modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt={selectedUser.email} className="w-16 h-16 rounded-full object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
                                        {selectedUser.firstName.charAt(0).toUpperCase() ?? selectedUser.email.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {selectedUser.firstName
                                            ? `${selectedUser.firstName} ${selectedUser.lastName ?? ''}`.trim()
                                            : "N/A"}
                                    </h2>
                                    <span className={`inline-block mt-1 text-xs font-semibold rounded border px-2 py-0.5 ${ROLE_BADGE[normalise(selectedUser.role)] ?? ROLE_BADGE.CONSUMER}`}>
                                        {normalise(selectedUser.role) === 'OWNER' ? '👑 Owner' : normalise(selectedUser.role).replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
                        </div>
                        <dl className="divide-y divide-gray-100 text-sm">
                            {[
                                ['First Name', selectedUser.firstName  || '—'],
                                ['Last Name', selectedUser.lastName || '—'],
                                ['Email', selectedUser.email],
                                ['Mobile', selectedUser.mobile || '—'],
                                ['Status', selectedUser.status],
                                ['Email Verified', selectedUser.verify_email ? 'Yes' : 'No'],
                                ['Last Login', formatDate(selectedUser.last_login_date)],
                                ['Joined', formatDate(selectedUser.createdAt)],
                                ['User ID', selectedUser.id],
                            ].map(([label, value]) => (
                                <div key={label as string} className="flex justify-between gap-4 py-2">
                                    <dt className="text-gray-500">{label}</dt>
                                    <dd className="text-gray-900 font-medium text-right break-all">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
