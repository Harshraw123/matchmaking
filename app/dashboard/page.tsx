'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { CustomerProfile } from '@/lib/matching/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Send,
  Calendar,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  UserCheck,
} from 'lucide-react';

interface OperationalMetrics {
  totalAssignedCustomers: number;
  verifiedProfiles: number;
  profilesAwaitingReview: number;
  readyForMatches: number;
  pendingIntroductions: number;
  upcomingFollowUps: number;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [journeyStage, setJourneyStage] = useState('all');
  const [city, setCity] = useState('all');
  const [gender, setGender] = useState('all');
  const [maritalStatus, setMaritalStatus] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'completeness' | 'lastContacted'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
      if (journeyStage !== 'all') params.set('journeyStage', journeyStage);
      if (city !== 'all') params.set('city', city);
      if (gender !== 'all') params.set('gender', gender);
      if (maritalStatus !== 'all') params.set('maritalStatus', maritalStatus);
      if (verificationStatus !== 'all') params.set('verificationStatus', verificationStatus);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setCustomers(data.customers || []);
        setMetrics(data.metrics || null);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, journeyStage, city, gender, maritalStatus, verificationStatus, sortBy, sortOrder]);

  const resetFilters = () => {
    setSearch('');
    setJourneyStage('all');
    setCity('all');
    setGender('all');
    setMaritalStatus('all');
    setVerificationStatus('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'ready_for_matches':
        return <Badge className="bg-black text-white border-black text-[10px] font-mono">Ready for Matches</Badge>;
      case 'active_matching':
        return <Badge className="bg-zinc-800 text-white border-zinc-800 text-[10px] font-mono">Active Matching</Badge>;
      case 'profile_review':
        return <Badge className="bg-zinc-200 text-black border-zinc-300 text-[10px] font-mono">Profile Review</Badge>;
      case 'in_discussion':
        return <Badge className="bg-zinc-100 text-zinc-800 border-zinc-300 text-[10px] font-mono">In Discussion</Badge>;
      case 'matched':
        return <Badge className="bg-black text-white border-black text-[10px] font-mono">Matched</Badge>;
      default:
        return <Badge variant="outline" className="text-zinc-600 bg-zinc-50 border-zinc-200 text-[10px] font-mono">Onboarding</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-black" /> Verified
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-400" /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 font-mono">
            Unverified
          </span>
        );
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6 sm:space-y-8">
        {/* Operator Profile Banner */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-black text-white font-heading font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  Active Operator
                </span>
                <Badge variant="outline" className="text-[9px] font-mono bg-zinc-100 text-black border-zinc-300">
                  {currentUser?.role || 'Senior Matchmaker'}
                </Badge>
              </div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-black">
                {currentUser?.name ? `Welcome, ${currentUser.name}` : 'Welcome back'}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {currentUser?.email || 'Logged in to TDC workspace'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs font-mono bg-zinc-50 border-zinc-200 text-zinc-700 py-1 px-3">
              Role: <span className="text-black font-semibold ml-1">{currentUser?.role || 'Lead Matchmaker'}</span>
            </Badge>
          </div>
        </div>

        {/* Page Heading Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
              Operations Console
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {currentUser?.name ? `Lead Operator: ${currentUser.name} • ` : ''}Active client roster, verified biodata, and algorithmic discovery engine.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
            </Button>
          </div>
        </div>

        {/* Operational Metrics Cards (Monochrome High Contrast) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Assigned</span>
              <Users className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-2xl font-heading font-bold text-black">
              {metrics ? metrics.totalAssignedCustomers : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Assigned clients</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Verified</span>
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-2xl font-heading font-bold text-black">
              {metrics ? metrics.verifiedProfiles : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Authenticated profiles</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Review</span>
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-2xl font-heading font-bold text-zinc-700">
              {metrics ? metrics.profilesAwaitingReview : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Audit in progress</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Ready</span>
              <HeartHandshake className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-2xl font-heading font-bold text-black">
              {metrics ? metrics.readyForMatches : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Active for matching</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Sent Intros</span>
              <Send className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-2xl font-heading font-bold text-black">
              {metrics ? metrics.pendingIntroductions : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Introductions sent</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-black transition-colors space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Follow-Ups</span>
              <Calendar className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="text-2xl font-heading font-bold text-black">
              {metrics ? metrics.upcomingFollowUps : '—'}
            </div>
            <div className="text-[10px] text-zinc-400">Scheduled check-ins</div>
          </div>
        </div>

        {/* Customer Directory Table Section */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          {/* Responsive Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search client, city, profession, employer..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 text-xs border-zinc-300 bg-white text-black h-9 rounded-lg focus:border-black focus:ring-black"
                />
              </div>

              {/* Sorter Controls */}
              <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-[11px] uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="border border-zinc-300 rounded-lg px-2.5 py-1 text-xs bg-white text-black h-8 focus:border-black"
                >
                  <option value="name">Name</option>
                  <option value="age">Age</option>
                  <option value="completeness">Profile Completeness</option>
                  <option value="lastContacted">Last Contacted</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-1 border border-zinc-300 rounded-lg bg-white text-xs hover:bg-zinc-100 h-8 font-mono"
                  title="Toggle Ascending/Descending"
                >
                  {sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                  Journey Stage
                </label>
                <select
                  value={journeyStage}
                  onChange={e => { setJourneyStage(e.target.value); setPage(1); }}
                  className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-xs bg-white text-black h-8"
                >
                  <option value="all">All Stages</option>
                  <option value="ready_for_matches">Ready for Matches</option>
                  <option value="active_matching">Active Matching</option>
                  <option value="profile_review">Profile Review</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="matched">Matched</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                  City
                </label>
                <select
                  value={city}
                  onChange={e => { setCity(e.target.value); setPage(1); }}
                  className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-xs bg-white text-black h-8"
                >
                  <option value="all">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => { setGender(e.target.value); setPage(1); }}
                  className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-xs bg-white text-black h-8"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                  Verification
                </label>
                <select
                  value={verificationStatus}
                  onChange={e => { setVerificationStatus(e.target.value); setPage(1); }}
                  className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-xs bg-white text-black h-8"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={e => { setMaritalStatus(e.target.value); setPage(1); }}
                  className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-xs bg-white text-black h-8"
                >
                  <option value="all">All Statuses</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll Barrier */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Career & Alma Mater</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Completeness</th>
                  <th className="py-3 px-4">Last Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                        <span className="font-mono text-xs">Loading client records...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-2.5">
                        <UserCheck className="w-8 h-8 text-zinc-300 mx-auto" />
                        <h4 className="font-heading font-bold text-sm text-black">No Matching Clients Found</h4>
                        <p className="text-xs text-zinc-500">
                          Try adjusting the search query or resetting active filter constraints.
                        </p>
                        <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs border-zinc-300">
                          Clear All Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map(customer => (
                    <tr
                      key={customer.id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-black text-white font-heading font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {customer.firstName[0]}{customer.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-black group-hover:underline flex items-center gap-1.5 truncate max-w-[150px] sm:max-w-xs">
                              {customer.firstName} {customer.lastName}
                              {customer.assignedMatchmakerId && (
                                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" title="Assigned Client" />
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {customer.age}y • {customer.gender === 'male' ? 'Male' : 'Female'} • {customer.maritalStatus}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-black">{customer.city}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{customer.country}</div>
                      </td>

                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-medium text-black truncate">{customer.designation}</div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {customer.currentCompany} • {customer.undergraduateCollege}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getVerificationBadge(customer.verificationStatus)}
                      </td>

                      <td className="py-3 px-4">
                        {getStageBadge(customer.journeyStage)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black rounded-full"
                              style={{ width: `${customer.profileCompleteness}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-zinc-600">
                            {customer.profileCompleteness}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                        {customer.lastContactedAt ? new Date(customer.lastContactedAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Link href={`/customers/${customer.id}/matches`}>
                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-zinc-800 text-xs h-7 px-2.5 font-medium shadow-xs"
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> Matches
                          </Button>
                        </Link>
                        <Link href={`/customers/${customer.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          >
                            Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Responsive Pagination Bar */}
          <div className="p-3.5 sm:p-4 border-t border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="text-center sm:text-left">
              Showing <span className="font-semibold text-black">{customers.length}</span> of{' '}
              <span className="font-semibold text-black">{total}</span> total candidates
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 text-xs bg-white border-zinc-300"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <span className="text-xs font-mono font-semibold px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 text-xs bg-white border-zinc-300"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
