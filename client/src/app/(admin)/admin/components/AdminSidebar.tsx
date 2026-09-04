"use client"
import React from "react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { RootState } from "@/redux/store";
import { adminNavItems } from "@/config/page";
import Link from "next/link";

interface Props {
    activeSidebar: boolean;
}

// Admin sidebar styled to match the customer portal shell:
// dark #1a1a18 panel, serif brand, warm #c9b89a accent for the active link.
const AdminSidebar: React.FC<Props> = ({ activeSidebar }) => {
    const { user } = useSelector((state: RootState) => state.userSlice);
    const pathname = usePathname();

    return (
        <div className={`flex flex-col w-full h-full bg-[#1a1a18] ${!activeSidebar ? "flex" : "max-sm:hidden"}`}>
            {/* Brand */}
            <Link href="/admin" className="px-6 py-5 border-b border-white/10 block">
                <span className="font-serif text-xl text-white">Bestiee</span>
                <span className={`${activeSidebar ? "block" : "hidden"} text-[10px] uppercase tracking-[0.2em] text-[#c9b89a] mt-1`}>
                    Admin Dashboard
                </span>
            </Link>

            {/* User */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
                <img
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    src={user?.avatar || `https://themewagon.github.io/pluto/images/layout_img/user_img.jpg`}
                    alt=""
                />
                <div className={`${activeSidebar ? "flex flex-col" : "hidden"} min-w-0`}>
                    <span className="text-white text-sm font-medium capitalize flex gap-2 truncate">{`${user?.firstName} ${user?.lastName} `  || "N/A"}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                        <span className="h-2 w-2 bg-green-500 rounded-full" /> Online
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-1">
                {adminNavItems.map((item, index) => {
                    const Icon = item?.icon;
                    const active = pathname === item?.path;
                    return (
                        <Link
                            key={index}
                            href={`${item?.path}`}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                activeSidebar ? "flex-row" : "flex-col text-center gap-1"
                            } ${
                                active
                                    ? "bg-[#c9b89a] text-[#1a1a18] font-semibold"
                                    : "text-gray-300 hover:bg-white/10"
                            }`}
                        >
                            <Icon className={`text-lg shrink-0 ${active ? "text-[#1a1a18]" : "text-[#c9b89a]"}`} />
                            <span className={`${activeSidebar ? "inline" : "text-[10px]"}`}>{item?.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminSidebar;
