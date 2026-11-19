"use client";
import React, { useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';

interface VideoUploaderProps {
    // Called with the Cloudinary URL once the upload succeeds.
    onUploaded: (url: string) => void;
    label?: string;
    className?: string;
}

// Uploads a picked video to Cloudinary via POST /api/image/upload-file (the
// same admin-only endpoint used for non-image assets — resource_type "auto"
// on the server handles video) and hands the resulting URL back. Shows a
// percentage, not just a spinner, since video files are large enough that a
// bare "Uploading..." can look stalled.
const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploaded, label = 'Upload video', className }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            setProgress(0);
            const response = await Axios({
                ...SummeryApi.fileUpload,
                data: formData,
                onUploadProgress: (event) => {
                    if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
                },
            });
            const url = response?.data?.data?.secure_url;
            if (response.data?.success && url) {
                onUploaded(url);
            } else {
                toast.error(response.data?.message || 'Video upload failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <label
            className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer
                ${uploading ? 'opacity-60 pointer-events-none' : ''} ${className || ''}`}
        >
            <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
            />
            {uploading ? `Uploading... ${progress}%` : label}
        </label>
    );
};

export default VideoUploader;
