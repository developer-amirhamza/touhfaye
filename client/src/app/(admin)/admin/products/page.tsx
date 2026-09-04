"use client";
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppDispatch, RootState } from '@/redux/store';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  category?: { title: string };
  images: string[];
  createdAt: string;
}

const AdminProductsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await Axios({ ...SummeryApi.fetchProducts });
      if (response.data?.success) {
        setProducts(response.data?.data || []);
      } else {
        toast.error(response.data?.message || 'Failed to fetch products');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setDeleteLoading(id);
      const response = await Axios({
        ...SummeryApi.deleteProduct,
        data: { id },
      });
      if (response.data?.success) {
        toast.success('Product deleted successfully');
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error(response.data?.message || 'Failed to delete product');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleActiveStatus = async (product: Product) => {
    try {
      const response = await Axios({
        ...SummeryApi.updateProduct,
        data: {
          id: product.id,
          isActive: !product.isActive,
        },
      });
      if (response.data?.success) {
        toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
        );
      } else {
        toast.error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading products...</div>;
  }

  return (
    <div className="container mx-auto  p-4  ">
      <div className="flex justify-between my-5 items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/create"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Create New Product
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium line-clamp-1 max-w-30 text-gray-900">
                    {product.title}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {product.category?.title || '—'}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {DisplayPriceInAud(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActiveStatus(product)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/update/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteLoading === product.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleteLoading === product.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;