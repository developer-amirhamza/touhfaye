"use client"
import React, { useEffect, useState } from 'react'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'

interface RedditPost {
    id: string
    subreddit: string
    title: string
    author: string
    flair: string
    upvotes: number
    comments: number
    url: string
    postedAt: string
}

const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `${Math.max(mins, 1)}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

const RedditFeedSection = () => {
    const [posts, setPosts] = useState<RedditPost[]>([])

    useEffect(() => {
        Axios({ ...SummeryApi.getRedditPosts })
            .then((res) => {
                if (res.data?.success) setPosts(res.data.data)
            })
            .catch(() => {})
    }, [])

    if (posts.length === 0) return null

    return (
        <section className="container mx-auto px-6 mb-20">
            <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
                <div>
                    <span className="bg-secondary-light text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                        From the community
                    </span>
                    <h2 className="font-secondary text-4xl md:text-5xl text-text-hover leading-tight mt-3.5 mb-2">
                        What people are actually asking
                    </h2>
                    <p className="text-lg text-text max-w-xl">
                        Real discussions from Reddit. Unfiltered, and often more useful than a brochure.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 border border-primary-hover rounded-full px-4.5 py-2.5 text-sm font-semibold text-text">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#45c26a]" />
                    Updated {timeAgo(posts[0].postedAt)} ago
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {posts.map((post) => (
                    <div key={post.id}>
                    {post.url ? <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-background border border-primary-hover rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow"
                    >
                        <span className="flex flex-col items-center gap-0.5 bg-secondary-light rounded-lg px-2.5 py-2 min-w-13 shrink-0">
                            <span className="text-secondary text-sm">▲</span>
                            <span className="text-secondary font-bold text-base">{post.upvotes}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-sm text-secondary">{post.subreddit}</span>
                                <span className="bg-[#ece2d2] text-text text-xs font-semibold rounded-full px-2.5 py-0.5">
                                    {post.flair}
                                </span>
                            </span>
                            <span className="block text-lg font-semibold leading-snug text-text-hover">
                                {post.title}
                            </span>
                            <span className="block text-sm text-text mt-1.5">
                                {post.author} · {timeAgo(post.postedAt)} ago · {post.comments} comments
                            </span>
                        </span>
                    </a> :
                    <div

                        className="bg-background border cursor-pointer border-primary-hover rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow"
                    >
                        <span className="flex flex-col items-center gap-0.5 bg-secondary-light rounded-lg px-2.5 py-2 min-w-13 shrink-0">
                            <span className="text-secondary text-sm">▲</span>
                            <span className="text-secondary font-bold text-base">{post.upvotes}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-sm text-secondary">{post.subreddit}</span>
                                <span className="bg-[#ece2d2] text-text text-xs font-semibold rounded-full px-2.5 py-0.5">
                                    {post.flair}
                                </span>
                            </span>
                            <span className="block text-lg font-semibold leading-snug text-text-hover">
                                {post.title}
                            </span>
                            <span className="block text-sm text-text mt-1.5">
                                {post.author} · {timeAgo(post.postedAt)} ago · {post.comments} comments
                            </span>
                        </span>
                    </div>
                    }
                    </div>


                ))}
            </div>
        </section>
    )
}

export default RedditFeedSection
