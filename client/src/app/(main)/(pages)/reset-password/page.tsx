"use client"
import { SummeryApi } from '@/app/common/SummeryApi';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, FormEvent, Suspense, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const initialFormData = {
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
}

const ResetPasswordForm = () => {
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        ...initialFormData,
        email: searchParams.get("email") || "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.resetPassword,
                data: {
                    email: formData.email,
                    otp: formData.otp,
                    newPassword: formData.newPassword,
                },
            });
            if (response.data.success) {
                toast.success(response.data.message);
                router.push("/signin");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }

    const validInput = Boolean(formData.email && formData.otp && formData.newPassword && formData.confirmPassword);

    return (
        <section className='w-full min-h-screen h-full bg-no-repeat bg-center'>
            <div className="container px-5 mx-auto flex w-full justify-center py-6">
                <div className="bg-primary text-white shadow-2xl p-10 flex justify-center items-center w-full max-w-md h-full flex-col rounded-md gap-5">
                    <h1 className="text-2xl text-text text-center uppercase font-semibold">Reset password</h1>
                    <p className="text-text-hover text-center text-base -mt-3">
                        Enter the code we emailed you along with your new password.
                    </p>
                    <form onSubmit={handleSubmit} className="grid gap-5 w-full text-lg">
                        <div className="grid gap-2 place-items-start">
                            <label htmlFor="email" className="font-medium text-text-hover">Email:</label>
                            <input className='w-full font-medium text-text p-2 outline-none border-2 border-secondary rounded focus-within:border-text'
                                value={formData.email} type="email" onChange={handleOnChange} name="email" id="email" placeholder='Enter your email' required />
                        </div>
                        <div className="grid gap-2 place-items-start">
                            <label htmlFor="otp" className="font-medium text-text-hover">Reset code:</label>
                            <input className='w-full font-medium text-text p-2 outline-none border-2 border-secondary rounded focus-within:border-text tracking-widest'
                                value={formData.otp} type="text" onChange={handleOnChange} name="otp" id="otp" placeholder='6-digit code' inputMode='numeric' maxLength={6} required />
                        </div>
                        <div className="grid gap-2 place-items-start">
                            <label htmlFor="newPassword" className="font-medium text-text-hover">New password:</label>
                            <div className="relative w-full flex">
                                <input className='w-full font-medium text-text p-2 flex outline-none border-2 border-secondary rounded focus-within:border-text'
                                    placeholder='Enter your new password'
                                    value={formData.newPassword}
                                    onChange={handleOnChange}
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    id="newPassword"
                                    required
                                />
                                <div className="absolute right-3.5 text-xl text-secondary-hover cursor-pointer top-3.5 ">
                                    {showPassword ?
                                        <FaEye onClick={() => setShowPassword(false)} />
                                        : <FaEyeSlash onClick={() => setShowPassword(true)} />}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2 place-items-start">
                            <label htmlFor="confirmPassword" className="font-medium text-text-hover">Confirm new password:</label>
                            <input className='w-full font-medium text-text p-2 outline-none border-2 border-secondary rounded focus-within:border-text'
                                placeholder='Re-enter your new password'
                                value={formData.confirmPassword}
                                onChange={handleOnChange}
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                required
                            />
                        </div>
                        <input disabled={!validInput || loading} type="submit" value={loading ? "Resetting.." : "Reset password"}
                            className={`${validInput && !loading ? "bg-secondary-hover text-white cursor-pointer hover:bg-secondary" : "bg-primary-hover cursor-not-allowed"} p-2 text-secondary
                                  text-xl font-semibold rounded`} />
                        <div className="flex justify-between w-full px-1">
                            <h1 className="text-slate-600 font-medium">Didn&apos;t get a code?</h1>
                            <Link href={"/forgot-password"} className='text-xl font-bold text-secondary'>Request again</Link>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
}

const ResetPassword = () => (
    <Suspense fallback={null}>
        <ResetPasswordForm />
    </Suspense>
)

export default ResetPassword
