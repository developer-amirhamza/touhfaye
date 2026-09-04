"use client"
import { SummeryApi } from '@/app/common/SummeryApi';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react'
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.forgotPassword,
                data: { email },
            });
            if (response.data.success) {
                toast.success(response.data.message);
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className='w-full min-h-screen h-full bg-no-repeat bg-center'>
            <div className="container px-5 mx-auto flex w-full justify-center py-6">
                <div className="bg-primary text-white shadow-2xl p-10 flex justify-center items-center w-full max-w-md h-full flex-col rounded-md gap-5">
                    <h1 className="text-2xl text-text text-center uppercase font-semibold">Forgot password</h1>
                    <p className="text-text-hover text-center text-base -mt-3">
                        Enter the email on your account and we&apos;ll send you a code to reset your password.
                    </p>
                    <form onSubmit={handleSubmit} className="grid gap-5 w-full text-lg">
                        <div className="grid gap-2 place-items-start">
                            <label htmlFor="email" className="font-medium text-text-hover">Email:</label>
                            <input className='w-full font-medium text-text p-2 outline-none border-2 border-secondary rounded focus-within:border-text'
                                value={email} type="email" onChange={handleOnChange} name="email" id="email" placeholder='Enter your email' required />
                        </div>
                        <input disabled={!email || loading} type="submit" value={loading ? "Sending.." : "Send reset code"}
                            className={`${email && !loading ? "bg-secondary-hover text-white cursor-pointer hover:bg-secondary" : "bg-primary-hover cursor-not-allowed"} p-2 text-secondary
                                  text-xl font-semibold rounded`} />
                        <div className="flex justify-between w-full px-1">
                            <h1 className="text-slate-600 font-medium">Already have a code?</h1>
                            <Link href={"/reset-password"} className='text-xl font-bold text-secondary'>Reset password</Link>
                        </div>
                        <div className="flex justify-center w-full px-1">
                            <Link href={"/signin"} className='text-base font-medium text-text-hover hover:underline'>Back to sign in</Link>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
}

export default ForgotPassword
