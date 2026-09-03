"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { FaTrash, FaEdit, FaPlus, FaTimes, FaFileAlt } from "react-icons/fa";
import FileUploader from "../components/FileUploader";

type Category = "CERTIFICATION" | "POS_ASSET";
type Audience = "RETAILER" | "DISTRIBUTOR" | "ALL";

interface Resource {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  category: Category;
  audience: Audience;
  order: number;
  isActive: boolean;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "CERTIFICATION", label: "Certification / lab report" },
  { value: "POS_ASSET", label: "POS / shelf-talker asset" },
];
const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "ALL", label: "Retailers & distributors" },
  { value: "RETAILER", label: "Retailers only" },
  { value: "DISTRIBUTOR", label: "Distributors only" },
];

const emptyForm = { title: "", description: "", fileUrl: "", category: "CERTIFICATION" as Category, audience: "ALL" as Audience, order: 0 };

export default function AdminPortalResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [contact, setContact] = useState({ name: "", email: "", phone: "", hours: "" });
  const [contactSaving, setContactSaving] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await Axios({ ...SummeryApi.getAllPortalResourcesAdmin });
      if (res.data?.success) setResources(res.data.data || []);
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContact = async () => {
    try {
      const res = await Axios({ ...SummeryApi.getAccountManagerContact });
      if (res.data?.success) setContact({ name: "", email: "", phone: "", hours: "", ...res.data.data });
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    fetchResources();
    fetchContact();
  }, []);

  const saveContact = async () => {
    try {
      setContactSaving(true);
      const res = await Axios({ ...SummeryApi.updateAccountManagerContact, data: contact });
      if (res.data?.success) toast.success("Account manager contact updated");
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setContactSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description || "",
      fileUrl: r.fileUrl,
      category: r.category,
      audience: r.audience,
      order: r.order,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.fileUrl.trim()) {
      toast.error("Title and file are required");
      return;
    }
    try {
      setSaving(true);
      let res;
      if (editing) {
        res = await Axios({ ...SummeryApi.updatePortalResource, data: { id: editing.id, ...form } });
      } else {
        res = await Axios({ ...SummeryApi.createPortalResource, data: form });
      }
      if (res.data?.success) {
        toast.success(editing ? "Resource updated" : "Resource added");
        closeModal();
        fetchResources();
      } else {
        toast.error(res.data?.message || "Failed to save resource");
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (r: Resource) => {
    try {
      const res = await Axios({ ...SummeryApi.updatePortalResource, data: { id: r.id, isActive: !r.isActive } });
      if (res.data?.success) {
        toast.success(r.isActive ? "Hidden from portal" : "Visible on portal");
        setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)));
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      setDeleteLoading(id);
      const res = await Axios({ ...SummeryApi.deletePortalResource, data: { id } });
      if (res.data?.success) {
        toast.success("Deleted");
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const audienceLabel = (a: Audience) => AUDIENCES.find((x) => x.value === a)?.label ?? a;
  const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.value === c)?.label ?? c;

  const input = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800">Portal Resources</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Certifications and POS/shelf-talker downloads for the Retailer and Distributor portals, plus the account manager contact card shown to retailers.
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-xl">
        <h2 className="font-semibold text-gray-800 mb-1">Account manager contact</h2>
        <p className="text-xs text-gray-500 mb-4">Shown on the Retailer portal's "Account manager" page.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <input className={input} placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          <input className={input} placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          <input className={input} placeholder="Hours (e.g. Mon–Fri, 9am–5pm)" value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} />
        </div>
        <button
          onClick={saveContact}
          disabled={contactSaving}
          className="mt-4 bg-secondary-hover hover:bg-secondary text-white font-semibold text-sm px-5 py-2 rounded-lg transition disabled:opacity-60"
        >
          {contactSaving ? "Saving..." : "Save contact"}
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Downloadable resources</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-secondary-hover hover:bg-secondary text-white font-bold py-2 px-5 rounded-lg transition"
        >
          <FaPlus className="text-sm" /> Add resource
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No resources yet. Add your first certification or POS asset!
                </td>
              </tr>
            ) : (
              resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 max-w-md">
                    <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-400 line-clamp-1">{r.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{categoryLabel(r.category)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{audienceLabel(r.audience)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(r)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold transition ${r.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                    >
                      {r.isActive ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <FaEdit className="text-xs" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleteLoading === r.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${deleteLoading === r.id ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                      >
                        <FaTrash className="text-xs" />
                        {deleteLoading === r.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-full overflow-y-scroll">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{editing ? "Edit resource" : "Add resource"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:bg-orange-200 p-1 rounded-full cursor-pointer hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={input}
                  placeholder="e.g. ISO 13485 certificate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`${input} resize-none`}
                  placeholder="Optional — shown under the title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                {form.fileUrl ? (
                  <div className="flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                    <a
                      href={form.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate min-w-0"
                    >
                      <FaFileAlt className="shrink-0" />
                      <span className="truncate">{form.fileUrl.split("/").pop()}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, fileUrl: "" }))}
                      className="text-xs text-red-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <FileUploader onUploaded={(url) => setForm((f) => ({ ...f, fileUrl: url }))} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className={input}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Audience }))}
                  className={input}
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  className={input}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-secondary-hover hover:bg-secondary cursor-pointer text-white rounded-lg font-medium transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
