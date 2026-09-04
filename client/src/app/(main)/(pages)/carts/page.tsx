"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchCart, updateCartItem, deleteCartItem } from "@/redux/slices/cartSlice";
import Link from "next/link";

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { cart, status, error } = useSelector((state: RootState) => state.cartSlice);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCart());
    }
  }, [status, dispatch]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ itemId, quantity: newQuantity }));
  };

  const handleRemove = (itemId: string) => {
    dispatch(deleteCartItem(itemId));
  };

  if (status === "loading") return <div className="text-center py-10">Loading cart...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error: {error}</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-10">
        <p>Your cart is empty.</p>
        <Link href="/products" className="text-blue-600 underline">Continue Shopping</Link>
      </div>
    );
  }

  const unitPrice = (item: (typeof cart.items)[number]) => (item as any).displayPrice ?? item.product.price;

  const subtotal = cart.items.reduce((sum, item) => sum + (unitPrice(item) * item.quantity), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <img src={item.product.images?.[0] || "/placeholder.png"} alt={item.product.title} className="w-20 h-20 object-cover" />
              <div>
                <h3 className="font-semibold">{item.product.title}</h3>
                <p className="text-gray-600">${unitPrice(item).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
              <button onClick={() => handleRemove(item.id)} className="text-red-600 hover:text-red-800">Remove</button>
            </div>
            <div className="font-semibold">${(unitPrice(item) * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        <p className="text-xl font-bold">Subtotal: ${subtotal.toFixed(2)}</p>
        <Link href="/checkout" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}