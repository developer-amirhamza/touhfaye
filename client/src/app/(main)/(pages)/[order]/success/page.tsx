"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  void orderId;

  return (
    <div className="bg-background min-h-screen py-20 px-6 flex flex-col items-center justify-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-secondary">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="font-secondary text-3xl text-title">Your order has been placed</h1>
      <p className="text-foreground font-light max-w-md">
        Thank you — a confirmation with your order details has been sent to your email. We&apos;ll dispatch it gift-wrapped, usually within 24 hours.
      </p>
      <div className="flex items-center justify-center gap-4 mt-2">
        <Link href="/order/my-orders/" className="bg-secondary hover:bg-secondary-hover text-background px-7 py-3.5 text-[11px] tracking-[.18em] transition-colors">
          VIEW ORDERS
        </Link>
        <Link href="/products/" className="border border-secondary text-secondary hover:bg-secondary/10 px-7 py-3.5 text-[11px] tracking-[.18em] transition-colors">
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
}
