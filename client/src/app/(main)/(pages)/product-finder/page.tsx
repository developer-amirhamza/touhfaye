import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import image from "@/assets/home/sample-order-2b_900x.webp"
import tailored from "@/assets/home/tailored.avif"
import recommendations from "@/assets/home/recommendations.avif"
import ProductFinderWizard from '../../components/ProductFinderWizard'

const page = () => {
  return (
    <div className="grid w-full place-content-center">
        <div className="flex w-full mt-6">
                        {/* <Image src={image} alt="health u australia" className='max-h-72 rounded-xl object-cover' /> */}
                    </div>
        <ProductFinderWizard/>
    </div>
  )
}

export default page