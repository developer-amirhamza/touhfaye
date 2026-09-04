"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import TrainingSessionForm from '@/app/(main)/components/TrainingSessionForm';

export default function EditTrainingSessionPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await Axios({ ...SummeryApi.getAllTrainingSessionsAdmin });
        if (response.data?.success) {
          const found = response.data.data.find((s: any) => s.id === id);
          setSession(found || null);
        }
      } catch (error) {
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSession();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader /></div>;
  if (!session) return <div className="text-center p-8">Training session not found</div>;

  return <TrainingSessionForm initialData={session} isEdit sessionId={id} />;
}
