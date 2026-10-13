'use client';

import React, { useState, useEffect } from 'react';
import { CustomerProfile, JourneyStage, VerificationStatus, TrinaryChoice } from '@/lib/matching/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Check, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  customer: CustomerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: CustomerProfile) => void;
}

export function EditProfileModal({
  customer,
  isOpen,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    city: customer.city,
    phone: customer.phone,
    email: customer.email,
    currentCompany: customer.currentCompany,
    designation: customer.designation,
    annualIncomeRange: customer.annualIncomeRange,
    wantChildren: customer.wantChildren,
    openToRelocation: customer.openToRelocation,
    openToPets: customer.openToPets,
    dietaryPreference: customer.dietaryPreference || 'Vegetarian',
    relationshipGoals: customer.relationshipGoals,
    verificationStatus: customer.verificationStatus,
    journeyStage: customer.journeyStage,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      onSaved(data.customer);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-black">Edit Client Biodata</h2>
            <p className="text-xs text-zinc-500">Update verified biodata for {customer.firstName} {customer.lastName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-black p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-zinc-100 text-black text-xs rounded-lg border border-zinc-300 font-mono">
              {error}
            </div>
          )}

          {/* Section: Personal */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs text-zinc-700">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-700">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-700">City</Label>
                <Input
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-700">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Career & Financials */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">Career & Income</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <Label className="text-xs text-zinc-700">Company</Label>
                <Input
                  value={formData.currentCompany}
                  onChange={e => setFormData({ ...formData, currentCompany: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-700">Designation</Label>
                <Input
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-700">Income Bracket</Label>
                <Input
                  value={formData.annualIncomeRange}
                  onChange={e => setFormData({ ...formData, annualIncomeRange: e.target.value })}
                  required
                  className="mt-1 h-9 text-xs border-zinc-300 focus:border-black font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Lifestyle Stances */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">Lifestyle Stances</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div>
                <Label className="text-xs text-zinc-700">Want Children</Label>
                <select
                  value={formData.wantChildren}
                  onChange={e => setFormData({ ...formData, wantChildren: e.target.value as TrinaryChoice })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9"
                >
                  <option value="Yes">Yes</option>
                  <option value="Maybe">Maybe</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-zinc-700">Relocation</Label>
                <select
                  value={formData.openToRelocation}
                  onChange={e => setFormData({ ...formData, openToRelocation: e.target.value as TrinaryChoice })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9"
                >
                  <option value="Yes">Yes</option>
                  <option value="Maybe">Maybe</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-zinc-700">Pets</Label>
                <select
                  value={formData.openToPets}
                  onChange={e => setFormData({ ...formData, openToPets: e.target.value as TrinaryChoice })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9"
                >
                  <option value="Yes">Yes</option>
                  <option value="Maybe">Maybe</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-zinc-700">Diet</Label>
                <select
                  value={formData.dietaryPreference}
                  onChange={e => setFormData({ ...formData, dietaryPreference: e.target.value })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Non-veg">Non-veg</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-700">Relationship Goals</Label>
              <Input
                value={formData.relationshipGoals}
                onChange={e => setFormData({ ...formData, relationshipGoals: e.target.value })}
                className="mt-1 h-9 text-xs border-zinc-300 focus:border-black"
              />
            </div>
          </div>

          {/* Section: Operational Lifecycle */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">Operations Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs text-zinc-700">Journey Stage</Label>
                <select
                  value={formData.journeyStage}
                  onChange={e => setFormData({ ...formData, journeyStage: e.target.value as JourneyStage })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9 font-mono"
                >
                  <option value="onboarding">Onboarding</option>
                  <option value="profile_review">Profile Review</option>
                  <option value="ready_for_matches">Ready for Matches</option>
                  <option value="active_matching">Active Matching</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="matched">Matched</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-zinc-700">Verification Status</Label>
                <select
                  value={formData.verificationStatus}
                  onChange={e => setFormData({ ...formData, verificationStatus: e.target.value as VerificationStatus })}
                  className="w-full mt-1 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs bg-white text-black h-9 font-mono"
                >
                  <option value="verified">Verified</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="text-xs border-zinc-300 h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-black text-white hover:bg-zinc-800 text-xs h-9">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-2" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
