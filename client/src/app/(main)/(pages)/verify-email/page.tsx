"use client"
import { SummeryApi } from '@/app/common/SummeryApi';
import Axios from '@/utils/Axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react'

type Status = "pending" | "checking" | "success" | "error";

const VerifyEmailContent = () => {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const [status, setStatus] = useState<Status>(code ? "checking" : "pending");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!code) return;
        (async () => {
            try {
                const response = await Axios({
                    ...SummeryApi.verifyEmail,
                    data: { code },
                });
                if (response.data.success) {
                    setStatus("success");
                    setMessage(response.data.message);
                } else {
                    setStatus("error");
                    setMessage(response.data.message || "This verification link is invalid.");
                }
            } catch (error: any) {
                setStatus("error");
                setMessage(error?.response?.data?.message || "This verification link is invalid or has expired.");
            }
        })();
    }, [code]);

    return (
        <section className='w-full min-h-screen h-full bg-no-repeat bg-center'>
            <div className="container px-5 mx-auto flex w-full justify-center py-6">
                <div className="bg-primary text-white shadow-2xl p-10 flex justify-center items-center w-full max-w-md h-full flex-col rounded-md gap-5 text-center">
                    {status === "pending" && (
                        <>
                            <h1 className="text-2xl text-text uppercase font-semibold">Check your email</h1>
                            <p className="text-text-hover text-base">
                                We&apos;ve sent a verification link to your email address. Click it to verify your account.
                            </p>
                        </>
                    )}
                    {status === "checking" && (
                        <>
                            <h1 className="text-2xl text-text uppercase font-semibold">Verifying your email…</h1>
                            <p className="text-text-hover text-base">Please wait a moment.</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <h1 className="text-2xl text-text uppercase font-semibold">Email verified</h1>
                            <p className="text-text-hover text-base">{message}</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <h1 className="text-2xl text-text uppercase font-semibold">Verification failed</h1>
                            <p className="text-text-hover text-base">{message}</p>
                        </>
                    )}
                    <Link href={"/"} className='text-xl font-bold text-secondary hover:underline'>Continue to your portal </Link>
                </div>
            </div>
        </section>
    )
}

const VerifyEmail = () => (
    <Suspense fallback={null}>
        <VerifyEmailContent />
    </Suspense>
)

export default VerifyEmail
