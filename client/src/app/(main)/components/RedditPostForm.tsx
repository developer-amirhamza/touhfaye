"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

interface RedditPostFormProps {
  initialData?: any;
  isEdit?: boolean;
  postId?: string;
}

// Convert an ISO datetime to the value a <input type="datetime-local"> needs
// (local time, no timezone/seconds), and back again on submit.
const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const RedditPostForm: React.FC<RedditPostFormProps> = ({ initialData, isEdit = false, postId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subreddit: '',
    title: '',
    author: '',
    flair: '',
    upvotes: '0',
    comments: '0',
    url: '',
    postedAt: '',
    isPublished: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        subreddit: initialData.subreddit || '',
        title: initialData.title || '',
        author: initialData.author || '',
        flair: initialData.flair || '',
        upvotes: initialData.upvotes != null ? String(initialData.upvotes) : '0',
        comments: initialData.comments != null ? String(initialData.comments) : '0',
        url: initialData.url || '',
        postedAt: toDatetimeLocal(initialData.postedAt),
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
    if (!form.subreddit || !form.title || !form.author || !form.flair) {
      toast.error('Subreddit, title, author, flair and link are required');
      return;
    }
    const payload = {
      subreddit: form.subreddit,
      title: form.title,
      author: form.author,
      flair: form.flair,
      url: form.url,
      upvotes: form.upvotes !== '' ? Number(form.upvotes) : 0,
      comments: form.comments !== '' ? Number(form.comments) : 0,
      postedAt: form.postedAt ? new Date(form.postedAt).toISOString() : undefined,
      isPublished: form.isPublished,
    };

    try {
      setLoading(true);
      let response;
      if (isEdit && postId) {
        response = await Axios({ ...SummeryApi.updateRedditPost, data: { id: postId, ...payload } });
      } else {
        response = await Axios({ ...SummeryApi.createRedditPost, data: payload });
      }
      if (response.data?.success) {
        toast.success(isEdit ? 'Post updated' : 'Post created');
        router.push('/admin/reddit-posts');
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
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Reddit Post' : 'Create Reddit Post'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Subreddit *</label>
            <input
              type="text"
              name="subreddit"
              value={form.subreddit}
              onChange={handleChange}
              placeholder="e.g. r/AgingParents"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Author *</label>
            <input
              type="text"
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="e.g. u/quiet_kettle"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Post title *</label>
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
          <label className="block font-medium mb-1">Link to the real Reddit thread (optional)</label>
          <input
            type="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://www.reddit.com/r/..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Flair *</label>
            <input
              type="text"
              name="flair"
              value={form.flair}
              onChange={handleChange}
              placeholder="e.g. Carer win, Funding"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Upvotes</label>
            <input
              type="number"
              min={0}
              name="upvotes"
              value={form.upvotes}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Comments</label>
            <input
              type="number"
              min={0}
              name="comments"
              value={form.comments}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Posted at</label>
          <input
            type="datetime-local"
            name="postedAt"
            value={form.postedAt}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank to use the current date/time. Used to compute the "X ago" label shown on the homepage.</p>
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
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Post' : 'Create Post'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RedditPostForm;
