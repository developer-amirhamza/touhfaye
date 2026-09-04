"use client"
import React, { useEffect, useState } from 'react'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'
import AxiosToastError from '@/utils/AxiosToastError'

interface TrainingSession {
    id: string
    tag: string
    title: string
    description: string
    audience: string
    durationMin: number
    sessionType: string
    startsAt: string | null
    capacity: number | null
    spotsLeft: number | null
}





const when = (session: TrainingSession) => {
    if (session.sessionType === 'ON_DEMAND') return 'Watch any time'
    if (!session.startsAt) return ''
    return new Date(session.startsAt).toLocaleString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Australia/Sydney',
    }) + ' AEST'
}

const spotsLabel = (session: TrainingSession) => {
    if (session.capacity == null) return 'Open access'
    if ((session.spotsLeft ?? 0) <= 0) return 'Fully booked'
    return `${session.spotsLeft} spot${session.spotsLeft === 1 ? '' : 's'} left`
}

const RegisterModal = ({
    session,
    onClose,
    onRegistered,
}: {
    session: TrainingSession
    onClose: () => void
    onRegistered: () => void
}) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState<string | null>(null)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim()) return
        try {
            setLoading(true)
            const res = await Axios({ ...SummeryApi.registerTrainingSession, data: { sessionId: session.id, name, email } })
            if (res.data?.success) {
                setDone(res.data.message || "You're registered! Check your email for confirmation.")
                onRegistered()
            }
        } catch (err) {
            AxiosToastError(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/50 z-92" />
            <div className="fixed inset-0 md:inset-auto md:top-[10vh] md:left-1/2 md:-translate-x-1/2 w-full h-full md:w-120 md:h-auto md:max-w-[92vw] bg-background rounded-none md:rounded-2xl shadow-2xl z-93 overflow-y-auto md:overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-primary-hover">
                    <h3 className="font-secondary text-xl text-text-hover">Reserve your spot</h3>
                    <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-text hover:text-text-hover">×</button>
                </div>
                <div className="p-6">
                    {done ? (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 rounded-full bg-[#d8e8dc] text-secondary flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                            <p className="text-text-hover font-medium mb-1">{done}</p>
                            <button onClick={onClose} className="mt-4 bg-secondary text-background rounded-full px-6 py-2.5 font-semibold text-sm">
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <p className="text-text text-sm">
                                {session.title} · {when(session)} · {session.durationMin} min
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-text-hover mb-1.5">Full name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-hover mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-secondary hover:bg-secondary-hover text-background rounded-full py-3 font-semibold text-sm transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Reserving…' : 'Reserve my spot'}
                            </button>
                            <p className="text-xs text-text text-center">No cost, no sales pitch. Recording sent afterwards.</p>
                        </form>
                    )}
                </div>
            </div>
        </>
    )
}

const TrainingSessionsSection = () => {
    const [sessions, setSessions] = useState<TrainingSession[]>([])
    const [index, setIndex] = useState(0)
    const [activeSession, setActiveSession] = useState<TrainingSession | null>(null)

    const [VISIBLE, setVisible] = useState(3);



    const fetchSessions = () => {
        Axios({ ...SummeryApi.getTrainingSessions })
            .then((res) => {
                if (res.data?.success) setSessions(res.data.data)
            })
            .catch(() => {})
    }

    useEffect(() => {
        fetchSessions()
    }, [])
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth
            if (w < 768) setVisible(1)
            else if (w < 1024) setVisible(2)
            else setVisible(3)
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    useEffect(() => {
        const maxIdx = Math.max(0, sessions.length - VISIBLE)
        setIndex((i) => Math.min(i, maxIdx))
    }, [VISIBLE, sessions.length])

    if (sessions.length === 0) return null

    // On mobile a single card sits at 84% width so the next one peeks at
    // the edge; tablet/desktop split the row evenly across VISIBLE cards.
    const cardBasis = VISIBLE === 1 ? 84 : 100 / VISIBLE
    const maxIndex = Math.max(0, sessions.length - VISIBLE)
    const goPrev = () => setIndex((i) => Math.max(0, i - 1))
    const goNext = () => setIndex((i) => Math.min(maxIndex, i + 1))
    const visibleEnd = Math.min(index + VISIBLE, sessions.length)

    return (
        <section className="container mx-auto px-6 mb-20">
            <div className="bg-[#d8e8dc] rounded-3xl p-8 md:p-12">
                <div className="flex justify-between items-end flex-wrap gap-5 mb-6.5">
                    <div>
                        <span className="bg-white text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                            Always free
                        </span>
                        <h2 className="font-secondary text-4xl md:text-5xl text-text-hover leading-tight mt-3.5 mb-2">
                            Free training sessions
                        </h2>
                        <p className="text-lg text-secondary max-w-xl">
                            Run by continence nurses and our funding team. No cost, no sales pitch, recordings sent afterwards.
                        </p>
                    </div>
                    {sessions.length > VISIBLE && (
                        <div className="flex items-center gap-3">
                            <span className="text-secondary text-sm">
                                {index + 1}-{visibleEnd} of {sessions.length}
                            </span>
                            <button
                                onClick={goPrev}
                                disabled={index === 0}
                                aria-label="Previous sessions"
                                className="w-11 h-11 rounded-full border border-secondary/30 text-secondary flex items-center justify-center disabled:opacity-40 hover:bg-white/40 transition-colors"
                            >
                                ←
                            </button>
                            <button
                                onClick={goNext}
                                disabled={index === maxIndex}
                                aria-label="Next sessions"
                                className="w-11 h-11 rounded-full bg-secondary text-background flex items-center justify-center disabled:opacity-40 hover:bg-secondary-hover transition-colors"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-400 ease-out"
                        style={{ transform: `translateX(-${index * cardBasis}%)` }}
                    >
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="box-border pr-3"
                                style={{ flex: `0 0 ${cardBasis}%`, maxWidth: `${cardBasis}%` }}
                            >
                                <div className="bg-white rounded-2xl p-6.5 h-full flex flex-col">
                                    <span className="self-start bg-[#d8e8dc] text-secondary font-semibold rounded-full px-3.5 py-1.5 text-sm">
                                        {session.tag}
                                    </span>
                                    <h3 className="font-primary text-xl leading-tight text-text mt-3 mb-2">{session.title}</h3>
                                    <p className=" leading-snug flex-1">{session.description}</p>
                                    <div className="flex flex-col gap-1 text-sm text-text border-t border-primary-hover pt-3 mt-3.5">
                                        <span className="text-text-hover font-bold">{when(session)}</span>
                                        <span>{session.durationMin} min · {session.audience}</span>
                                        <span className="text-secondary font-semibold">{spotsLabel(session)}</span>
                                    </div>
                                    <button
                                        onClick={() => setActiveSession(session)}
                                        disabled={session.capacity != null && (session.spotsLeft ?? 0) <= 0}
                                        className="mt-4 bg-secondary-hover hover:bg-secondary text-background font-semibold rounded-full py-3 transition-colors disabled:opacity-50"
                                    >
                                        {session.capacity != null && (session.spotsLeft ?? 0) <= 0 ? 'Fully booked' : 'Reserve my spot'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {activeSession && (
                <RegisterModal session={activeSession} onClose={() => setActiveSession(null)} onRegistered={fetchSessions} />
            )}
        </section>
    )
}

export default TrainingSessionsSection
