"use client"
import Image from 'next/image'
import React, { useEffect, useState, useRef } from 'react'
import { FaBars, FaTimes, FaChevronDown, FaTruck, FaRegUser, FaSearch } from 'react-icons/fa'
import logo from "@/assets/touhfaye-logo.png"
import { BsCart4 } from 'react-icons/bs'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { fetchCart } from '@/redux/slices/cartSlice'
import { fetchUser } from '@/redux/slices/userSlices'
import { fetchCategories } from '@/redux/slices/categorySlice'
import { hydrateFavorites, loadFavoritesFromStorage } from '@/redux/slices/favoriteSlice'
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt'
import CartMenu from './CartMenu'
import FavoritesDrawer from './FavoritesDrawer'
import Search from './Search'
import TrackOrderModal from './TrackOrderModal'
import Link from 'next/link'
import UserMenu from './UI/UserMenu';
import { motion, AnimatePresence } from 'framer-motion';

// Plain (non-dropdown) nav links — "Shop" is rendered separately as the
// category mega-menu, matching the design mock's HOME / SHOP / STORIES /
// CONTACT US row (FAQ kept alongside — a real page the mock doesn't show).
const NAV_LINKS = [
    { label: 'Stories', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact us', href: '/contact-us' },
]

const Header = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { cart, status } = useSelector((state: RootState) => state.cartSlice)
    const user = useSelector((state: RootState) => state.userSlice)
    const { categories } = useSelector((state: RootState) => state.categorySlice)
    const { items: favoriteItems, hydrated: favoritesHydrated } = useSelector((state: RootState) => state.favoriteSlice)
    const router = useRouter()

    const [openCartMenu, setOpenCartMenu] = useState(false)
    const [openFavorites, setOpenFavorites] = useState(false)
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
        if (!favoritesHydrated) dispatch(hydrateFavorites(loadFavoritesFromStorage()))
    }, [favoritesHydrated, dispatch])

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
        <div className="sticky top-0 z-50">

            {/* Top bar — a single static tracked line, matching the design mock */}
            <div
                className={`bg-secondary text-secondary-light text-center overflow-hidden transition-all duration-300
                    ${topbarVisible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="px-4 py-2.5 text-[11.5px] tracking-[.16em] whitespace-nowrap overflow-x-auto no-scrollbar">
                    FREE DELIVERY INSIDE DHAKA ON ORDERS OVER ৳1500 · CASH ON DELIVERY · bKash · Nagad
                </div>
            </div>

            {/* Main navbar */}
            <div className="bg-background/95 w-full backdrop-blur-md border-b border-primary-hover">
                <div className="max-w-[1240px] mx-auto w-full grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-8 px-4 sm:px-7 py-3">

                    {/* Left — mobile menu toggle + nav links */}
                    <div className="flex items-center gap-1 justify-self-start">
                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                            className="lg:hidden p-2 -ml-2 hover:text-secondary transition-colors text-paragraph"
                        >
                            <FaBars size={19} />
                        </button>

                    <nav className="hidden lg:flex items-center gap-6 text-[12px] tracking-[.13em]">
                        <Link href="/" className="text-title whitespace-nowrap">HOME</Link>
                        <div
                            ref={shopRef}
                            className="relative"
                            onMouseEnter={() => setShopOpen(true)}
                            onMouseLeave={() => setShopOpen(false)}
                        >
                            <button
                                onClick={() => setShopOpen(true)}
                                onFocus={() => setShopOpen(true)}
                                className="flex items-center gap-1.5 text-foreground hover:text-title transition-colors whitespace-nowrap"
                            >
                                SHOP <FaChevronDown size={9} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {shopOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 pt-4.5 z-50"
                                    >
                                        <div className="bg-background border border-primary-hover shadow-[0_18px_40px_rgba(18,40,28,.14)] w-130 max-w-[80vw] p-5 grid grid-cols-2 gap-x-8 gap-y-1">
                                            {categories.length > 0 ? categories.map((cat) => (
                                                <Link
                                                    key={cat.id}
                                                    href={`/products?category=${cat.id}`}
                                                    onClick={() => setShopOpen(false)}
                                                    className="p-2.5 hover:bg-primary transition-colors"
                                                >
                                                    <div className="font-secondary text-lg text-title tracking-normal normal-case">{cat.title}</div>
                                                </Link>
                                            )) : (
                                                <Link
                                                    href="/products"
                                                    onClick={() => setShopOpen(false)}
                                                    className="p-2.5 hover:bg-primary transition-colors col-span-2"
                                                >
                                                    <div className="font-secondary text-lg text-title tracking-normal normal-case">Browse all products</div>
                                                </Link>
                                            )}
                                            <div
                                                onClick={() => setShopOpen(false)}
                                                className="col-span-2 border-t border-primary-hover mt-1.5 pt-3.5 flex justify-between items-center cursor-pointer text-title"
                                            >
                                                <Link href="/products" className="tracking-[.13em]">SHOP ALL PRODUCTS</Link>
                                                <span>→</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-foreground hover:text-title transition-colors whitespace-nowrap"
                            >
                                {link.label.toUpperCase()}
                            </Link>
                        ))}
                    </nav>
                    </div>

                    {/* Center — logo */}
                    <Link href="/" className="shrink-0 flex items-center justify-self-center">
                        <Image
                            src={logo}
                            alt="Touhfaye"
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Right — icon actions */}
                    <div className="flex items-center gap-1 justify-self-end shrink-0 text-paragraph">
                        <button
                            onClick={() => setTrackOrderOpen(true)}
                            title="Track order"
                            aria-label="Track order"
                            className="hidden sm:flex p-2 hover:text-secondary transition-colors"
                        >
                            <FaTruck size={17} />
                        </button>

                        <Search />

                        <button
                            onClick={() => setOpenFavorites(true)}
                            title="Favourites"
                            aria-label="Favourites"
                            className="flex items-center gap-1 p-2 hover:text-secondary transition-colors"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                                <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
                            </svg>
                            {favoriteItems.length > 0 && (
                                <span className="text-[11px] text-accent">{favoriteItems.length}</span>
                            )}
                        </button>

                        {/* Account */}
                        {user.status === 'succeeded' && user.user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    aria-label="Account"
                                    className="flex items-center p-2 hover:text-secondary transition-colors"
                                >
                                    <FaRegUser size={17} />
                                </button>
                                {showUserMenu && (
                                    <div className="absolute top-11 right-0 bg-background shadow-[0_18px_40px_rgba(18,40,28,.14)] w-48 border border-primary-hover z-50">
                                        <UserMenu close={() => setShowUserMenu(false)} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/signin')}
                                aria-label="Sign in"
                                className="flex items-center p-2 hover:text-secondary transition-colors"
                            >
                                <FaRegUser size={17} />
                            </button>
                        )}

                        {/* Cart */}
                        <button
                            onClick={() => setOpenCartMenu(true)}
                            className="relative flex items-center gap-2 p-2 hover:text-secondary transition-colors"
                        >
                            <span className={`relative flex ${cartPulsing ? 'cart-pulse' : ''}`}>
                                <BsCart4 size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2.5 min-w-4.5 h-4.5 px-1 bg-secondary text-secondary-light text-[9.5px] font-medium flex items-center justify-center rounded-full border-[1.5px] border-background">
                                        {cartCount}
                                    </span>
                                )}
                            </span>
                            {cart?.items?.[0] && (
                                <span className="hidden sm:inline text-[11px] tracking-[.1em] text-title">
                                    {DisplayPriceInBdt(subtotal)}
                                </span>
                            )}
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
                            className="fixed inset-0 bg-[#12281C]/40 z-60 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                            className="fixed top-0 left-0 h-full w-[82%] max-w-xs bg-background z-70 p-6 flex flex-col gap-1 overflow-y-auto lg:hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-secondary text-lg text-title">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Close menu"
                                    className="p-2 text-title"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-2 py-3 text-[12px] tracking-[.13em] text-title border-b border-primary-hover"
                            >
                                HOME
                            </Link>
                            <Link
                                href="/products"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-2 py-3 text-[12px] tracking-[.13em] text-title border-b border-primary-hover"
                            >
                                SHOP
                            </Link>
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-2 py-3 text-[12px] tracking-[.13em] text-title border-b border-primary-hover"
                                >
                                    {link.label.toUpperCase()}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false)
                                    setTrackOrderOpen(true)
                                }}
                                className="flex items-center gap-2 px-2 py-3 text-[12px] tracking-[.13em] text-title border-b border-primary-hover text-left"
                            >
                                <FaTruck size={14} /> TRACK ORDER
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {openCartMenu && <CartMenu close={() => setOpenCartMenu(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {openFavorites && <FavoritesDrawer close={() => setOpenFavorites(false)} />}
            </AnimatePresence>
            {trackOrderOpen && <TrackOrderModal onClose={() => setTrackOrderOpen(false)} />}
        </div>
    )
}

export default Header
