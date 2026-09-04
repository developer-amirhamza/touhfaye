import { SummeryApi } from "@/app/common/SummeryApi";
import { setLogout } from "@/redux/slices/userSlices";
import { RootState } from "@/redux/store";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { normaliseRole, portalPath, ROLES } from "@/utils/roles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import { FaExternalLinkAlt, FaStore } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Divider from "./Divider";
import { VscSignOut } from "react-icons/vsc";

interface Type {
    close: any
}

const portalPaths = [
    {label:"Trade Portal", path:"/portal/trade"},
    {label:"Retailer Portal", path:"/portal/retailer"},
    {label:"Distributor Portal", path:"/portal/distributor"},
    {label:"NDIS Portal", path:"/portal/ndis"},
    {label:"Consumer Portal", path:"/portal/consumer"},
];

const UserMenu: React.FC<Type> = ({ close }) => {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.userSlice?.user);
    const router = useRouter();
    const role = normaliseRole(user?.role);
    // Trade/NDIS accounts have a dedicated portal — surface a direct link so
    // they're never stuck only in the regular consumer nav.
    const hasPortal = role === ROLES.TRADE || role === ROLES.NDIS_COORDINATOR;
    const teamPortal = role === ROLES.ADMIN  || role === ROLES.OWNER;

    const handleSignout = async () => {
        try {
            const response = await Axios({
                ...SummeryApi.signout,
            });
            toast.success(response?.data?.message);
        } catch (error) {
            AxiosToastError(error);
        } finally {
            // Always clear the local session and close the menu, even if the
            // signout request itself fails (e.g. expired token).
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            dispatch(setLogout());
            if (close) close();
            router.push("/");
        }
    };

    const handleCloseMenu = () => {
        if (close) {
            close();
        }
    };

    return (
        <div>
            <div className="flex  flex-col pt-3 gap-1.5 z-50  ">
                <h2 className="font-semibold px-2 text-text ">My Account</h2>
                <Link
                    onClick={handleCloseMenu}
                    href={"/my-profile/"}
                    className="text-text-hover flex gap-4 hover:text-text cursor-pointer hover:bg-primary items-center  font-medium px-2"
                >
                    <span className="">
                        {`${user?.firstName} ${user?.lastName}`|| user?.mobile}
                    </span>
                    <FaExternalLinkAlt size={16} />
                </Link>
                <Divider />
                <div className="grid gap-2">
                    {hasPortal && (
                        <Link
                            onClick={handleCloseMenu}
                            href={portalPath(role)}
                            className="text-text-hover hover:text-text px-2 font-semibold cursor-pointer hover:bg-primary flex items-center gap-2"
                        >
                            <FaStore size={16} />
                            {role === ROLES.TRADE ? "Trade Portal" : "NDIS Portal"}
                        </Link>
                    )}
                    {teamPortal && portalPaths.map((item,idx)=>(
                        <Link
                            key={idx}
                            onClick={handleCloseMenu}
                            href={item.path}
                            className="text-text-hover hover:text-text px-2 font-medium text-sm cursor-pointer hover:bg-primary flex items-center gap-2"
                        >
                            <FaStore size={16} />
                            {item.label}
                        </Link>
                    ))}

                    <Link
                        onClick={handleCloseMenu}
                        href={"/order/my-orders"}
                        className="text-text-hover hover:text-text px-2 font-medium cursor-pointer hover:bg-primary"
                    >
                        My Orders
                    </Link>
                </div>
                <button onClick={handleSignout}
                    className="text-md font-medium hover:bg-primary cursor-pointer px-3 py-2 rounded hover:text-text  flex items-center gap-2 t text-text-hover">
                    <VscSignOut size={24} /> <span className="text-xl font-bold  ">Signout</span>
                </button>
            </div>
        </div>
    );
};

export default UserMenu;
