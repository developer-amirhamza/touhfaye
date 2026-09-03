"use client"
import React, { useEffect, useState } from 'react'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import { Toaster } from 'react-hot-toast'
import { fetchUser } from '@/redux/slices/userSlices'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { useParams, useRouter } from 'next/navigation'
import IsAdmin from '@/utils/IsAdmin'

const AdminLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const [showSidebar, setShowSidebar] = useState(true);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { pathname } = useParams();
    const { user, status } = useSelector((state: RootState) => state.userSlice);

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken && status == "idle") {
            dispatch(fetchUser())
        }
    }, [pathname]);

    // Guard: redirect non-admins away from the admin area.
    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        // No token at all -> send to sign in.
        if (!accessToken) {
            router.replace("/signin");
            return;
        }
        // User has been loaded and is not an admin -> kick out.
        if (status === "succeeded" && !IsAdmin(user?.role)) {
            router.replace("/");
        }
        if (status === "failed") {
            router.replace("/signin");
        }
    }, [status, user, router]);

    // While we don't yet know who the user is, don't flash the admin UI.
    if (status === "idle" || status === "loading") {
        return (
            <div className="flex w-full h-screen items-center justify-center bg-[#f5f0eb]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a18]"></div>
            </div>
        );
    }

    // Loaded but not an admin -> render nothing while the redirect happens.
    if (!IsAdmin(user?.role)) {
        return null;
    }

    return (
        <>
            <div className="flex w-full h-screen items-start bg-[#f5f0eb] overflow-x-hidden transition-all duration-700">
                <div
                    className={`w-full max-w-fit sticky h-screen overflow-y-auto no-scrollbar bg-[#1a1a18] z-50 flex`}
                >
                    <AdminSidebar activeSidebar={showSidebar} />
                </div>
                <div className="w-full h-screen flex  flex-col">
                    <AdminHeader sidebar={() => setShowSidebar(!showSidebar)} />
                    <div className=" no-scrollbar overflow-y-auto">
                        {children}
                    </div>
                </div>
                <Toaster />
            </div>
        </>
    )
}

export default AdminLayout
