"use client"
import { SummeryApi } from '@/app/common/SummeryApi';
import { fetchCart } from '@/redux/slices/cartSlice';
import { fetchUser } from '@/redux/slices/userSlices';
import { AppDispatch } from '@/redux/store';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import { portalPath } from '@/utils/roles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChangeEvent, FormEvent, useState } from 'react'
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';

const initialFormData = {
    email: "",
    password: "",
}
const SignIn = () => {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState(initialFormData);
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch<AppDispatch>()
    const router = useRouter()
    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.signin,
                data: formData,
                withCredentials: true,
            });
            if (response.data.success) {
                toast.success(response.data.message);
                localStorage.setItem("accessToken", response?.data?.data?.accessToken);
                localStorage.setItem("refreshToken", response?.data?.data?.refreshToken);
                try {
                    await Axios({ ...SummeryApi.mergeCart, withCredentials: true });
                } catch {
                    /* no guest cart to merge, or already merged — ignore */
                }
                dispatch(fetchUser())
                dispatch(fetchCart())
                setFormData(initialFormData);
                const role = response?.data?.data?.user?.role;
                router.push(portalPath(role))
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false)
        }
    }
    const validInput = Object.values(formData).every(el => el);
    const fieldCls = "border border-primary-hover bg-white px-4 py-3.5 text-sm font-light outline-none focus:border-secondary w-full"

    return (
        <section className="w-full min-h-screen bg-background py-14">
            <div className="container px-5 mx-auto flex justify-center">
                <div className="bg-white border border-primary-hover shadow-[0_1px_2px_rgba(18,40,28,.05),0_12px_32px_rgba(18,40,28,.07)] p-11 w-full max-w-md flex flex-col items-center">
                    <div className="text-[10.5px] tracking-[.24em] text-accent">WELCOME BACK</div>
                    <h1 className="font-secondary text-3xl text-title mt-3">Sign in</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-7">
                        <div>
                            <div className="text-[10.5px] tracking-[.18em] text-paragraph mb-2">EMAIL</div>
                            <input className={fieldCls} value={formData.email} type="email" onChange={handleOnChange} name="email" placeholder="you@example.com" required />
                        </div>
                        <div>
                            <div className="text-[10.5px] tracking-[.18em] text-paragraph mb-2">PASSWORD</div>
                            <div className="relative">
                                <input
                                    className={fieldCls}
                                    placeholder="Your password"
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
                        </div>
                        <button
                            disabled={!validInput}
                            type="submit"
                            className={`h-13 text-[11.5px] tracking-[.18em] transition-colors ${validInput ? "bg-secondary hover:bg-secondary-hover text-background cursor-pointer" : "bg-primary-hover text-foreground cursor-not-allowed"}`}
                        >
                            {loading ? "PROCESSING…" : "SIGN IN"}
                        </button>
                    </form>

                    <div className="border-t border-primary-hover mt-7 pt-6 flex flex-col items-center gap-3 text-center w-full">
                        <Link href="/forgot-password" className="text-sm text-accent border-b border-accent-light">Forgot password?</Link>
                        <p className="text-sm text-foreground font-light">
                            New to Touhfaye? <Link href="/signup" className="text-secondary border-b border-secondary">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SignIn
