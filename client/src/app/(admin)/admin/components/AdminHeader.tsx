"use client"

import React, { useState } from "react";
import { IoMenuSharp } from "react-icons/io5";
import Logo from "@/assets/header-logosr.png";
import { TbLogout } from "react-icons/tb";
import { FaRegBell, FaRegEnvelope } from "react-icons/fa";
import { BsQuestionCircleFill } from "react-icons/bs";
import { IoIosArrowDown } from "react-icons/io";
import { useSelector } from "react-redux";

import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { setLogout } from "@/redux/slices/userSlices";
import AdminPermission from "./AdminPermission";
import { SummeryApi } from "@/app/common/SummeryApi";
import { TbHomeMove } from "react-icons/tb";
interface Props {
    sidebar: any;
}
const AdminHeader: React.FC<Props> = ({ sidebar }) => {
    const [isActive, setIsActive] = useState(false);
    const { user } = useSelector((state: RootState) => state.userSlice);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const handleLogout = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.signout,
            });
            if (response.data?.success) {
                toast.success(response.data?.message);
                dispatch(setLogout());
                localStorage.clear();
                router.push("/");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex w-full h-full max-h-16 bg-[#1a1a18] items-center border-b border-white/10 z-100">
            <button
                onClick={sidebar}
                className="cursor-pointer min-h-full p-4 flex text-[#c9b89a] hover:bg-white/10 transition-colors"
            >
                <IoMenuSharp className="text-2xl" />
            </button>
            <div className="flex w-full h-full items-center justify-between px-4">
                {/* <Image className="max-h-10 object-scale-down max-w-fit" src={Logo} alt="" /> */}

                <button
                onClick={()=> router.push("/")}
                className="cursor-pointer min-h-full p-4 flex text-[#c9b89a] hover:bg-white/10 transition-colors"
            >
                <TbHomeMove className="text-2xl" />
            </button>

                <ul className="flex items-center gap-5 px-2">
                    <li className="relative cursor-pointer text-gray-300 hover:text-white transition-colors">
                        <FaRegBell size={19} />
                        <span className="absolute bg-[#c9b89a] text-[#1a1a18] text-[10px] font-bold h-4 w-4 items-center justify-center flex -right-2 -top-2 rounded-full">
                            4
                        </span>
                    </li>
                    <li className="relative cursor-pointer text-gray-300 hover:text-white transition-colors">
                        <BsQuestionCircleFill size={19} />
                    </li>
                    <li className="relative cursor-pointer text-gray-300 hover:text-white transition-colors">
                        <FaRegEnvelope size={19} />
                        <span className="absolute bg-[#c9b89a] text-[#1a1a18] text-[10px] font-bold h-4 w-4 items-center justify-center flex -right-2 -top-2 rounded-full">
                            4
                        </span>
                    </li>
                </ul>
            </div>
            <div className="relative z-100 min-w-fit px-4 py-2 items-center flex border-l border-white/10 h-full">
                <div className="flex w-full gap-3 items-center">
                    <img
                        className="w-10 h-10 object-cover rounded-full"
                        src={
                            user?.avatar ||
                            `https://themewagon.github.io/pluto/images/layout_img/user_img.jpg`
                        }
                        alt=""
                    />
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className="flex w-full text-white font-medium cursor-pointer items-center gap-1"
                    >
                        <h1 className="text-sm capitalize">{user?.name}</h1>
                        <IoIosArrowDown size={16} className="text-[#c9b89a]" />
                    </button>
                </div>
                <ul
                    className={`${isActive
                        ? "translate-y-0 opacity-100 z-10"
                        : "opacity-0 max-h-0 -translate-y-36"
                        } -z-10 absolute top-16 w-full transition-all duration-500 bg-white rounded-b-xl grid shadow-lg overflow-hidden left-0`}
                >
                    <li
                        onClick={() => {
                            router.push(`/admin-profile`), setIsActive(false);
                        }}
                        className="cursor-pointer hover:bg-[#f5f0eb] text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
                    >
                        My Profile
                    </li>
                    <li
                        onClick={() => {
                            router.push(`/profile-setting`), setIsActive(false);
                        }}
                        className="cursor-pointer hover:bg-[#f5f0eb] text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Settings
                    </li>
                    <AdminPermission>
                        <li
                            onClick={() => {
                                router.push(`/all-users`), setIsActive(false);
                            }}
                            className="cursor-pointer hover:bg-[#f5f0eb] text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
                        >
                            All Users
                        </li>
                    </AdminPermission>

                    <div
                        onClick={handleLogout}
                        className="hover:bg-[#1a1a18] hover:text-white text-gray-700 cursor-pointer px-4 py-2 text-sm font-medium transition-colors flex items-center gap-3"
                    >
                        <span>{loading ? "Loading.." : "Logout"}</span>
                        <TbLogout size={18} />
                    </div>
                </ul>
            </div>
        </div>
    );
};

export default AdminHeader;