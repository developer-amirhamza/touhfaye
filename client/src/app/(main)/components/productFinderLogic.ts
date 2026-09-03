// Shared matching/pricing logic for the "Find Product & Cost" experience —
// used by both the homepage ProductFinderCalculator section and the
// Product & Cost flow inside the Chatbot, so the two never drift apart.

export interface FinderProduct {
    id: string
    title: string
    images: string[]
    price: number
    discount: number
    pack?: string | null
    absorbency?: string | null
}

export const FINDER_QUESTIONS = [
    { id: 'shopper', title: 'Who are you shopping for?', options: ['Myself', 'Someone I care for', 'An NDIS participant'] },
    { id: 'type', title: 'What type of protection?', options: ['Pads or liners', 'Pull up pants', 'Bed protection', 'Not sure yet'] },
    { id: 'absorbency', title: 'How much absorbency?', options: ['Light', 'Moderate', 'Heavy or overnight'] },
    { id: 'pack', title: 'Preferred pack?', options: ['A single pack', 'A monthly bundle', 'Show me everything'] },
] as const

export const TYPE_KEYWORDS: Record<string, string[]> = {
    'Pads or liners': ['pad', 'liner'],
    'Pull up pants': ['pull-up', 'pullup', 'pants'],
    'Bed protection': ['bed', 'underpad', 'protector', 'bluey', 'mat'],
}
export const ABSORBENCY_KEYWORDS: Record<string, string[]> = {
    'Light': ['light', 'mini'],
    'Moderate': ['moderate', 'regular', 'medium'],
    'Heavy or overnight': ['heavy', 'overnight', 'maxi', 'super', 'extra'],
}

export const CALC_KEYWORDS: { label: string; keywords: string[] }[] = [
    { label: 'Pull up pants', keywords: ['pull-up', 'pullup', 'pants'] },
    { label: 'Pads', keywords: ['pad', 'liner'] },
    { label: 'Bed protection', keywords: ['bed', 'underpad', 'protector', 'bluey', 'mat'] },
]

export const CHANGE_OPTS = [
    { label: '1 to 2', n: 1.5 },
    { label: '3 to 4', n: 3.5 },
    { label: '5 or more', n: 5.5 },
]

export const packQty = (pack?: string | null) => {
    const m = (pack ?? '').match(/(\d+)/)
    return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

// Score every product against the finder answers and return the best matches
// (falls back to the first few products if nothing scores).
export function matchFinderProducts<T extends FinderProduct>(
    allProducts: T[],
    answers: Record<string, string>
): T[] {
    const typeKw = TYPE_KEYWORDS[answers.type] ?? []
    const absKw = ABSORBENCY_KEYWORDS[answers.absorbency] ?? []
    const wantsBundle = answers.pack === 'A monthly bundle'
    const wantsSingle = answers.pack === 'A single pack'
    const scored = allProducts
        .map((p) => {
            const title = p.title.toLowerCase()
            const abs = (p.absorbency ?? '').toLowerCase()
            let score = 0
            if (typeKw.some((k) => title.includes(k))) score += 3
            if (absKw.some((k) => abs.includes(k) || title.includes(k))) score += 2
            if (wantsBundle && /bundle|pack of (?:[2-9]\d|1\d\d)/i.test(p.pack ?? '')) score += 1
            if (wantsSingle && !/bundle/i.test(p.pack ?? '')) score += 1
            return { p, score }
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.p)
        .slice(0, 3)
    return scored.length > 0 ? scored : allProducts.slice(0, 3)
}

// Pick up to 3 representative products for the cost calculator's tiles —
// one per known category where possible, then filled with whatever's left.
export function pickCalcTiles<T extends FinderProduct>(allProducts: T[]): T[] {
    const tiles: T[] = []
    for (const { keywords } of CALC_KEYWORDS) {
        const match = allProducts.find((p) => !tiles.includes(p) && keywords.some((k) => p.title.toLowerCase().includes(k)))
        if (match) tiles.push(match)
    }
    for (const p of allProducts) {
        if (tiles.length >= 3) break
        if (!tiles.includes(p)) tiles.push(p)
    }
    return tiles
}

export interface CostEstimate {
    unit: number
    weekly: number
    monthly: number
    yearly: number
    packsAMonth: number
}

export function calcCost(product: FinderProduct, changeIndex: number, discountedPrice: number): CostEstimate {
    const qty = packQty(product.pack)
    const unit = discountedPrice / qty
    const opt = CHANGE_OPTS[changeIndex] ?? CHANGE_OPTS[1]
    const weekly = unit * opt.n * 7
    const monthly = (weekly * 52) / 12
    const yearly = weekly * 52
    const packsAMonth = Math.ceil((opt.n * 31) / qty)
    return { unit, weekly, monthly, yearly, packsAMonth }
}
