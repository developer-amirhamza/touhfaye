"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { RootState } from "@/redux/store";

// Same WYSIWYG editor used for blogs — gives task descriptions a real link
// button (select text → add link). Loaded client-side only (TipTap needs it).
const RichTextEditor = dynamic(() => import("@/app/(main)/components/UI/RichTextEditor"), { ssr: false });

interface TeamTask {
    id: string;
    type: "TASK" | "REQUIREMENT" | "NOTE";
    title: string;
    description: string | null;
    status: "OPEN" | "IN_PROGRESS" | "DONE";
    priority: "LOW" | "NORMAL" | "HIGH";
    createdById: string;
    createdByName: string;
    acceptedById: string | null;
    acceptedByName: string | null;
    acceptedAt: string | null;
    completedAt: string | null;
    createdAt: string;
}

const TYPE_STYLE: Record<string, { card: string; chip: string; label: string }> = {
    TASK: { card: "bg-blue-50 border-blue-200", chip: "bg-blue-600 text-white", label: "Task" },
    REQUIREMENT: { card: "bg-purple-50 border-purple-200", chip: "bg-purple-600 text-white", label: "Requirement" },
    NOTE: { card: "bg-amber-50 border-amber-200", chip: "bg-amber-500 text-white", label: "Note" },
};

const STATUS_STYLE: Record<string, string> = {
    OPEN: "bg-gray-200 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
};

const PRIORITY_STYLE: Record<string, string> = {
    HIGH: "text-red-600",
    NORMAL: "text-gray-500",
    LOW: "text-gray-400",
};

export default function AdminTasksPage() {
    const me = useSelector((state: RootState) => state.userSlice?.user);
    const [tasks, setTasks] = useState<TeamTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    // New item form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: "TASK", title: "", description: "", priority: "NORMAL" });
    const [saving, setSaving] = useState(false);

    // Inline editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: "", description: "" });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await Axios({ ...SummeryApi.listTeamTasks });
            if (res.data?.success) setTasks(res.data.data || []);
        } catch (e) {
            AxiosToastError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const filtered = useMemo(
        () => tasks.filter(
            (t) => (statusFilter === "ALL" || t.status === statusFilter) &&
                   (typeFilter === "ALL" || t.type === typeFilter)
        ),
        [tasks, statusFilter, typeFilter]
    );

    const counts = useMemo(() => ({
        open: tasks.filter((t) => t.status === "OPEN").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        done: tasks.filter((t) => t.status === "DONE").length,
    }), [tasks]);

    const handleCreate = async () => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        try {
            setSaving(true);
            const res = await Axios({ ...SummeryApi.createTeamTask, data: form });
            if (res.data?.success) {
                setTasks((prev) => [res.data.data, ...prev]);
                setForm({ type: "TASK", title: "", description: "", priority: "NORMAL" });
                setShowForm(false);
                toast.success("Added");
            }
        } catch (e) { AxiosToastError(e); } finally { setSaving(false); }
    };

    const handleAccept = async (task: TeamTask) => {
        try {
            setBusyId(task.id);
            const res = await Axios({ ...SummeryApi.acceptTeamTask, data: { id: task.id } });
            if (res.data?.success) {
                setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data.data : t)));
                toast.success("Task accepted — it's yours!");
            }
        } catch (e) { AxiosToastError(e); fetchTasks(); } finally { setBusyId(null); }
    };

    const handleStatus = async (task: TeamTask, status: string) => {
        try {
            setBusyId(task.id);
            const res = await Axios({ ...SummeryApi.updateTeamTask, data: { id: task.id, status } });
            if (res.data?.success) {
                setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data.data : t)));
            }
        } catch (e) { AxiosToastError(e); } finally { setBusyId(null); }
    };

    const startEdit = (task: TeamTask) => {
        setEditingId(task.id);
        setEditForm({ title: task.title, description: task.description || "" });
    };

    const handleSaveEdit = async (task: TeamTask) => {
        try {
            setBusyId(task.id);
            const res = await Axios({
                ...SummeryApi.updateTeamTask,
                data: { id: task.id, title: editForm.title, description: editForm.description },
            });
            if (res.data?.success) {
                setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data.data : t)));
                setEditingId(null);
                toast.success("Updated");
            }
        } catch (e) { AxiosToastError(e); } finally { setBusyId(null); }
    };

    const handleDelete = async (task: TeamTask) => {
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        try {
            setBusyId(task.id);
            const res = await Axios({ ...SummeryApi.deleteTeamTask, data: { id: task.id } });
            if (res.data?.success) {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
                toast.success("Deleted");
            }
        } catch (e) { AxiosToastError(e); } finally { setBusyId(null); }
    };

    return (
        <div className="container mx-auto p-4 py-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mt-5 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Tasks</h1>
                    <p className="text-sm text-gray-500">
                        Tasks, requirements and notes for the admin team. Anyone can accept an open task.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                    {showForm ? "Close" : "+ New item"}
                </button>
            </div>

            {/* Board summary */}
            <div className="flex gap-4 text-sm text-gray-500 mb-6">
                <span><b className="text-gray-800">{counts.open}</b> open</span>
                <span><b className="text-blue-700">{counts.inProgress}</b> in progress</span>
                <span><b className="text-green-700">{counts.done}</b> done</span>
            </div>

            {/* New item form */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid gap-3 max-w-2xl shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="TASK">Task</option>
                            <option value="REQUIREMENT">Requirement</option>
                            <option value="NOTE">Note</option>
                        </select>
                        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="LOW">Low priority</option>
                            <option value="NORMAL">Normal priority</option>
                            <option value="HIGH">High priority</option>
                        </select>
                    </div>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Title…"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                    />
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Details (optional) — select text and use the 🔗 link button to add a hyperlink
                        </label>
                        <RichTextEditor
                            value={form.description}
                            onChange={(html) => setForm({ ...form, description: html })}
                        />
                    </div>
                    <div>
                        <button onClick={handleCreate} disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50">
                            {saving ? "Adding…" : "Add"}
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="ALL">All types</option>
                    <option value="TASK">Tasks</option>
                    <option value="REQUIREMENT">Requirements</option>
                    <option value="NOTE">Notes</option>
                </select>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Nothing here yet — add the first item.</div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((task) => {
                        const style = TYPE_STYLE[task.type] ?? TYPE_STYLE.TASK;
                        const isMine = me && task.createdById === (me as any).id;
                        const isEditing = editingId === task.id;
                        return (
                            <div key={task.id}
                                className={`rounded-xl border p-4 flex flex-col gap-3 shadow-sm ${style.card} ${task.status === "DONE" ? "opacity-70" : ""}`}>
                                {/* Top row: type chip + priority + status */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.chip}`}>
                                        {style.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {task.priority === "HIGH" && (
                                            <span className="text-[10px] font-bold text-red-600 uppercase">High</span>
                                        )}
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[task.status]}`}>
                                            {task.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                {isEditing ? (
                                    <div className="grid gap-2">
                                        <input value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full bg-white" />
                                        <div className="bg-white rounded">
                                            <RichTextEditor
                                                value={editForm.description}
                                                onChange={(html) => setEditForm({ ...editForm, description: html })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSaveEdit(task)} disabled={busyId === task.id}
                                                className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-50">Save</button>
                                            <button onClick={() => setEditingId(null)}
                                                className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className={`font-semibold text-gray-900 ${task.status === "DONE" ? "line-through" : ""}`}>
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <div
                                                className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:font-bold [&_a]:hover:underline"
                                                dangerouslySetInnerHTML={{ __html: task.description }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* People */}
                                <div className="text-xs text-gray-500 border-t border-black/5 pt-2 grid gap-0.5">
                                    <span>✍️ Written by <b className="text-gray-700">{task.createdByName}</b> · {format(new Date(task.createdAt), "dd MMM yyyy")}</span>
                                    {task.acceptedByName ? (
                                        <span>🙋 Accepted by <b className="text-gray-700">{task.acceptedByName}</b>{task.acceptedAt && ` · ${format(new Date(task.acceptedAt), "dd MMM yyyy")}`}</span>
                                    ) : task.type !== "NOTE" ? (
                                        <span className="text-gray-400">Not accepted yet</span>
                                    ) : null}
                                    {task.completedAt && (
                                        <span>✅ Completed {format(new Date(task.completedAt), "dd MMM yyyy")}</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 mt-auto">
                                    {!task.acceptedById && task.type !== "NOTE" && task.status !== "DONE" && (
                                        <button onClick={() => handleAccept(task)} disabled={busyId === task.id}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-50">
                                            Accept task
                                        </button>
                                    )}
                                    {task.type !== "NOTE" && (
                                        <select value={task.status} disabled={busyId === task.id}
                                            onChange={(e) => handleStatus(task, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white">
                                            <option value="OPEN">Open</option>
                                            <option value="IN_PROGRESS">In progress</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    )}
                                    {!isEditing && (
                                        <button onClick={() => startEdit(task)}
                                            className="text-xs text-gray-600 hover:text-gray-900 underline">Edit</button>
                                    )}
                                    {isMine && (
                                        <button onClick={() => handleDelete(task)} disabled={busyId === task.id}
                                            className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50">Delete</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
