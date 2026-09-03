import Link from 'next/link';
import Image from 'next/image';
import React from 'react'

interface Type {
    label: string
    subtitle?: string
    icon: any
    path: any
}

const InfoGraphicCard: React.FC<Type> = ({ label, subtitle, icon, path }) => {
    const Icon = icon;
    return (
        <Link
            href={path}
            className="flex flex-col items-center text-center hover:scale-110 transition-all duration-500 gap-3 py-6 px-4 group"
        >
            <div className="w-12 h-12 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <Image src={Icon} alt={label} className="w-10 h-10 object-contain" />
            </div>
            <span className="font-serif text-base font-semibold text-gray-800 leading-tight">
                {label}
            </span>
            {subtitle && (
                <span className="text-xs text-[#a07850] leading-relaxed">
                    {subtitle}
                </span>
            )}
        </Link>
    )
}

export default InfoGraphicCard