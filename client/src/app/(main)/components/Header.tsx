"use client"
import Image from 'next/image'
import React, { useEffect, useState, useRef } from 'react'
import { IoCall } from 'react-icons/io5'
import { MdVerified } from 'react-icons/md'
import { FaTruck, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa'
import logo from "@/assets/bestiee-logo.png"
import { BsCart4 } from 'react-icons/bs'
import { GoTriangleDown, GoTriangleUp } from 'react-icons/go'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { fetchCart } from '@/redux/slices/cartSlice'
import { fetchUser } from '@/redux/slices/userSlices'
import { fetchCategories } from '@/redux/slices/categorySlice'
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud'
import CartMenu from './CartMenu'
import Search from './Search'
import TrackOrderModal from './TrackOrderModal'
import Link from 'next/link'
import UserMenu from './UI/UserMenu';
import { motion, AnimatePresence } from 'framer-motion';
import AutoScrollSlider from './AutoScrollSlider'

// Plain (non-dropdown) nav links — "Shop" is rendered separately as the
// category mega-menu.
const NAV_LINKS = [
    { label: 'NDIS & Support', href: '/apply/ndis' },
    { label: 'Trade', href: '/apply/trade' },
    { label: 'Blog', href: '/blog' },
    // { label: 'Community', href: '/#community' },
    { label: "FAQ", href: "/faq" },
    { label: 'Contact', href: '/contact-us' },
]

const Header = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { cart, status } = useSelector((state: RootState) => state.cartSlice)
    const user = useSelector((state: RootState) => state.userSlice)
    const { categories } = useSelector((state: RootState) => state.categorySlice)
    const router = useRouter()

    const [openCartMenu, setOpenCartMenu] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [topbarVisible, setTopbarVisible] = useState(true)
    const [shopOpen, setShopOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [trackOrderOpen, setTrackOrderOpen] = useState(false)
    const [cartPulsing, setCartPulsing] = useState(false)
    const shopRef = useRef<HTMLDivElement>(null)
    const prevCartCount = useRef<number | null>(null)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY === 0) {
                setTopbarVisible(true)
            } else {
                setTopbarVisible(false)
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        if (status === 'idle') dispatch(fetchCart())
    }, [status, dispatch])

    useEffect(() => {
        // Read localStorage live rather than from state — `user.status` is
        // reset to "idle" on sign-out too, and a stale token value captured
        // once at mount would otherwise re-fire fetchUser() right after
        // sign-out clears it, surfacing a spurious "token missing" toast.
        const token = localStorage.getItem('accessToken')
        if (token && user.status === 'idle') {
            dispatch(fetchUser())
        }
    }, [user.status, dispatch])

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories())
        }
    }, [dispatch, categories.length])

    // Close the Shop mega-menu on an outside click (hover already closes it
    // on desktop; this covers touch/keyboard).
    useEffect(() => {
        if (!shopOpen) return
        const handleClick = (e: MouseEvent) => {
            if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
                setShopOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [shopOpen])

    const subtotal = cart?.items?.reduce(
        (sum, item) => sum + ((item as any).displayPrice ?? item.product.price) * item.quantity, 0
    ) ?? 0

    const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

    // Pulse the cart icon when an item is added — but not on first load, when
    // the count merely arrives from the initial fetch.
    useEffect(() => {
        const prev = prevCartCount.current
        prevCartCount.current = cartCount
        if (prev !== null && cartCount > prev) {
            setCartPulsing(true)
            const timer = setTimeout(() => setCartPulsing(false), 650)
            return () => clearTimeout(timer)
        }
    }, [cartCount])

    return (
        <div className="sticky top-0 gap-3  z-50 ">

            <div
                className={`bg-secondary text-background transition-all duration-300 overflow-hidden top-bar
                    ${topbarVisible ? " max-h-10 opacity-100" : " max-h-0 opacity-0"} `}
            >
                <AutoScrollSlider speed={30} gap={50}
                    className="container mx-auto flex items-center w-full overflow-x-hidden justify-between px-4 h-7 text-sm"
                >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <FaTruck className="text-primary shrink-0" />
                        <span className="font-medium">Free, discreet shipping Australia-wide on orders over $99</span>
                    </div>
                    <a href="tel:1300243253" className="flex whitespace-nowrap items-center gap-1.5 hover:text-primary transition-colors">
                        <IoCall />
                        <span className="font-semibold">1300 243 253</span>
                    </a>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <MdVerified className="text-primary" />
                        <span>Registered NDIS provider</span>
                    </div>
                </AutoScrollSlider>

            </div>

            {/* Main navbar */}
            <div className="bg-primary-hover/90 w-full backdrop-blur-2xl shadow-xl">
                <div className="max-w-[1240px] mx-auto w-full flex items-center gap-7 px-4 sm:px-7 h-19">

                    {/* Logo */}
                    <Link href="/" className="shrink-0 flex items-center">
                        <Image
                            src={logo}
                            alt="Health U Shop"
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Nav links */}
                    <nav className="hidden lg:flex items-center gap-6 flex-1 min-w-0">
                        <div
                            ref={shopRef}
                            className="relative"
                            onMouseEnter={() => setShopOpen(true)}
                            onMouseLeave={() => setShopOpen(false)}
                        >
                            <button
                                onClick={() => setShopOpen(true)}
                                onFocus={() => setShopOpen(true)}
                                className="flex items-center gap-1.5 text-lg font-semibold text-secondary whitespace-nowrap"
                            >
                                Shop <FaChevronDown size={11} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {shopOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-10 left-0 w-140 max-w-[80vw] bg-white border border-primary-hover rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-x-8 gap-y-3 z-50"
                                    >
                                        {categories.length > 0 ? categories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/products?category=${cat.id}`}
                                                onClick={() => setShopOpen(false)}
                                                className="p-2 rounded-lg hover:bg-primary transition-colors"
                                            >
                                                <div className="font-secondary text-xl text-text-hover">{cat.title}</div>
                                            </Link>
                                        )) : (
                                            <Link
                                                href="/products"
                                                onClick={() => setShopOpen(false)}
                                                className="p-2 rounded-lg hover:bg-primary transition-colors col-span-2"
                                            >
                                                <div className="font-secondary text-xl text-text-hover">Browse all products</div>
                                            </Link>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-lg font-medium text-text hover:text-secondary transition-colors whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <button
                            onClick={() => setTrackOrderOpen(true)}
                            className="flex items-center gap-1.5 text-lg font-medium text-secondary underline decoration-[1.5px] underline-offset-4 whitespace-nowrap"
                        >
                            <FaTruck size={15} /> Track order
                        </button>
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                            className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-text transition-colors"
                        >
                            <FaBars size={20} />
                        </button>

                        <Search />

                        {/* Account */}
                        {user.status === 'succeeded' && user.user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text hover:bg-primary rounded-md transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {showUserMenu ? <GoTriangleUp size={14} /> : <GoTriangleDown size={14} />}
                                </button>
                                {showUserMenu && (
                                    <div className="absolute top-11 right-0 bg-background  shadow-lg w-44 rounded-lg border border-primary z-50">
                                        <UserMenu close={() => setShowUserMenu(false)} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/signin')}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                        )}

                        {/* Cart */}
                        <button
                            onClick={() => setOpenCartMenu(true)}
                            className="relative flex items-center gap-2 bg-secondary cursor-pointer hover:bg-secondary-hover  text-background px-3 py-2 rounded-lg transition-colors"
                        >
                            <span className={`relative flex ${cartPulsing ? 'cart-pulse' : ''}`}>
                                <BsCart4 size={20} />
                            </span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                            <span className="hidden sm:inline text-sm font-medium">
                                {cart?.items?.[0] ? DisplayPriceInAud(subtotal) : 'My Cart'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile nav drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 z-60 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                            className="fixed top-0 left-0 h-full w-[82%] max-w-xs bg-background z-70 p-6 flex flex-col gap-1 overflow-y-auto lg:hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-semibold text-text-hover">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Close menu"
                                    className="p-2 rounded-full hover:bg-gray-100 text-text-hover"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>
                            <Link
                                href="/products"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-2 py-3 text-lg font-semibold text-secondary border-b border-primary-hover"
                            >
                                Shop
                            </Link>
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-2 py-3 text-lg font-medium text-text-hover border-b border-primary-hover"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false)
                                    setTrackOrderOpen(true)
                                }}
                                className="flex items-center gap-2 px-2 py-3 text-lg font-medium text-text-hover border-b border-primary-hover text-left"
                            >
                                <FaTruck size={16} /> Track order
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {openCartMenu && <CartMenu close={() => setOpenCartMenu(false)} />}
            </AnimatePresence>
            {trackOrderOpen && <TrackOrderModal onClose={() => setTrackOrderOpen(false)} />}
        </div>
    )
}

export default Header
