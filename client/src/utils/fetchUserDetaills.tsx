"use client"
import { SummeryApi } from "@/app/common/SummeryApi";
import Axios from "./Axios";

// A failed "who am I" check almost always just means the visitor is a guest
// or their session expired — both are normal, silent states, not errors, so
// this deliberately doesn't toast on failure. Callers read the resulting
// `status` from Redux (see userSlices.ts) instead.
const fetchUserDetails = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await Axios({
        ...SummeryApi.getUserDetails,
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true,
    })
    return response?.data;
};



export default fetchUserDetails;