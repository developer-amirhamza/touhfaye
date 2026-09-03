"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RiChat3Fill, RiCloseFill, RiSendPlaneFill } from "react-icons/ri";
import { BsChevronDown } from "react-icons/bs";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import { DisplayPriceInAud } from "@/utils/DisplayPriceInAud";
import { getDisplayPrice } from "@/utils/PriceWithDiscount";
import { validURLConvert } from "@/utils/validURLConvart";
import { RootState } from "@/redux/store";
import { normaliseRole, portalPath, ROLES } from "@/utils/roles";
import {
    CHANGE_OPTS,
    FINDER_QUESTIONS,
    FinderProduct,
    calcCost,
    matchFinderProducts,
    pickCalcTiles,
} from "./productFinderLogic";

type Sender = "bot" | "user";

interface ResultProduct {
    id: string;
    title: string;
    price: number;
    images: string[];
}

const toResultProduct = (p: FinderProduct): ResultProduct => ({
    id: p.id,
    title: p.title,
    price: getDisplayPrice(p),
    images: p.images,
});

// Quick replies are either a direct nav link (routes straight to a page),
// a named action handled in handleQuickReply, or an onClick — used for the
// dynamically generated steps of the Product & Cost assistant flow below.
interface QuickReply {
    label: string;
    description?: string;
    icon?: string;
    action?: string;
    href?: string;
    onClick?: () => void;
}

interface Message {
    id: number;
    sender: Sender;
    text?: string;
    quickReplies?: QuickReply[];
    // "card" = the mode-picker's big icon+description tiles, "pill" = the
    // assistant's rounded-full option buttons — both match the Product &
    // Cost Assistant design. Undefined keeps the bot's existing nav style.
    replyStyle?: "card" | "pill";
    products?: ResultProduct[];
}

const ACTION_REPLIES: QuickReply[] = [
    { label: "Find Product & Cost", action: "product-cost" },
    { label: "Shipping info", action: "shipping-info" },
    { label: "Talk to a human", action: "talk-human" },
];

let idSeq = 1;

const Chatbot = () => {
    const [open, setOpen] = useState(false);
    const [minimised, setMinimised] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [searching, setSearching] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Set once the visitor enters the Product & Cost assistant flow — swaps
    // the header/footer to match that design's dedicated widget instead of
    // the general "Chat with Bestiee" chrome.
    const [assistantSubtitle, setAssistantSubtitle] = useState<string | null>(null);

    // Loaded once the chat opens, and read via the ref (not the state
    // closure) from the Product & Cost assistant's flow functions below, so
    // they always see the latest products even though they're defined once.
    const [allProducts, setAllProducts] = useState<FinderProduct[]>([]);
    const allProductsRef = useRef<FinderProduct[]>([]);
    useEffect(() => {
        allProductsRef.current = allProducts;
    }, [allProducts]);

    useEffect(() => {
        if (open && allProductsRef.current.length === 0) {
            Axios({ ...SummeryApi.fetchProducts })
                .then((res) => setAllProducts(res.data?.data ?? res.data ?? []))
                .catch(() => { });
        }
    }, [open]);

    const user = useSelector((state: RootState) => state.userSlice?.user);
    const isLoggedIn = !!user;
    const role = normaliseRole(user?.role);

    // Nav quick replies are computed from login state / role so the bot only
    // offers links the visitor can actually use.
    const navReplies: QuickReply[] = [
        ...(isLoggedIn ? [{ label: "Track my order", href: "/order/my-orders" }] : []),
        { label: "Fit Finder", href: "/size-guide" },
        ...(isLoggedIn
            ? [{ label: "My Portal", href: portalPath(role) }]
            : [{ label: "User Portal", href: "/signin" }]),
        ...(isLoggedIn && role === ROLES.NDIS_COORDINATOR
            ? [{ label: "Get a Quote", href: "/portal/ndis" }]
            : [{ label: "Get a Quote", href: "/apply/ndis" }]),
    ];

    const QUICK_REPLIES: QuickReply[] = [...navReplies, ...ACTION_REPLIES];

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    id: idSeq++,
                    sender: "bot",
                    text: "Hi, I am Bestiee. I can find the right product for you, or work out what it will cost. Which would you like?",
                },
                // {
                //     id: idSeq++,
                //     sender: "bot",
                //     text: "I can help you find products, check stock, or point you to your orders.",
                // },
                {
                    id: idSeq++,
                    sender: "bot",
                    // text: "How can I help you?",
                    quickReplies: QUICK_REPLIES,
                },
            ]);
        }
    }, [open, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const pushBot = (msg: Omit<Message, "id" | "sender">) => {
        setMessages((prev) => [...prev, { id: idSeq++, sender: "bot", ...msg }]);
    };

    const pushUser = (text: string) => {
        setMessages((prev) => [...prev, { id: idSeq++, sender: "user", text }]);
    };

    const runProductSearch = async (query: string) => {
        pushUser(query);
        setSearching(true);
        try {
            const response = await Axios({
                ...SummeryApi.searchProduct,
                params: { q: query, page: 1, limit: 5 },
            });
            const products: ResultProduct[] = response.data?.data || [];
            if (products.length === 0) {
                pushBot({
                    text: `I couldn't find anything for "${query}". Try a different keyword, or browse our shop.`,
                    quickReplies: QUICK_REPLIES,
                });
            } else {
                pushBot({ text: `Here's what I found for "${query}":`, products });
                pushBot({ text: "Need anything else?", quickReplies: QUICK_REPLIES });
            }
        } catch {
            pushBot({
                text: "Sorry, I couldn't reach the shop right now — please try again shortly.",
                quickReplies: QUICK_REPLIES,
            });
        } finally {
            setSearching(false);
        }
    };

    // Product & Cost assistant: a guided alternative to free-text search,
    // reusing the same matching/pricing logic as the homepage Product
    // Finder & Cost Calculator section so the two never give different
    // answers to the same questions.
    const showModePicker = (text: string) => {
        setAssistantSubtitle("Pick a tool");
        pushBot({
            text,
            replyStyle: "card",
            quickReplies: [
                {
                    label: "Find the right product",
                    icon: "🧭",
                    description: "Four questions. Size, product and packs a month.",
                    onClick: startFinder,
                },
                {
                    label: "Work out my cost",
                    icon: "🧮",
                    description: "Two questions. Weekly, monthly and yearly.",
                    onClick: startCalc,
                },
            ],
        });
    };

    const startFinder = () => askFinderStep(0, {});

    const askFinderStep = (step: number, answers: Record<string, string>) => {
        setAssistantSubtitle(`Product finder · ${step + 1} of ${FINDER_QUESTIONS.length}`);
        const q = FINDER_QUESTIONS[step];
        pushBot({
            text: q.title,
            replyStyle: "pill",
            quickReplies: q.options.map((option) => ({
                label: option,
                onClick: () => {
                    const updated = { ...answers, [q.id]: option };
                    const next = step + 1;
                    if (next < FINDER_QUESTIONS.length) {
                        askFinderStep(next, updated);
                    } else {
                        showFinderResult(updated);
                    }
                },
            })),
        });
    };

    const showFinderResult = (answers: Record<string, string>) => {
        setAssistantSubtitle("Your recommendation");
        const results = matchFinderProducts(allProductsRef.current, answers);
        pushBot({
            text: results.length > 0
                ? "Based on your answers, here's what we'd suggest:"
                : "I couldn't find a close match — here's our range instead.",
            products: results.map(toResultProduct),
        });
        pushBot({
            text: "Want to see what that would cost you? Most of our range is also NDIS, Support at Home and CAPS claimable.",
            replyStyle: "pill",
            quickReplies: [
                { label: "Work out my cost", onClick: startCalc },
                { label: "Start over", onClick: restartAssistant },
            ],
        });
    };

    const startCalc = () => {
        const tiles = pickCalcTiles(allProductsRef.current);
        if (tiles.length === 0) {
            pushBot({ text: "We don't have any products loaded to cost right now — please try again shortly." });
            return;
        }
        setAssistantSubtitle("Cost calculator · 1 of 2");
        pushBot({
            text: "Which product are you costing?",
            replyStyle: "pill",
            quickReplies: tiles.map((p) => ({
                label: p.title,
                onClick: () => askChanges(p),
            })),
        });
    };

    const askChanges = (product: FinderProduct) => {
        setAssistantSubtitle("Cost calculator · 2 of 2");
        pushBot({
            text: `How many changes a day, for ${product.title}?`,
            replyStyle: "pill",
            quickReplies: CHANGE_OPTS.map((o, i) => ({
                label: o.label,
                onClick: () => showCalcResult(product, i),
            })),
        });
    };

    const showCalcResult = (product: FinderProduct, changeIndex: number) => {
        setAssistantSubtitle("Your estimated cost");
        const { unit, weekly, monthly, yearly, packsAMonth } = calcCost(
            product,
            changeIndex,
            getDisplayPrice(product)
        );
        pushBot({
            text:
                `${DisplayPriceInAud(unit)} each, about ${packsAMonth} pack${packsAMonth === 1 ? "" : "s"} a month.\n\n` +
                `Estimated cost — Weekly: ${DisplayPriceInAud(weekly)} · Monthly: ${DisplayPriceInAud(monthly)} · Yearly: ${DisplayPriceInAud(yearly)}.\n\n` +
                `This is an estimate, not a quote. CAPS can pay up to $739.40 a year toward continence products — we can help you check eligibility.`,
            products: [toResultProduct(product)],
        });
        pushBot({
            text: "Anything else?",
            replyStyle: "pill",
            quickReplies: [
                { label: "Find the right product", onClick: startFinder },
                { label: "Get an exact quote", href: "/apply/ndis" },
                { label: "Start over", onClick: restartAssistant },
            ],
        });
    };

    const restartAssistant = () => {
        showModePicker("Sure — would you like to find the right product, or work out the cost?");
    };

    const handleQuickReply = (reply: QuickReply) => {
        pushUser(reply.label);
        if (reply.onClick) {
            reply.onClick();
            return;
        }
        if (reply.action === "product-cost") {
            showModePicker("I can find the right product for you, or work out what it will cost. Which would you like?");
            return;
        }
        if (reply.action === "shipping-info") {
            pushBot({
                text: "We offer free, discreet shipping Australia-wide on orders over $99. Standard delivery is 2-5 business days.",
                quickReplies: QUICK_REPLIES,
            });
            return;
        }
        if (reply.action === "talk-human") {
            pushBot({
                text: "No problem — you can reach our team via the Contact page, or call 0481 707 758 / 0431 377 132.",
                quickReplies: QUICK_REPLIES,
            });
            return;
        }
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput("");
        runProductSearch(text);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                aria-label="Chat with Bestiee"
                className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-secondary-hover text-white shadow-lg hover:bg-secondary transition-colors"
            >
                <RiChat3Fill size={26} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between bg-secondary text-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/18 flex items-center justify-center text-xl shrink-0">
                        {assistantSubtitle ? "✦" : <RiChat3Fill size={16} />}
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-[19px] block leading-tight">
                            {assistantSubtitle ? "Product & Cost Assistant" : "Chat with Bestiee"}
                        </span>
                        {assistantSubtitle && <span className="block text-sm text-white/80 leading-tight">{assistantSubtitle}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setMinimised((m) => !m)}
                        aria-label="Minimise"
                        className="hover:bg-white/10 rounded p-1 transition-colors"
                    >
                        <BsChevronDown size={16} className={`transition-transform ${minimised ? "rotate-180" : ""}`} />
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                        className="hover:bg-white/10 rounded p-1 transition-colors"
                    >
                        <RiCloseFill size={18} />
                    </button>
                </div>
            </div>

            {!minimised && (
                <>
                    {/* Messages */}
                    <div className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3 bg-[#f5f7fb]">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[85%] flex flex-col gap-2">
                                    {m.text && (
                                        <div
                                            className={`rounded-2xl px-3.5 py-2 text-sm leading-snug whitespace-pre-line ${m.sender === "bot"
                                                    ? "bg-primary-hover text-text rounded-bl-sm"
                                                    : "bg-white border border-gray-200 text-gray-800 rounded-br-sm"
                                                }`}
                                        >
                                            {m.text}
                                        </div>
                                    )}

                                    {m.products && (
                                        <div className="flex flex-col gap-2">
                                            {m.products.map((p) => (
                                                <Link
                                                    key={p.id}
                                                    href={`/product/${validURLConvert(p.title)}_${p.id}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 hover:border-primary-hover transition-colors"
                                                >
                                                    {p.images?.[0] && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={p.images[0]}
                                                            alt={p.title}
                                                            className="w-10 h-10 object-contain rounded shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
                                                        <p className="text-xs text-secondary font-semibold">{DisplayPriceInAud(p.price)}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {m.quickReplies && m.replyStyle === "card" && (
                                        <div className="flex flex-col gap-2.5">
                                            {m.quickReplies.map((r) => (
                                                <button
                                                    key={r.label}
                                                    onClick={() => handleQuickReply(r)}
                                                    className="text-left bg-white border-[1.6px] border-secondary rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary-light/50 transition-colors"
                                                >
                                                    <span className="shrink-0 w-10 h-10 rounded-[11px] bg-secondary-light flex items-center justify-center text-xl">
                                                        {r.icon}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block text-base font-bold text-secondary">{r.label}</span>
                                                        <span className="block text-sm text-gray-600 leading-snug">{r.description}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {m.quickReplies && m.replyStyle === "pill" && (
                                        <div className="flex flex-wrap gap-2">
                                            {m.quickReplies.map((r) =>
                                                r.href ? (
                                                    <Link
                                                        key={r.label}
                                                        href={r.href}
                                                        onClick={() => setOpen(false)}
                                                        className="border-[1.6px] border-secondary text-secondary font-semibold rounded-full px-4.5 py-2 text-sm hover:bg-secondary-light/50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </Link>
                                                ) : (
                                                    <button
                                                        key={r.label}
                                                        onClick={() => handleQuickReply(r)}
                                                        className="border-[1.6px] border-secondary text-secondary font-semibold rounded-full px-4.5 py-2 text-sm hover:bg-secondary-light/50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {m.quickReplies && !m.replyStyle && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {m.quickReplies.map((r) =>
                                                r.href ? (
                                                    <Link
                                                        key={r.label}
                                                        href={r.href}
                                                        onClick={() => setOpen(false)}
                                                        className="text-center border border-secondary text-secondary text-xs font-medium rounded-md px-2 py-2 hover:bg-blue-50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </Link>
                                                ) : (
                                                    <button
                                                        key={r.label}
                                                        onClick={() => handleQuickReply(r)}
                                                        className="border border-secondary text-secondary text-xs font-medium rounded-md px-2 py-2 hover:bg-blue-50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searching && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl px-3.5 py-2 text-sm bg-primary-hover text-white rounded-bl-sm">
                                    Searching…
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Product & Cost assistant is fully button-driven, matching the
                        design — a disclaimer footer replaces the text input while it's
                        active, since there's nothing to type. */}
                    {assistantSubtitle ? (
                        <div className="border-t border-gray-200 bg-white px-4 py-2.5 text-[11px] text-gray-500 text-center leading-snug">
                            Comfort and fit guidance only. Not medical advice.
                            <br />
                            For health concerns speak with your GP or the National Continence Helpline 1800 33 00 66.
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="How can I help you?"
                                className="flex-1 text-sm outline-none px-2 py-2 bg-transparent text-gray-700 placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                aria-label="Send"
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-white hover:bg-secondary transition-colors shrink-0"
                            >
                                <RiSendPlaneFill size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Chatbot;
