"use client";
import React, { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import ProductCard from './ProductCard';
import CardLoader from './CardLoader';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {motion} from "framer-motion"
import Link from 'next/link';

const CategoryWiseProductDisplay: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    const fetchProducts = async (categoryId: string | null = null) => {
        try {
            setLoading(true);
            const response = categoryId
                ? await Axios({ ...SummeryApi.getProductByCategory, data: { id: categoryId } })
                : await Axios({ ...SummeryApi.fetchProducts });
            setProducts(response.data?.success ? response.data.data : []);
        } catch (error) {
            AxiosToastError(error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(null); }, []);

    const handleCategoryClick = (categoryId: string | null) => {
        setActiveCategoryId(categoryId);
        fetchProducts(categoryId);
    };

    const visible = products.slice(0, 8);
    const activeLabel = activeCategoryId
        ? categories.find(c => c.id === activeCategoryId)?.title ?? 'Our Collection'
        : 'Our Collection';


    return (
        <section className="bg-[#e8ddd4] py-10">
            <div className="container flex flex-col items-center  mx-auto px-6">

                {/* Section header */}
                <div className="flex flex-col items-center text-center mb-5 gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Shop incontinence products online
                    </p>
                    <h2 className="font-serif text-5xl md:text-6xl text-gray-900 tracking-tight leading-none">
                        {activeLabel}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-[300px] mt-1">
                        Thoughtfully crafted products for your daily care ritual
                    </p>
                </div>

                 {/* Category tabs with sliding pill */}
                {categories.length > 0 && (
                    <div className="flex justify-center items-center flex-wrap gap-1 p-1 rounded-full  bg-background max-w-fit w-full mb-10">
                        {/* "All" tab */}
                        <motion.button
                            onClick={() => handleCategoryClick(null)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-colors duration-300 ease-in-out ${
                                activeCategoryId === null ? 'text-background' : 'text-secondary-hover hover:text-secondary'
                            }`}
                        >
                            {activeCategoryId === null && (
                                <motion.span
                                    layoutId="category-pill"
                                    className="absolute inset-0 bg-secondary rounded-full shadow-md"
                                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                            )}
                            <span className="relative z-10">All</span>
                        </motion.button>

                        {categories.map((cat) => (
                            <motion.button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className={`relative px-6 py-3 rounded-full text-sm font-semibold  transition-colors duration-300 ease-in-out ${
                                    activeCategoryId === cat.id ? 'text-background' : 'text-secondary hover:text-secondary-hover'
                                }`}
                            >
                                {activeCategoryId === cat.id && (
                                    <motion.span
                                        layoutId="category-pill"
                                        className="absolute inset-0 bg-secondary rounded-full shadow-md"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                                <span className="relative z-10">{cat.title}</span>
                            </motion.button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {loading
                        ? Array(4).fill(null).map((_, i) => <CardLoader key={i} />)
                        : visible.length === 0
                        ? <p className="col-span-4 text-center text-gray-400 py-10">No products found</p>
                        : visible.map((product, index) =>{
                            return(
                                <motion.div
                                key={index}
                                initial={{
                            opacity:0,
                            x:0,
                            y:20,
                        }}
                        whileInView={{
                            opacity:1,
                            x:0,
                            y:0,
                            transition:{
                                type:"tween",
                                delay:index * 0.2,
                                duration:0.3,
                                ease:[0.25,0.25,0.25,0.75]
                            }
                        }}
                        viewport={{once:false,amount:0.2}} custom={index}
                                className="">
                                    <ProductCard key={product.id} data={product} />
                                </motion.div>
                            )
                        })
                    }
                </div>
                <Link href={"/products"}
                className='mt-12 border border-secondary px-5 py-3 rounded-full hover:bg-background transition-all duration-300 hover:scale-105 text-base font-medium shadow-xl '
                >View All Products</Link>
            </div>
        </section>
    );
};

export default CategoryWiseProductDisplay;