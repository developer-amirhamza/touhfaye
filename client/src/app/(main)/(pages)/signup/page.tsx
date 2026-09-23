"use client"
import React, { FormEvent, useState } from 'react'
import { FaEye, FaEyeSlash } from "react-icons/fa";

import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { useRouter } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import fetchUserDetails from '@/utils/fetchUserDetaills';
import { setUserDetails } from '@/redux/slices/userSlices';
import { fetchCart } from '@/redux/slices/cartSlice';
import { AppDispatch } from '@/redux/store';
import AxiosToastError from '@/utils/AxiosToastError';
import Link from 'next/link';

const initialFormData = {
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
}

const SingUp = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()
    const handleOnChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!agreed) {
            toast.error("Please agree to the terms and privacy policy");
            return;
        }
        try {
            const response = await Axios({
                ...SummeryApi.signup,
                data: formData,
            });

            const responseData = response.data;
            if (responseData.success) {
                toast.success(responseData.message);
                const response = await Axios({
                    ...SummeryApi.signin,
                    data: formData,
                })
                if (response.data?.success) {
                    localStorage.setItem("accessToken", response.data?.data?.accessToken);
                    // Merge any guest cart into the new account (auth via the
                    // accessToken cookie the signin just set); never block signup.
                    try {
                        await Axios({ ...SummeryApi.mergeCart, withCredentials: true });
                    } catch {
                        /* no guest cart to merge — ignore */
                    }
                    const userDetails = await fetchUserDetails();
                    dispatch(setUserDetails(userDetails?.data))
                    dispatch(fetchCart())
                    setFormData(initialFormData)
                    router.push("/")
                }
            } else {
                toast.error(responseData.message)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }
    // Last name is optional; first name, email and password are required.
    const validInput = Boolean(formData.firstName && formData.email && formData.password);
    const fieldCls = "border border-primary-hover bg-white px-4 py-3.5 text-sm font-light outline-none focus:border-secondary w-full"

    return (
        <section className="flex w-full bg-background py-14">
            <div className="container px-5 mx-auto flex justify-center">
                <div className="bg-white border border-primary-hover shadow-[0_1px_2px_rgba(18,40,28,.05),0_12px_32px_rgba(18,40,28,.07)] p-11 w-full max-w-md">
                    <div className="text-[10.5px] tracking-[.24em] text-accent">JOIN TOUHFAYE</div>
                    <h1 className="font-secondary text-3xl text-title mt-3">Create an account</h1>
                    <p className="text-sm text-foreground font-light mt-2.5">
                        Already have one? <Link href="/signin" className="text-secondary border-b border-secondary">Sign in</Link>
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-7">
                        <div className="grid grid-cols-2 gap-3.5">
                            <input className={fieldCls} value={formData.firstName} type="text" onChange={handleOnChange} name="firstName" placeholder="First name" required />
                            <input className={fieldCls} value={formData.lastName} type="text" onChange={handleOnChange} name="lastName" placeholder="Last name" />
                        </div>
                        <input className={fieldCls} value={formData.mobile} type="tel" onChange={handleOnChange} name="mobile" placeholder="Mobile number" />
                        <input className={fieldCls} value={formData.email} type="email" onChange={handleOnChange} name="email" placeholder="Email" required />
                        <div className="relative">
                            <input
                                className={fieldCls}
                                placeholder="At least 8 characters"
                                value={formData.password}
                                onChange={handleOnChange}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                style={{ paddingRight: 48 }}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent cursor-pointer">
                                {showPassword
                                    ? <FaEye onClick={() => setShowPassword(false)} />
                                    : <FaEyeSlash onClick={() => setShowPassword(true)} />}
                            </div>
                        </div>

                        <label className="flex items-start gap-2.5 text-[13px] font-light text-paragraph cursor-pointer">
                            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-accent" />
                            I agree to the terms and privacy policy, and would like to hear about new arrivals.
                        </label>

                        <button
                            disabled={!validInput}
                            type="submit"
                            className={`h-13 text-[11.5px] tracking-[.18em] transition-colors ${validInput ? "bg-secondary hover:bg-secondary-hover text-background cursor-pointer" : "bg-primary-hover text-foreground cursor-not-allowed"}`}
                        >
                            CREATE ACCOUNT
                        </button>
                    </form>
                </div>
            </div>
        </section>
    )
}

export default SingUp
