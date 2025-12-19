// /components/UserProfile.tsx

'use client';

import React, { useState } from 'react';
import { User } from '@/types/user';
import {
  Edit2,
  Save,
  X,
  Wallet,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface UserProfileProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => Promise<void>;
  isLoading?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onProfileUpdate,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    contact_number: user.contact_number || '',
    address: user.address || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async () => {
    setSaveError('');
    setIsSaving(true);

    try {
      const updatedUser: User = {
        ...user,
        ...editForm,
      };
      await onProfileUpdate(updatedUser);
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      contact_number: user.contact_number || '',
      address: user.address || '',
    });
    setIsEditing(false);
    setSaveError('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin text-blue-600 mr-2">⏳</div>
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">User Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <p className="text-blue-100">
                {user.role === 'BUYER'
                  ? 'Buyer'
                  : user.role === 'SELLER'
                  ? 'Seller'
                  : 'Logistics Provider'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {isEditing ? (
            /* ============ EDIT MODE ============ */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={editForm.contact_number}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact_number: e.target.value,
                    })
                  }
                  placeholder="+1-234-567-8900"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  placeholder="Street, City, State, ZIP"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              {saveError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {saveError}
                </div>
              )}

              <div className="flex space-x-3 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-200 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============ VIEW MODE ============ */
            <div className="space-y-6">
              {/* Name */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-sm font-semibold text-blue-600">
                      Name
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Full Name</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Mail size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email Address</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Account Role</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.role === 'BUYER'
                        ? 'Buyer'
                        : user.role === 'SELLER'
                        ? 'Seller'
                        : 'Logistics Provider'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Address (Read-Only) */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500">Blockchain Wallet</p>
                    <p className="text-sm font-mono text-slate-900 break-all">
                      {user.wallet_address}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Immutable Identity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopyToClipboard(user.wallet_address, 'wallet_address')
                  }
                  className="ml-2 p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="Copy wallet address"
                >
                  {copiedField === 'wallet_address' ? (
                    <CheckCircle2 size={18} className="text-green-600" />
                  ) : (
                    <Copy size={18} className="text-slate-400" />
                  )}
                </button>
              </div>

              {/* Wallet Balance */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign size={18} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Wallet Balance</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${user.wallet_balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Number */}
              {user.contact_number && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Phone size={18} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Contact Number</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {user.contact_number}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              {user.address && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <MapPin size={18} className="text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Address</p>
                      <p className="text-slate-900 whitespace-pre-wrap">
                        {user.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Account Created</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Calendar size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(user.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Import DollarSign icon
import { DollarSign } from 'lucide-react';
