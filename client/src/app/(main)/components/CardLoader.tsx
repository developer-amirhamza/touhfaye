import React from 'react'

const CardLoader = () => {
  return (
    <div className=' border border-background p-2 grid gap-3 max-w-78 rounded animate-pulse'>
        <div className="min-h-30 bg-background/80 rounded w-64"/>
        <div className="p-3 bg-background/80 rounded w-28"/>
        <div className="p-3 bg-background/80 rounded"/>
        <div className="p-3 bg-background/80 rounded w-14 "/>
        <div className="flex items-center justify-between gap-3">
        <div className="p-3 bg-background/80 rounded w-20  "/>
        <div className="p-3 bg-background/80 rounded w-20 "/>
        </div>
    </div>
  )
}

export default CardLoader