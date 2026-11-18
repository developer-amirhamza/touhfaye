"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import EventForm from '@/app/(main)/components/EventForm';

export default function EditEventPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await Axios({
          ...SummeryApi.getEventById,
          data: { id },
        });
        if (response.data?.success) {
          setEvent(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader /></div>;
  if (!event) return <div className="text-center p-8">Event not found</div>;

  return <EventForm initialData={event} isEdit={true} eventId={id as string} />;
}
