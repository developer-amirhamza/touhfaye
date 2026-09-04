"use client";
import React, { useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';

interface FileUploaderProps {
    // Called with the Cloudinary URL once the upload succeeds.
    onUploaded: (url: string, filename: string) => void;
    label?: string;
    className?: string;
}

// Uploads any picked file (PDFs, images, etc. — not just images, unlike
// ImageUploader) to Cloudinary via POST /api/image/upload-file and hands the
// resulting URL back to the caller — replaces manually pasting a file URL
// with an actual file picker.
const FileUploader: React.FC<FileUploaderProps> = ({ onUploaded, label = 'Upload file', className }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset so selecting the same file again still fires onChange.
        e.target.value = '';
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const response = await Axios({
                ...SummeryApi.fileUpload,
                data: formData,
            });
            const url = response?.data?.data?.secure_url;
            if (response.data?.success && url) {
                onUploaded(url, file.name);
            } else {
                toast.error(response.data?.message || 'File upload failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <label
            className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer
                ${uploading ? 'opacity-60 pointer-events-none' : ''} ${className || ''}`}
        >
            <input
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
            />
            {uploading ? 'Uploading...' : label}
        </label>
    );
};

export default FileUploader;
