"use client"
import React from 'react';
import logo from "@/assets/bestiee-logo.png";
import Image from 'next/image';
import Link from 'next/link';
import { IoCall, IoMail, IoLocationSharp } from 'react-icons/io5';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

const SHOP_LINKS = [
    { label: 'Adult Pads', href: '/products' },
    { label: 'Pull-up Underwear', href: '/products' },
    { label: 'Bed Pads', href: '/products' },
    { label: 'Skincare', href: '/products' },
    { label: 'Bundles', href: '/products' },
]

const SUPPORT_LINKS = [
    { label: 'NDIS Setup', href: '/ndis-support' },
    { label: 'Order Tracking', href: '/order-tracking' },
    { label: 'Returns', href: '/delivery-returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact-us' },
]

const COMPANY_LINKS = [
    { label: 'About Aidble', href: '/about-aidble' },
    { label: 'Care Guides', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Partnerships', href: '/professionals' },
    { label: 'Privacy', href: '/privacy-policy' },
]

const Footer = () => {
    return (
        <footer className="w-full bg-secondary pt-12 text-white">

            {/* Main footer content */}
            <div className="container mx-auto px-6 py-14  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

                {/* Brand column */}
                <div className="flex flex-col gap-5">
                     <Image src={logo} alt='Health U Australia' className='  max-w-30 px-2 rounded-md  bg-white   w-full justify-self-start items-center-safe   ' />

                    <p className="text-white text-sm leading-relaxed">
                       Bestiee is a registered NDIS provider supplying continence and personal care products to Australian families, carers and aged-care facilities.
                    </p>
                </div>

                {/* Shop column */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Shop</h3>
                    {SHOP_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-white text-sm transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Support column */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Support</h3>
                    {SUPPORT_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-white text-sm transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Company column */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Company</h3>
                    {COMPANY_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-white text-sm transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                {/* Contact info */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Company</h3>
                  <div className="flex flex-col gap-3 text-sm text-white">
                        <a href="tel:1300243253" className="flex items-center gap-2 hover:text-white-hover transition-colors">
                            <IoCall className="text-white shrink-0" size={16} />
                            0481 707 758
                        </a>
                        <a href="mailto:hello@mybestiee.com.au" className="flex items-center gap-2 hover:text-white-hover transition-colors">
                            <IoMail className="text-white shrink-0" size={16} />
                            hello@mybestiee.com.au
                        </a>
                        <div className="flex items-center gap-2">
                            <IoLocationSharp className="text-white shrink-0" size={16} />
                            Sydney · Melbourne · Brisbane
                        </div>
                    </div>
                    {/* Social icons */}
                    <div className="flex items-center text-background gap-3 mt-1">
                        <Link
                            href="https://www.facebook.com/aubestiee/"
                            className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-colors"
                        >
                            <FaFacebookF size={14} />
                        </Link>
                        <Link
                            href="https://www.instagram.com/bestieeau/"
                            className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-colors"
                        >
                            <FaInstagram size={14} />
                        </Link>
                        <Link
                            href="https://www.linkedin.com/company/bestiee"
                            className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-colors"
                        >
                            <FaLinkedinIn size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-primary mt-5 ">
                <div className="container mx-auto  px-6  flex flex-col  sm:flex-row items-center justify-between gap-2 text-xs text-white-hover">
                    <p className='py-5'>© {new Date().getFullYear()} Bestiee · ABN 00 000 000 000</p>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <MdVerified className="text-[#1a56db]" size={13} />
                            Registered NDIS Provider
                        </span>
                        <span>·</span>
                        <span>Made with care in Australia</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer