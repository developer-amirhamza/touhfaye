"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchOrderByNumber } from "@/redux/slices/orderSlice";
import Image from "next/image";
import successImage from "@/assets/home/order-complete-tZLZOpPC.gif"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const dispatch = useDispatch<AppDispatch>();
  const { currentOrder } = useSelector((state: RootState) => state.orderSlice);

  useEffect(() => {
    // For COD, orderId is passed. For Stripe, you might get session_id – adapt accordingly.
    // Here we assume orderId is passed.
    if (orderId) {
      // If you have an endpoint to fetch by orderId, otherwise just show order placed.
      // Simpler: just show success message.
    }
  }, [orderId, dispatch]);

  return (
    <div className="text-center py-10  gap-5 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-green-600">Order Placed Successfully!</h1>
      <p className="">Thank you for your purchase. Your order confirmation has been sent to your email.</p>
      <div className="flex w-full max-w-3/5   items-center justify-center">
        <Image src={successImage} className="object-cover h-full w-full rounded-md max-h-80 " alt="aidble"/>
      </div>
      <div className="flex items-center justify-between gap-5 max-w-3/5 w-full">
        <Link href="/order/my-orders/" className="mt-2 inline-block bg-blue-600 text-white px-6 font-semibold py-2 rounded">View Orders </Link>
        <Link href="/products/" className="mt-2 inline-block bg-primary font-semibold text-white px-6 py-2 rounded">Continue Shopping</Link>
      </div>
    </div>
  );
}