"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

import { fetchMyOrders } from '@/redux/slices/orderSlice';
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/app/(main)/components/UI/Loader';

interface UserProfile {
  id: any;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
}

const fieldCls = "w-full border border-primary-hover bg-white px-3.5 py-2.5 text-sm font-light outline-none focus:border-secondary";

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, status: authStatus } = useSelector((state: RootState) => state.userSlice);
  const { orders, status: ordersStatus } = useSelector((state: RootState) => state.orderSlice);

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (authStatus === 'succeeded' && !user) {
      router.push('/signin?redirect=/profile');
    }
  }, [authStatus, user, router]);

  useEffect(() => {
    if (user) {
      const u: any = user;
      setProfile({
        id: user.id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: user.email || '',
        phone: user.mobile || '',
        avatar: user.avatar || '',
      });
      setEditForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: user.email || '',
        phone: user.mobile || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && ordersStatus === 'idle') {
      dispatch(fetchMyOrders());
    }
  }, [user, ordersStatus, dispatch]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummeryApi.updateUserDetails,
        data: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
        },
      });
      if (response.data?.success) {
        toast.success('Profile updated successfully');
        setProfile({
          ...profile,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
        });
        setIsEditing(false);
      } else {
        toast.error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setPasswordLoading(true);
      const response = await Axios({
        ...SummeryApi.changePassword,
        data: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      });
      if (response.data?.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.data?.message || 'Password change failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authStatus === 'loading' || !user) {
    return (
      <div className="bg-background flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-10">
      <div className="container mx-auto px-6">
        <h1 className="font-secondary text-4xl text-title mb-8">Your account</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="bg-white border border-primary-hover p-7 text-center h-fit">
            <div className="relative mx-auto w-28 h-28 mb-4">
              {profile.avatar ? (
                <Image
                  src={profile.avatar || '/default-avatar.png'}
                  alt="avatar"
                  fill
                  className="rounded-full object-cover border border-primary-hover"
                />
              ) : (
                <div className="text-4xl w-full h-full flex items-center justify-center rounded-full font-secondary text-background bg-secondary">
                  {profile?.firstName[0] ?? ""}
                </div>
              )}
            </div>
            <h2 className="font-secondary text-xl text-title">{profile?.firstName} {profile?.lastName}</h2>
            <p className="text-foreground font-light text-sm mt-1">{profile.email}</p>
            {profile.phone && <p className="text-foreground font-light text-sm mt-0.5">{profile.phone}</p>}
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-secondary hover:bg-secondary-hover text-background px-4 py-2.5 text-[11px] tracking-[.16em] transition-colors"
              >
                EDIT PROFILE
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="border border-primary-hover text-title hover:border-secondary px-4 py-2.5 text-[11px] tracking-[.16em] transition-colors"
              >
                CHANGE PASSWORD
              </button>
            </div>
          </div>

          {/* Orders Section */}
          <div className="md:col-span-2 bg-white border border-primary-hover p-7">
            <h2 className="font-secondary text-xl text-title mb-5">Recent orders</h2>
            {ordersStatus === 'loading' ? (
              <div className="flex justify-center py-8"><Loader /></div>
            ) : orders && orders.length > 0 ? (
              <div className="flex flex-col gap-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-primary-hover p-4 hover:border-accent transition-colors">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="text-title">{order.orderNumber}</p>
                        <p className="text-[12.5px] text-accent font-light mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-title">{DisplayPriceInBdt(order.total)}</p>
                        <p className="text-[12.5px] text-foreground font-light">{order.orderStatus}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-[12.5px] text-foreground font-light">
                      {order.items.length} item(s)
                    </div>
                    <Link
                      href="/order/my-orders"
                      className="text-secondary text-[12.5px] border-b border-secondary mt-2 inline-block"
                    >
                      View details →
                    </Link>
                  </div>
                ))}
                {orders.length > 5 && (
                  <Link
                    href="/order/my-orders"
                    className="text-secondary text-[12.5px] border-b border-secondary block text-center mt-2 w-fit mx-auto"
                  >
                    View all orders →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-foreground font-light text-center py-8">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-[#12281C]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full p-7">
              <h2 className="font-secondary text-2xl text-title mb-4">Edit profile</h2>
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">FIRST NAME</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">LAST NAME</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">EMAIL</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">PHONE</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-background px-5 py-2.5 text-[11px] tracking-[.16em] transition-colors"
                  >
                    {loading ? 'SAVING…' : 'SAVE'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="border border-primary-hover text-title px-5 py-2.5 text-[11px] tracking-[.16em]"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-[#12281C]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full p-7">
              <h2 className="font-secondary text-2xl text-title mb-4">Change password</h2>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">CURRENT PASSWORD</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">NEW PASSWORD</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[.14em] text-accent mb-1.5">CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className="bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-background px-5 py-2.5 text-[11px] tracking-[.16em] transition-colors"
                  >
                    {passwordLoading ? 'UPDATING…' : 'UPDATE PASSWORD'}
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="border border-primary-hover text-title px-5 py-2.5 text-[11px] tracking-[.16em]"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
