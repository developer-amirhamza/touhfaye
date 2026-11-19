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
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import { collectionTagLabel } from '@/app/common/productCollections';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator } from 'react-icons/md';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  category?: { title: string };
  images: string[];
  createdAt: string;
  collectionTag?: string | null;
}

const AdminProductsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState<string | null>(null);

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

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicateLoading(id);
      const response = await Axios({
        ...SummeryApi.duplicateProduct,
        data: { id },
      });
      if (response.data?.success) {
        toast.success('Product duplicated successfully');
        setProducts(prev => [response.data.data, ...prev]);
      } else {
        toast.error(response.data?.message || 'Failed to duplicate product');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setDuplicateLoading(null);
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

  // Drag only starts after a small pointer move, so a plain click (Edit,
  // Delete, the status pill) never gets swallowed as a drag gesture.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered); // optimistic — reorder is instant, persist below

    try {
      const response = await Axios({
        ...SummeryApi.reorderProducts,
        data: { ids: reordered.map(p => p.id) },
      });
      if (!response.data?.success) {
        toast.error(response.data?.message || 'Failed to save the new order');
        setProducts(products); // roll back
      }
    } catch (error) {
      AxiosToastError(error);
      setProducts(products); // roll back
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

      {products.length > 1 && (
        <p className="text-xs text-gray-500 mb-2">Drag rows by the handle to change the order products appear in on the storefront.</p>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-3 py-3"></th>
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {products.map((product) => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      onToggleActive={toggleActiveStatus}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      duplicateLoading={duplicateLoading === product.id}
                      deleteLoading={deleteLoading === product.id}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SortableProductRowProps {
  product: Product;
  onToggleActive: (product: Product) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  duplicateLoading: boolean;
  deleteLoading: boolean;
}

const SortableProductRow: React.FC<SortableProductRowProps> = ({
  product, onToggleActive, onDuplicate, onDelete, duplicateLoading, deleteLoading,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 bg-white">
      <td className="px-3 py-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          aria-label="Drag to reorder"
        >
          <MdDragIndicator size={20} />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <img
          src={product.images?.[0] || '/placeholder.png'}
          alt={product.title}
          className="w-10 h-10 object-cover rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium line-clamp-1 max-w-30 text-gray-900">
        {product.title}
        {product.collectionTag && (
          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 align-middle">
            {collectionTagLabel(product.collectionTag)}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {DisplayPriceInBdt(product.price)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {product.stock}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleActive(product)}
          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
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
            onClick={() => onDuplicate(product.id)}
            disabled={duplicateLoading}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer"
          >
            {duplicateLoading ? '...' : 'Duplicate'}
          </button>
          <button
            onClick={() => onDelete(product.id)}
            disabled={deleteLoading}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
          >
            {deleteLoading ? '...' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdminProductsPage;