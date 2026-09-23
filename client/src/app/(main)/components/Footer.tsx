"use client"
import React from 'react';
import logo from "@/assets/touhfaye-logo.png";
import Image from 'next/image';
import Link from 'next/link';
import { IoCall, IoMail, IoLocationSharp } from 'react-icons/io5';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';

const SHOP_LINKS = [
    { label: 'Scented candles', href: '/products?category=candles' },
    { label: 'Jewellery', href: '/products?category=jewellery' },
    { label: 'Gift sets', href: '/products?category=gift-sets' },
    { label: 'Corporate gifting', href: '/contact-us' },
]

const HELP_LINKS = [
    { label: 'Delivery', href: '/contact-us' },
    { label: 'Returns', href: '/contact-us' },
    { label: 'Candle care', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact us', href: '/contact-us' },
]

const Footer = () => {
    return (
        <footer className="w-full bg-secondary pt-12 text-secondary-light">

            {/* Main footer content */}
            <div className="container mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

                {/* Brand column */}
                <div className="flex flex-col gap-5">
                    <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center overflow-hidden">
                        <Image src={logo} alt="Touhfaye" className="w-24 h-24 object-contain" />
                    </div>
                    <p className="text-secondary-light/80 text-sm leading-relaxed max-w-[32ch]">
                        Gifts that speak from the heart. Candles, jewellery and keepsakes, wrapped and delivered across Bangladesh.
                    </p>
                </div>

                {/* Shop column */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-[10.5px] font-medium uppercase tracking-[.2em] text-secondary-light/60 mb-1">Shop</h3>
                    {SHOP_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-secondary-light text-sm font-light hover:text-accent-light transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Help column */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-[10.5px] font-medium uppercase tracking-[.2em] text-secondary-light/60 mb-1">Help</h3>
                    {HELP_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-secondary-light text-sm font-light hover:text-accent-light transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Contact info */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-[10.5px] font-medium uppercase tracking-[.2em] text-secondary-light/60 mb-1">Get in touch</h3>
                    <div className="flex flex-col gap-3 text-sm font-light text-secondary-light">
                        <a href="tel:+8801XXXXXXXXX" className="flex items-center gap-2 hover:text-accent-light transition-colors">
                            <IoCall className="shrink-0" size={16} />
                            +880 1XXX-XXXXXX
                        </a>
                        <a href="mailto:hello@touhfaye.com" className="flex items-center gap-2 hover:text-accent-light transition-colors">
                            <IoMail className="shrink-0" size={16} />
                            hello@touhfaye.com
                        </a>
                        <div className="flex items-center gap-2">
                            <IoLocationSharp className="shrink-0" size={16} />
                            Bashundhara R/A, Dhaka
                        </div>
                    </div>
                    {/* Social icons */}
                    <div className="flex items-center gap-3 mt-1">
                        <Link
                            href="https://www.facebook.com/touhfaye"
                            className="w-9 h-9 rounded-full bg-secondary-hover hover:bg-accent hover:text-secondary flex items-center justify-center transition-colors"
                        >
                            <FaFacebookF size={14} />
                        </Link>
                        <Link
                            href="https://www.instagram.com/touhfaye"
                            className="w-9 h-9 rounded-full bg-secondary-hover hover:bg-accent hover:text-secondary flex items-center justify-center transition-colors"
                        >
                            <FaInstagram size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-secondary-hover mt-5">
                <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary-light/60">
                    <p className="py-5">© {new Date().getFullYear()} Touhfaye</p>
                    <div className="flex items-center gap-4">
                        <span>Cash on delivery · bKash · Nagad</span>
                        <span>·</span>
                        <span>Delivered nationwide</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
