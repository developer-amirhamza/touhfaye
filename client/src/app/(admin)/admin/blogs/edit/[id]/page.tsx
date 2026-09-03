"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import BlogForm from '@/app/(main)/components/BlogForm';

export default function EditBlogPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await Axios({
          ...SummeryApi.getBlogById,
          data:{id:id}
        })
        if (response.data?.success) {
          setBlog(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setLoading(false);
        AxiosToastError(error)
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBlog();
  }, [id]);

  if (loading) return <div className="flex justify-center p-8"><Loader /></div>;
  if (!blog) return <div className="text-center p-8">Blog not found</div>;

  return <BlogForm initialData={blog} isEdit={true} blogId={id as string} />;
}