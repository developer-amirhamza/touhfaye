import { fetchProducts } from '@/redux/slices/productSlice';
import { AppDispatch, RootState } from '@/redux/store'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from './ProductCard';

const ProductGrid = () => {
    const {status, products} = useSelector((state:RootState)=>state.productSlice);
    const dispatch = useDispatch<AppDispatch>()

    useEffect(()=>{
        if(status === "idle"){
            dispatch(fetchProducts())
        }
    },[status,dispatch])
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 py-20   mb-10 md:grid-cols-3 container h-full gap-y-10 pb-10  place-items-center">
        {products?.map((product,index)=>(
            <ProductCard data={product} key={index}/>
        ))}
    </div>
  )
}

export default ProductGrid