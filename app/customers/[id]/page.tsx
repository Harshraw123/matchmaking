'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CustomerProfile, PartnerPreferences } from '@/lib/matching/types';
import { EditProfileModal } from '@/components/modals/edit-profile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Edit,
  ShieldCheck,
  MapPin,
  Briefcase,
  Heart,
  Calendar,
  Phone,
  User,
  Send,
  AlertCircle,
  Plus,
  Lock,
} from 'lucide-react';

interface NoteItem {
  id: string;
  customerId: string;
  matchmakerId: string;
  matchmakerName: string;
  noteText: string;
  category: 'Call' | 'Meeting' | 'Follow-up' | 'General';
  nextFollowUpDate?: string;
  createdAt: string;
}

interface IntroItem {
  id: string;
  customerId: string;
  candidateId: string;
  customMessage: string;
  sentByMatchmakerId: string;
  sentAt: string;
  status: string;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [introductions, setIntroductions] = useState<IntroItem[]>([]);
  const [activeTab, setActiveTab] = useState<'biodata' | 'preferences' | 'notes' | 'history'>('biodata');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Call' | 'Meeting' | 'Follow-up' | 'General'>('Call');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Sensitive Field reveal toggle
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setPreferences(data.preferences);
        setNotes(data.notes || []);
        setIntroductions(data.introductions || []);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: newNoteText,
          category: newNoteCategory,
          nextFollowUpDate: newFollowUpDate || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotes([data.note, ...notes]);
        setNewNoteText('');
        setNewFollowUpDate('');
        if (customer && newFollowUpDate) {
          setCustomer({ ...customer, nextFollowUpDate: newFollowUpDate });
        }
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono">Loading client profile...</p>
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="py-16 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-black mx-auto" />
          <h2 className="font-serif font-bold text-lg text-black">Client Profile Not Found</h2>
          <p className="text-xs text-zinc-500">The requested client identifier does not exist.</p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs border-zinc-300">Return to Dashboard</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: `${customer.firstName} ${customer.lastName}` },
      ]}
      activeCustomerId={customer.id}
      activeCustomerName={`${customer.firstName} ${customer.lastName}`}
    >
      <div className="space-y-6">
        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-black text-white font-serif font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-xs">
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif font-bold text-xl sm:text-2xl text-black truncate">
                    {customer.firstName} {customer.lastName}
                  </h1>
                  <Badge variant="outline" className="text-[10px] font-mono bg-black text-white border-black">
                    {customer.verificationStatus === 'verified' ? '✓ Verified' : 'Pending Review'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono bg-zinc-100 text-zinc-800 border-zinc-200 capitalize">
                    {customer.journeyStage.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>{customer.age} yrs</span>
                  <span>•</span>
                  <span>{customer.maritalStatus}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {customer.city}, {customer.country}
                  </span>
                  <span>•</span>
                  <span>{customer.heightCm} cm ({Math.floor(customer.heightCm / 30.48)}&apos;{Math.round((customer.heightCm % 30.48) / 2.54)}&quot;)</span>
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 font-mono">
                  <span>Completeness: <strong>{customer.profileCompleteness}%</strong></span>
                  <div className="w-20 sm:w-28 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: `${customer.profileCompleteness}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="text-xs border-zinc-300 bg-white text-black hover:bg-zinc-100 h-8"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
              </Button>
              <Link href={`/customers/${customer.id}/matches`}>
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-zinc-800 text-xs font-medium h-8 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Find Matches
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs (Touch-scrollable on mobile) */}
          <div className="flex gap-1.5 border-t border-zinc-100 mt-5 pt-3.5 overflow-x-auto no-scrollbar text-xs font-medium">
            <button
              onClick={() => setActiveTab('biodata')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'biodata'
                  ? 'bg-black text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              Full Biodata
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-black text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              Partner Preferences
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-black text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              Consultation Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-black text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              Match History ({introductions.length})
            </button>
          </div>
        </div>

        {/* TAB 1: BIODATA OVERVIEW */}
        {activeTab === 'biodata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Career & Financial Standing */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-black">
                <Briefcase className="w-4 h-4 text-black" />
                <h3 className="font-serif font-bold text-sm text-black">Career & Financial Standing</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Designation</span>
                  <span className="font-semibold text-black break-words">{customer.designation}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Company</span>
                  <span className="font-semibold text-black break-words">{customer.currentCompany}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Income Range</span>
                  <span className="font-semibold text-black font-mono">{customer.annualIncomeRange}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Arrangement</span>
                  <span className="font-semibold text-black">{customer.workArrangement}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Education</span>
                  <span className="font-semibold text-black">{customer.educationLevel}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Alma Mater</span>
                  <span className="font-semibold text-black break-words">{customer.undergraduateCollege}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Degree</span>
                  <span className="font-semibold text-black">{customer.degree}</span>
                </div>
              </div>
            </div>

            {/* Lifestyle & Values */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-black">
                <Heart className="w-4 h-4 text-black" />
                <h3 className="font-serif font-bold text-sm text-black">Lifestyle & Values</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Want Children</span>
                  <Badge variant="outline" className="mt-0.5 text-xs bg-zinc-50 text-black border-zinc-300">
                    {customer.wantChildren}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Relocation</span>
                  <Badge variant="outline" className="mt-0.5 text-xs bg-zinc-50 text-black border-zinc-300">
                    {customer.openToRelocation}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Open to Pets</span>
                  <Badge variant="outline" className="mt-0.5 text-xs bg-zinc-50 text-black border-zinc-300">
                    {customer.openToPets}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Diet</span>
                  <span className="font-semibold text-black">{customer.dietaryPreference || 'Not specified'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Personal Values</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {customer.personalValues.map(v => (
                      <span key={v} className="px-2 py-0.5 bg-zinc-100 text-black rounded-md text-[11px] font-medium border border-zinc-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Hobbies & Passions</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {customer.hobbies.map(h => (
                      <span key={h} className="px-2 py-0.5 bg-zinc-50 text-zinc-700 rounded-md text-[11px] border border-zinc-200">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Family & Cultural Background */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-black">
                <User className="w-4 h-4 text-black" />
                <h3 className="font-serif font-bold text-sm text-black">Family & Background</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Languages</span>
                  <span className="font-semibold text-black">{customer.languagesKnown.join(', ')}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Family Involvement</span>
                  <span className="font-semibold text-black">{customer.familyInvolvement}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Siblings</span>
                  <span className="font-semibold text-black">{customer.siblingsCount}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Sibling Details</span>
                  <span className="font-semibold text-black break-words">{customer.siblingsDetails || 'None listed'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      Sensitive Data (Access-Controlled)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      className="text-[11px] h-6 text-black hover:bg-zinc-100"
                    >
                      <Lock className="w-3 h-3 mr-1" /> {showSensitiveData ? 'Hide' : 'Reveal'}
                    </Button>
                  </div>
                  {showSensitiveData ? (
                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-mono">Religion</span>
                        <span className="font-medium text-black">{customer.religion || 'Unstated'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-mono">Caste (Optional)</span>
                        <span className="font-medium text-black">{customer.caste || 'Unstated'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 italic">
                      Protected fields isolated from default algorithmic scoring.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Operational Contact Details */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-black">
                <Phone className="w-4 h-4 text-black" />
                <h3 className="font-serif font-bold text-sm text-black">Contact & Operational Notes</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Phone</span>
                  <span className="font-semibold text-black font-mono">{customer.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Email</span>
                  <span className="font-semibold text-black break-all">{customer.email}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Last Contacted</span>
                  <span className="font-semibold text-black font-mono">
                    {customer.lastContactedAt ? new Date(customer.lastContactedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Next Follow-Up</span>
                  <span className="font-semibold text-black font-mono">
                    {customer.nextFollowUpDate ? new Date(customer.nextFollowUpDate).toLocaleDateString() : 'None Scheduled'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Relationship Vision</span>
                  <p className="mt-1 text-xs text-zinc-700 italic leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    &ldquo;{customer.relationshipGoals}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-black">Partner Preferences</h3>
                <p className="text-xs text-zinc-500">Evaluated deterministically in candidate recommendation scoring</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="text-xs border-zinc-300 self-start sm:self-auto"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Modify Preferences
              </Button>
            </div>

            {preferences ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <span className="font-bold text-black uppercase font-mono tracking-wider text-[10px]">
                    Age & Location
                  </span>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Preferred Age</span>
                    <span className="font-semibold text-black font-mono">
                      {preferences.preferredAgeMin || '18'} to {preferences.preferredAgeMax || '80'} years
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Preferred Cities</span>
                    <span className="font-semibold text-black">
                      {preferences.preferredLocations?.join(', ') || 'Open to all cities'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <span className="font-bold text-black uppercase font-mono tracking-wider text-[10px]">
                    Career & Education
                  </span>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Education Level</span>
                    <span className="font-semibold text-black">
                      {preferences.preferredEducation?.join(', ') || 'No strict degree requirement'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Professions</span>
                    <span className="font-semibold text-black">
                      {preferences.preferredProfessions?.join(', ') || 'Open across sectors'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <span className="font-bold text-black uppercase font-mono tracking-wider text-[10px]">
                    Height & Financials
                  </span>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Height Bracket</span>
                    <span className="font-semibold text-black font-mono">
                      {preferences.preferredHeightMinCm || 'Any'} cm - {preferences.preferredHeightMaxCm || 'Any'} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Minimum Income</span>
                    <span className="font-semibold text-black font-mono">
                      {preferences.preferredIncomeMin ? `₹${preferences.preferredIncomeMin / 100000}L+` : 'Flexible'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <span className="font-bold text-black uppercase font-mono tracking-wider text-[10px]">
                    Non-Negotiables & Dealbreakers
                  </span>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Strict Constraints</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {preferences.nonNegotiables && preferences.nonNegotiables.length > 0 ? (
                        preferences.nonNegotiables.map(n => (
                          <span key={n} className="px-2 py-0.5 bg-black text-white rounded-md text-[10px] font-mono font-semibold">
                            {n}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 italic">No non-negotiables stated</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-zinc-400 block text-[10px] uppercase font-mono">Special Requirements</span>
                    <span className="font-medium text-black">
                      {preferences.otherRequirements || 'Standard alignment'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 text-xs font-mono">
                No partner preferences recorded.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTES & FOLLOW-UPS */}
        {activeTab === 'notes' && (
          <div className="space-y-5">
            {/* Note Composer */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5">
              <h3 className="font-serif font-bold text-sm text-black">Record Consultation Note</h3>
              <form onSubmit={handleCreateNote} className="space-y-3">
                <Textarea
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Record insights from phone consultation, meeting, biodata updates..."
                  rows={3}
                  required
                  className="text-xs border-zinc-300 bg-white text-black focus:border-black"
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <Label className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Category</Label>
                      <select
                        value={newNoteCategory}
                        onChange={e => setNewNoteCategory(e.target.value as any)}
                        className="border border-zinc-300 rounded-lg px-2.5 py-1 text-xs bg-white text-black mt-0.5 block h-8"
                      >
                        <option value="Call">Phone Call</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Next Follow-Up</Label>
                      <Input
                        type="date"
                        value={newFollowUpDate}
                        onChange={e => setNewFollowUpDate(e.target.value)}
                        className="text-xs border-zinc-300 bg-white text-black mt-0.5 h-8 font-mono"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={savingNote}
                    className="bg-black text-white hover:bg-zinc-800 text-xs h-8 self-end sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> {savingNote ? 'Saving...' : 'Add Note'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Notes Feed */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-sm text-black">Consultation Timeline</h3>
              {notes.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-zinc-200 text-center text-xs text-zinc-400 font-mono">
                  No consultation notes logged yet.
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black">{note.matchmakerName}</span>
                        <Badge variant="outline" className="text-[9px] font-mono bg-zinc-50 text-zinc-700 border-zinc-300">
                          {note.category}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{note.noteText}</p>
                    {note.nextFollowUpDate && (
                      <div className="text-[10px] text-black font-mono flex items-center gap-1 font-semibold pt-1">
                        <Calendar className="w-3 h-3 text-black" /> Follow-Up: {new Date(note.nextFollowUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MATCH HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-black">Match Dispatches & Outcomes</h3>
            {introductions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
                <Send className="w-6 h-6 mx-auto text-zinc-300" />
                <p>No candidate introductions have been sent for {customer.firstName} yet.</p>
                <Link href={`/customers/${customer.id}/matches`}>
                  <Button size="sm" className="bg-black text-white hover:bg-zinc-800 text-xs mt-2">
                    Discover Recommended Candidates
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {introductions.map(intro => (
                  <div key={intro.id} className="py-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-black font-mono">
                        Candidate ID: {intro.candidateId}
                      </div>
                      <Badge className="bg-black text-white border-black text-[9px] font-mono">
                        {intro.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200 font-sans text-xs">
                      &ldquo;{intro.customMessage}&rdquo;
                    </p>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Dispatched on {new Date(intro.sentAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        customer={customer}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={updated => setCustomer(updated)}
      />
    </AppShell>
  );
}
