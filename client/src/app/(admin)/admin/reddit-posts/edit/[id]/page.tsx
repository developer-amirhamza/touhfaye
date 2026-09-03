"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import RedditPostForm from '@/app/(main)/components/RedditPostForm';

export default function EditRedditPostPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await Axios({ ...SummeryApi.getAllRedditPostsAdmin });
        if (response.data?.success) {
          const found = response.data.data.find((p: any) => p.id === id);
          setPost(found || null);
        }
      } catch (error) {
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader /></div>;
  if (!post) return <div className="text-center p-8">Reddit post not found</div>;

  return <RedditPostForm initialData={post} isEdit postId={id} />;
}
