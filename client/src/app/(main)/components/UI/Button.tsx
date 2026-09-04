import Link from 'next/link'
import React from 'react'

const Button = ({path="/",label="",className=""}:{path:string, label:string, className?:any}) => {
  return (
    <Link
        href={path}
        className={`${className} flex items-center font-primary uppercase shadow-xl hover:shadow-2xl  gap-3 bg-secondary hover:bg-secondary-hover text-background font-semibold px-6 py-3 rounded-full hover:scale-105 transition-all duration-300  text-sm`}
        >{label} →</Link>
  )
}

export default Button