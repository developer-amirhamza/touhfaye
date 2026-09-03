"use client"
import React from 'react';
import { useRouter } from 'next/navigation';

import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { getDisplayPrice } from '@/utils/PriceWithDiscount';
import { validURLConvert } from '@/utils/validURLConvart';
import AddToCartButton from './UI/AddToCartBtn';
import StarRating from '@/utils/StartRating';
import { RootState } from '@/redux/store';
import {useSelector} from "react-redux"


interface Type { data: any }

const ProductCard: React.FC<Type> = ({ data }) => {
    const router = useRouter();
    const url = `/product/${validURLConvert(data.title)}_${data.id}`;

    const discount = Number(data?.discount ?? 0);
    const finalPrice = getDisplayPrice(data);
    const hasDiscount = discount > 0;
    const isBestseller = data?.isFeatured;
    const isSale = hasDiscount;
    const {averageRating,totalReviews} = useSelector((state:RootState)=>state.reviewSlice)

    return (
        <div
            onClick={() => router.push(url)}
            className="group flex flex-col bg-white rounded-[18px] hover:scale-[1.02] transition-all shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer   duration-300"
        >
            {/* Image */}
            <div className="relative bg-[#d6cdc4] overflow-hidden" style={{ aspectRatio: '3/3.5' }}>
                <img
                    src={data?.images?.[0]}
                    alt={data?.title}
                    className="w-full h-full object-center group-hover:scale-[1.05] transition-transform duration-500"
                />

                {/* Badge pills — top left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isSale && (
                        <span className="px-2.5 py-0.75 rounded-full bg-white/90 text-gray-800 text-[11px] font-semibold leading-none shadow-sm">
                            Sale
                        </span>
                    )}
                    {isBestseller && (
                        <span className="px-2.5 py-0.75 rounded-full bg-white/90 text-gray-800 text-[11px] font-semibold leading-none shadow-sm">
                            Bestseller
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col p-4 gap-0.5">
                {data?.absorbency && (
                    <span className="self-start bg-primary text-secondary text-[11px] font-semibold rounded-full px-2.5 py-1 mb-1">
                        {data.absorbency}
                    </span>
                )}
                <h3 className="text-[14px] font-semibold text-secondary leading-snug line-clamp-1">
                    {data?.title}
                </h3>

                {/* {data?.description && (
                    <p className="text-[12px] text-gray-400 line-clamp-1 mt-0.5">
                        {data.description}
                    </p>
                )} */}
                <div className="flex gap-2 items-center mt-2">
                    <StarRating rating={averageRating} size={16} />
                    <span className="text-sm text-orange-500">{averageRating} ({totalReviews})</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[14px] font-bold text-gray-900">
                            {DisplayPriceInAud(finalPrice)}
                        </span>
                        {/* {hasDiscount && (
                            <span className="text-[13px] text-gray-400 line-through">
                                {DisplayPriceInAud(Number(data?.price ?? 0))}
                            </span>
                        )} */}
                        {data?.pack && (
                            <span className="text-[11px] text-gray-400">{data.pack}</span>
                        )}
                    </div>
                    <AddToCartButton data={data} />
                </div>
            </div>
        </div>
    );
};

export default ProductCard;