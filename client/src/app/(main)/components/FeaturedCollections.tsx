"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import { getDisplayPrice } from '@/utils/PriceWithDiscount';
import { validURLConvert } from '@/utils/validURLConvart';
import FavoriteButton from './UI/FavoriteButton';

// The home page's curated collection strips — set per product from the admin
// form's "Home page collection" field (Product.collectionTag). Mirrors the
// design mock's Bestsellers/Combo Packages/New Arrivals sections, using only
// products an admin has actually tagged rather than fabricated demo picks.
const SECTIONS = [
    {
        tag: 'NEW_ARRIVAL',
        eyebrow: 'FRESH FROM THE STUDIO',
        title: 'New Arrivals',
        desc: 'New prints, new colourways and the latest pours, added to the collection this month.',
        cta: 'EXPLORE NEW ARRIVALS',
        bg: '#F6F1E9',
    },
    {
        tag: 'BEST_SELLER',
        eyebrow: 'LOVED BY OUR CUSTOMERS',
        title: 'Bestsellers',
        desc: 'The candles and keepsakes people come back for, reordered week after week for birthdays, Eid and every small thank-you in between.',
        cta: 'SHOP BESTSELLERS',
        bg: '#FBF7F0',
    },
    {
        tag: 'COMBO_PACKAGE',
        eyebrow: 'MORE TO GIVE, LESS TO SPEND',
        title: 'Combo Packages',
        desc: 'Sets and hampers assembled in the studio, wrapped with ribbon and a handwritten card, priced below the pieces bought separately.',
        cta: 'EXPLORE COMBOS',
        bg: '#F6F1E9',
    },
] as const;

// Real, data-driven stand-in for the mock's "N sizes/colours available" line
// — never invented copy, unlike the mock's fixed demo text.
const variantLine = (p: any): string | null => {
    if (p.sizes?.length > 0) return `${p.sizes.length} ${p.sizes.length === 1 ? 'size' : 'sizes'} available`;
    if (p.colors?.length > 0) return `${p.colors.length} ${p.colors.length === 1 ? 'colour' : 'colours'} available`;
    if (p.pack) return p.pack;
    return null;
};

const FeaturedCollections: React.FC = () => {
    const [byTag, setByTag] = useState<Record<string, any[]>>({});

    useEffect(() => {
        let cancelled = false;
        Promise.all(
            SECTIONS.map((s) =>
                Axios({ ...SummeryApi.searchProduct, params: { collectionTag: s.tag, limit: 8 } })
                    .then((res) => [s.tag, res.data?.success ? res.data.data : []] as const)
                    .catch(() => [s.tag, []] as const)
            )
        ).then((results) => {
            if (cancelled) return;
            setByTag(Object.fromEntries(results));
        });
        return () => { cancelled = true; };
    }, []);

    const sectionsWithProducts = SECTIONS.filter((s) => (byTag[s.tag]?.length ?? 0) > 0);
    if (sectionsWithProducts.length === 0) return null;

    return (
        <>
            {sectionsWithProducts.map((section) => {
                const items = byTag[section.tag];
                return (
                    <section key={section.tag} style={{ backgroundColor: section.bg }} className="py-18 px-6">
                        <div className="max-w-[1240px] mx-auto">
                            <div className="text-center max-w-[680px] mx-auto">
                                <div className="text-[11.5px] tracking-[.2em] text-title font-medium">{section.eyebrow}</div>
                                <h2 className="font-secondary text-4xl md:text-5xl leading-[1.1] mt-4 text-title">{section.title}</h2>
                                <p className="text-[15px] leading-[1.8] text-foreground font-light mt-4">{section.desc}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-11">
                                {items.map((p: any) => {
                                    const url = `/product/${validURLConvert(p.title)}_${p.id}`;
                                    const finalPrice = getDisplayPrice(p);
                                    const hasDiscount = Number(p?.discount ?? 0) > 0;
                                    const variant = variantLine(p);
                                    return (
                                        <div key={p.id} className="flex flex-col items-center text-center bg-white shadow-[0_1px_2px_rgba(18,40,28,.06),0_8px_24px_rgba(18,40,28,.08)] hover:shadow-[0_2px_4px_rgba(18,40,28,.08),0_16px_36px_rgba(18,40,28,.14)] hover:-translate-y-0.5 transition-all pb-5">
                                            <div className="relative w-full aspect-square bg-primary overflow-hidden">
                                                <Link href={url} className="absolute inset-0">
                                                    {p.images?.[0] && (
                                                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                                    )}
                                                </Link>
                                                {hasDiscount && (
                                                    <span className="absolute top-3 left-3 bg-secondary text-background text-[10.5px] tracking-[.04em] font-medium px-1.75 py-1">
                                                        {p.discount}% OFF
                                                    </span>
                                                )}
                                                <FavoriteButton product={p} size={20} className="absolute top-2.5 right-2.5 text-secondary" />
                                            </div>
                                            <Link href={url} className="text-[15.5px] text-title mt-4.5 w-full px-4 truncate">
                                                {p.title}
                                            </Link>
                                            <div className="flex gap-2.5 items-baseline justify-center mt-2 text-[15.5px] text-title">
                                                <span>{DisplayPriceInBdt(finalPrice)}</span>
                                                {hasDiscount && (
                                                    <span className="text-[#8E968C] line-through font-light">{DisplayPriceInBdt(Number(p.price))}</span>
                                                )}
                                            </div>
                                            {variant && (
                                                <div className="text-[13.5px] text-foreground font-light mt-2">{variant}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center mt-11">
                                <Link
                                    href={`/products?collectionTag=${section.tag}`}
                                    className="bg-secondary hover:bg-secondary-hover text-background px-9 py-4 text-[12.5px] tracking-[.2em] font-medium transition-colors"
                                >
                                    {section.cta} →
                                </Link>
                            </div>
                        </div>
                    </section>
                );
            })}
        </>
    );
};

export default FeaturedCollections;
