"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import ImageUploader from '@/app/(admin)/admin/components/ImageUploader';
import { IoClose } from 'react-icons/io5';

const RichTextEditor = dynamic(() => import('@/app/(main)/components/UI/RichTextEditor'), { ssr: false });

interface FeedbackEntry {
  name: string;
  role: string;
  quote: string;
}

interface EventFormProps {
  initialData?: any;
  isEdit?: boolean;
  eventId?: string;
}

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const EventForm: React.FC<EventFormProps> = ({ initialData, isEdit = false, eventId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    description: '',
    category: '',
    location: '',
    eventDate: '',
    coverImage: '',
    isPublished: false,
  });
  const [designImages, setDesignImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        excerpt: initialData.excerpt || '',
        description: initialData.description || '',
        category: initialData.category || '',
        location: initialData.location || '',
        eventDate: toDateInput(initialData.eventDate),
        coverImage: initialData.coverImage || '',
        isPublished: initialData.isPublished || false,
      });
      setDesignImages(initialData.designImages || []);
      setGalleryImages(initialData.galleryImages || []);
      setFeedback(initialData.feedback || []);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addFeedback = () => setFeedback(prev => [...prev, { name: '', role: '', quote: '' }]);
  const removeFeedback = (index: number) => setFeedback(prev => prev.filter((_, i) => i !== index));
  const updateFeedback = (index: number, key: keyof FeedbackEntry, value: string) =>
    setFeedback(prev => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!form.title || !form.description) {
      toast.error('Title and description are required');
      return;
    }
    const payload = {
      title: form.title,
      excerpt: form.excerpt || undefined,
      description: form.description,
      category: form.category || undefined,
      location: form.location || undefined,
      eventDate: form.eventDate || undefined,
      coverImage: form.coverImage || undefined,
      designImages,
      galleryImages,
      feedback: feedback.filter(f => f.name || f.quote),
      isPublished: form.isPublished,
    };

    try {
      setLoading(true);
      let response;
      if (isEdit && eventId) {
        response = await Axios({
          ...SummeryApi.updateEvent,
          data: { id: eventId, ...payload },
        });
      } else {
        response = await Axios({
          ...SummeryApi.createEvent,
          data: payload,
        });
      }
      if (response.data?.success) {
        toast.success(isEdit ? 'Event updated successfully' : 'Event created successfully');
        router.push('/admin/events');
      } else {
        toast.error(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-primary-hover rounded-lg px-3 py-2 text-title focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent-light";
  const labelClass = "block font-medium mb-1 text-title";

  const ImageGrid = ({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) => (
    <div className="flex flex-wrap gap-3 mb-3">
      {images.map((src, i) => (
        <div key={src + i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-primary-hover group">
          <img src={src} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IoClose size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="font-secondary text-2xl text-title mb-6">{isEdit ? 'Edit event' : 'Create new event'}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Excerpt (short description)</label>
          <textarea
            name="excerpt"
            rows={2}
            value={form.excerpt}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description *</label>
          <RichTextEditor value={form.description} onChange={(html) => setForm(prev => ({ ...prev, description: html }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g., Corporate, Wedding"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Gulshan, Dhaka"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Event date</label>
            <input
              type="date"
              name="eventDate"
              value={form.eventDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cover image</label>
          <div className="flex items-center gap-3">
            {form.coverImage && (
              <img src={form.coverImage} alt="Cover" className="w-20 h-20 object-cover rounded-lg border border-primary-hover" />
            )}
            <ImageUploader
              onUploaded={(url) => setForm(prev => ({ ...prev, coverImage: url }))}
              label={form.coverImage ? 'Replace image' : 'Upload image'}
            />
            {form.coverImage && (
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, coverImage: '' }))}
                className="text-red-600 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Design showcase images</label>
          <ImageGrid images={designImages} onRemove={(i) => setDesignImages(prev => prev.filter((_, idx) => idx !== i))} />
          <ImageUploader onUploaded={(url) => setDesignImages(prev => [...prev, url])} label="+ Add design image" />
        </div>

        <div>
          <label className={labelClass}>Gallery photos</label>
          <ImageGrid images={galleryImages} onRemove={(i) => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} />
          <ImageUploader onUploaded={(url) => setGalleryImages(prev => [...prev, url])} label="+ Add gallery photo" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Client feedback</label>
            <button
              type="button"
              onClick={addFeedback}
              className="text-sm font-medium text-secondary hover:text-secondary-hover"
            >
              + Add quote
            </button>
          </div>
          {feedback.length === 0 && (
            <p className="text-sm text-foreground font-light">No feedback entries yet.</p>
          )}
          <div className="space-y-3">
            {feedback.map((f, i) => (
              <div key={i} className="border border-primary-hover rounded-lg p-3.5 relative">
                <button
                  type="button"
                  onClick={() => removeFeedback(i)}
                  className="absolute top-2.5 right-2.5 text-red-500 hover:text-red-700"
                >
                  <IoClose size={16} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5 pr-6">
                  <input
                    type="text"
                    placeholder="Name"
                    value={f.name}
                    onChange={(e) => updateFeedback(i, 'name', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Role / order type"
                    value={f.role}
                    onChange={(e) => updateFeedback(i, 'role', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Quote"
                  rows={2}
                  value={f.quote}
                  onChange={(e) => updateFeedback(i, 'quote', e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isPublished"
            id="isPublished"
            checked={form.isPublished}
            onChange={handleChange}
            className="accent-secondary"
          />
          <label htmlFor="isPublished" className="text-title">Publish immediately</label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-secondary text-secondary-light px-6 py-2 rounded-lg font-medium hover:bg-secondary-hover transition-colors disabled:opacity-60"
          >
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update event' : 'Create event')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-primary-hover text-title px-6 py-2 rounded-lg font-medium hover:bg-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
