"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

interface TrainingSessionFormProps {
  initialData?: any;
  isEdit?: boolean;
  sessionId?: string;
}

// Convert an ISO datetime to the value a <input type="datetime-local"> needs
// (local time, no timezone/seconds), and back again on submit.
const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TrainingSessionForm: React.FC<TrainingSessionFormProps> = ({ initialData, isEdit = false, sessionId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tag: '',
    title: '',
    description: '',
    audience: '',
    durationMin: '',
    sessionType: 'LIVE',
    startsAt: '',
    capacity: '',
    isPublished: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        tag: initialData.tag || '',
        title: initialData.title || '',
        description: initialData.description || '',
        audience: initialData.audience || '',
        durationMin: initialData.durationMin != null ? String(initialData.durationMin) : '',
        sessionType: initialData.sessionType || 'LIVE',
        startsAt: toDatetimeLocal(initialData.startsAt),
        capacity: initialData.capacity != null ? String(initialData.capacity) : '',
        isPublished: initialData.isPublished ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tag || !form.title || !form.description || !form.audience || !form.durationMin) {
      toast.error('Tag, title, description, audience and duration are required');
      return;
    }
    const payload = {
      tag: form.tag,
      title: form.title,
      description: form.description,
      audience: form.audience,
      durationMin: Number(form.durationMin),
      sessionType: form.sessionType,
      startsAt: form.sessionType === 'ON_DEMAND' ? null : form.startsAt ? new Date(form.startsAt).toISOString() : null,
      capacity: form.capacity !== '' ? Number(form.capacity) : null,
      isPublished: form.isPublished,
    };

    try {
      setLoading(true);
      let response;
      if (isEdit && sessionId) {
        response = await Axios({ ...SummeryApi.updateTrainingSession, data: { id: sessionId, ...payload } });
      } else {
        response = await Axios({ ...SummeryApi.createTrainingSession, data: payload });
      }
      if (response.data?.success) {
        toast.success(isEdit ? 'Session updated' : 'Session created');
        router.push('/admin/training-sessions');
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Training Session' : 'Create Training Session'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Tag *</label>
            <input
              type="text"
              name="tag"
              value={form.tag}
              onChange={handleChange}
              placeholder="e.g. Live webinar, On demand, For pharmacies"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Session type *</label>
            <select
              name="sessionType"
              value={form.sessionType}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="LIVE">Live</option>
              <option value="ON_DEMAND">On demand</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description *</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Audience *</label>
            <input
              type="text"
              name="audience"
              value={form.audience}
              onChange={handleChange}
              placeholder="e.g. Family carers"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Duration (minutes) *</label>
            <input
              type="number"
              min={1}
              name="durationMin"
              value={form.durationMin}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {form.sessionType === 'LIVE' && (
            <div>
              <label className="block font-medium mb-1">Starts at</label>
              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block font-medium mb-1">Capacity (blank = unlimited)</label>
            <input
              type="number"
              min={0}
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              placeholder="e.g. 30"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isPublished"
            id="isPublished"
            checked={form.isPublished}
            onChange={handleChange}
          />
          <label htmlFor="isPublished">Published (visible on the homepage)</label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Session' : 'Create Session'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainingSessionForm;
