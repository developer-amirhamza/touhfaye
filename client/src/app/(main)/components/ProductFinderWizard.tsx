"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud'
import { getDisplayPrice } from '@/utils/PriceWithDiscount'

const STEPS = [
    { id: 'shopper', question: 'Who are you shopping for?', options: ['NDIS Participant', 'Carer / Family', 'Healthcare Provider'] },
    { id: 'severity', question: 'What is the level of need?', options: ['Light Incontinence', 'Moderate Incontinence', 'Heavy Incontinence', 'Severe Incontinence'] },
    { id: 'type', question: 'What product type?', options: ['Pads', 'Pull-up Pants', 'Liners', 'Underpads'] },
    { id: 'size', question: 'What size do you need?', options: ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large'] },
]

const TYPE_KEYWORDS: Record<string, string[]> = {
    'Pads': ['pad', 'pads'],
    'Pull-up Pants': ['pull-up', 'pullup', 'pants', 'underwear'],
    'Liners': ['liner', 'liners'],
    'Underpads': ['underpad', 'bed pad', 'underpads'],
}

const SEVERITY_KEYWORDS: Record<string, string[]> = {
    'Light Incontinence': ['light', 'mini', 'liner'],
    'Moderate Incontinence': ['moderate', 'normal', 'medium', 'regular'],
    'Heavy Incontinence': ['heavy', 'maxi', 'plus'],
    'Severe Incontinence': ['severe', 'extra', 'super', 'overnight', 'maximum'],
}

interface Product {
    id: string; title: string; images: string[]; price: number; discount: number; sizes: string[];
    category?: { title: string }
}
interface Answers { shopper: string; severity: string; type: string; size: string }

const ProductFinderWizard = () => {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Partial<Answers>>({})
    const [results, setResults] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const totalSteps = STEPS.length
    const currentStep = STEPS[step - 1]

    const handleSelect = async (option: string) => {
        const key = currentStep.id as keyof Answers
        const updated = { ...answers, [key]: option }
        setAnswers(updated)
        if (step < totalSteps) { setStep(step + 1) } else { await fetchResults(updated as Answers) }
    }

    const fetchResults = async (ans: Answers) => {
        setLoading(true); setDone(true)
        try {
            const res = await Axios({ ...SummeryApi.fetchProducts })
            const allProducts: Product[] = res.data?.data ?? res.data ?? []
            const typeKw = TYPE_KEYWORDS[ans.type] ?? []
            const sevKw = SEVERITY_KEYWORDS[ans.severity] ?? []
            const sizeKw = ans.size.toLowerCase()
            const scored = allProducts
                .map((p) => { const t = p.title.toLowerCase(); let score = 0; if (typeKw.some(k => t.includes(k))) score += 3; if (sevKw.some(k => t.includes(k))) score += 2; if (p.sizes?.some(s => s.toLowerCase().includes(sizeKw))) score += 2; return { ...p, score } })
                .filter(p => (p as any).score > 0).sort((a, b) => (b as any).score - (a as any).score).slice(0, 6)
            setResults(scored.length > 0 ? scored : allProducts.slice(0, 6))
        } catch { setResults([]) } finally { setLoading(false) }
    }

    const reset = () => { setStep(0); setAnswers({}); setResults([]); setDone(false); setLoading(false) }

    if (step === 0) return (
        <section className="bg-background py-6">
            <div className="container mx-auto px-6 flex flex-col items-center text-center gap-4">
                {/* <div className="w-12 h-12 bg-[#1a56db] rounded-xl flex items-center justify-center text-white font-extrabold text-lg">PF</div> */}
                <h2 className="text-5xl font-secondary font-semibold text-gray-900">Find Your Perfect Product</h2>
                <p className="text-gray-500 text-base max-w-md">Answer 4 quick questions and we'll match you with the right continence products.</p>
                <button onClick={() => setStep(1)} className="flex items-center font-primary  shadow-xl hover:shadow-2xl  gap-3 bg-secondary hover:bg-secondary-hover text-background font-semibold px-6 py-3 rounded-full hover:scale-105 transition-all duration-300  text-sm">Start the quiz →</button>
            </div>
        </section>
    )

    if (done) return (
        <section className="bg-[#f0f7ff] py-14">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center gap-3 mb-10">
                    <h2 className="text-3xl font-extrabold text-gray-900">Your Recommended Products</h2>
                    <p className="text-gray-500 text-sm">Based on your answers — {answers.type}, {answers.severity}, Size {answers.size}</p>
                    <button onClick={reset} className="text-sm text-[#1a56db] underline mt-1">Start over</button>
                </div>
                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#1a56db] border-t-transparent rounded-full animate-spin" /></div>
                ) : results.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No products found. <Link href="/products" className="text-[#1a56db] underline">Browse all products</Link></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="h-48 overflow-hidden bg-gray-50">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-[#1a56db] transition-colors">{product.title}</h3>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-[#1a56db] font-bold text-base">{DisplayPriceInAud(getDisplayPrice(product))}</span>
                                        <span className="text-xs bg-blue-50 text-[#1a56db] px-2.5 py-1 rounded-full font-semibold">View →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                <div className="flex justify-center mt-8">
                    <Link href="/products" className="border border-[#1a56db] text-[#1a56db] hover:bg-blue-50 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors">Browse all products</Link>
                </div>
            </div>
        </section>
    )

    return (
        <section className="bg-[#f0f7ff] py-14">
            <div className="container mx-auto px-6 flex flex-col items-center">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8">
                    <div className="flex gap-2 mb-2">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-[#1a56db]' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center mb-6">Step {step} of {totalSteps}</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-5">{currentStep.question}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {currentStep.options.map((option) => (
                            <button key={option} onClick={() => handleSelect(option)}
                                className="border border-gray-200 hover:border-[#1a56db] hover:bg-blue-50 text-gray-800 font-semibold text-sm py-3 px-4 rounded-xl transition-colors text-left">
                                {option}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-center gap-3 mt-6">
                        {step > 1 && <button onClick={() => setStep(step - 1)} className="border border-gray-200 text-gray-600 hover:border-gray-400 font-semibold text-sm px-5 py-2 rounded-lg transition-colors">Back</button>}
                        {step > 1 && <button onClick={reset} className="border border-gray-200 text-gray-600 hover:border-gray-400 font-semibold text-sm px-5 py-2 rounded-lg transition-colors">Start Over</button>}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ProductFinderWizard