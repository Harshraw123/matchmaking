'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { MatchResult, CustomerProfile } from '@/lib/matching/types';
import { SendMatchModal } from '@/components/modals/send-match-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Send,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ArrowUpDown,
  Loader2,
  Info,
  XCircle,
} from 'lucide-react';

export default function CustomerMatchesPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'overall' | 'mutual' | 'completeness'>('overall');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Expanded factor breakdowns for cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Active match for Send Match Modal
  const [selectedMatchForSend, setSelectedMatchForSend] = useState<MatchResult | null>(null);

  // AI Generation Loading per candidate
  const [aiGenerating, setAiGenerating] = useState<Record<string, boolean>>({});
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Dismissed candidates state
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        sort,
        verifiedOnly: verifiedOnly ? 'true' : 'false',
      });

      const res = await fetch(`/api/customers/${customerId}/matches?${query.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setCustomer(data.customer);
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Failed to load candidate recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchMatches();
    }
  }, [customerId, sort, verifiedOnly]);

  const toggleExpand = (candidateId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const handleDismiss = (candidateId: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
  };

  const handleRegenerateWithAi = async (candidateId: string) => {
    setAiGenerating(prev => ({ ...prev, [candidateId]: true }));
    setApiNotice(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/matches/ai-explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      const data = await res.json();
      if (res.ok && data.insights) {
        if (data.insights.apiStatus?.status === 'error') {
          setApiNotice(
            data.insights.apiStatus.message ||
              'Gemini API request failed. Reverted to deterministic fallback.'
          );
        }
        setMatches(prev =>
          prev.map(m =>
            m.candidateId === candidateId
              ? {
                  ...m,
                  explanation: data.insights.explanation,
                  introDraft: data.insights.introDraft,
                  explanationSource: data.insights.source,
                  tier: data.insights.tier || m.tier,
                  keySynergies: data.insights.keySynergies || m.keySynergies,
                  frictionPoints: data.insights.frictionPoints || m.frictionPoints,
                  provider: data.insights.provider || m.provider,
                  apiStatus: data.insights.apiStatus,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
    } finally {
      setAiGenerating(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const visibleMatches = matches.filter(m => !dismissedIds.has(m.candidateId));

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: customer ? `${customer.firstName} ${customer.lastName}` : 'Client', href: `/customers/${customerId}` },
        { label: 'Candidate Recommendations' },
      ]}
      activeCustomerId={customerId}
      activeCustomerName={customer ? `${customer.firstName} ${customer.lastName}` : undefined}
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black">
                Matching Engine Console
              </span>
              <Badge variant="outline" className="text-[10px] font-mono bg-zinc-100 text-black border-zinc-200">
                Deterministic 7-Factor Model
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-black mt-1">
              Candidate Recommendations for {customer?.firstName} {customer?.lastName}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Target Profile: {customer?.age}y • {customer?.gender === 'male' ? 'Seeking Female' : 'Seeking Male'} • {customer?.city} • {visibleMatches.length} candidates ranked
            </p>
          </div>

          <Link href={`/customers/${customerId}`}>
            <Button variant="outline" size="sm" className="text-xs border-zinc-300 bg-white text-black hover:bg-zinc-100 h-8 self-start md:self-auto">
              View Full Client Biodata
            </Button>
          </Link>
        </div>

        {/* Filter & Sort Control Toolbar */}
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <button
              onClick={() => setSort('overall')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                sort === 'overall'
                  ? 'bg-black text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Overall Fit (Default)
            </button>
            <button
              onClick={() => setSort('mutual')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                sort === 'mutual'
                  ? 'bg-black text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Mutual Preference Fit
            </button>
            <button
              onClick={() => setSort('completeness')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                sort === 'completeness'
                  ? 'bg-black text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Completeness
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 justify-between sm:justify-end">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-black">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="rounded border-zinc-300 text-black focus:ring-black"
              />
              <span className="font-mono text-[11px]">Verified Only</span>
            </label>

            {dismissedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissedIds(new Set())}
                className="text-[11px] h-7 text-zinc-500 hover:text-black font-mono"
              >
                Restore {dismissedIds.size} Passed
              </Button>
            )}
          </div>
        </div>

        {/* Recommendations List */}
        {apiNotice && (
          <div className="p-4 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs text-zinc-900 flex items-start justify-between gap-3 font-mono">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-black uppercase">Gemini Service Notice:</span>{' '}
                <span className="text-zinc-700">{apiNotice}</span>
                <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Tip: To activate live Gemini reasoning, ensure the Generative Language API is enabled in your Google Cloud Project or create an API key in Google AI Studio (<code className="bg-zinc-200 px-1 py-0.5 rounded text-black">aistudio.google.com</code>). The app seamlessly uses the deterministic engine in the meantime.
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setApiNotice(null)}
              className="text-zinc-500 hover:text-black h-6 w-6 p-0 shrink-0"
            >
              ✕
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-zinc-200">
            <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500">
              Evaluating preference matrix and ranking candidates...
            </p>
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200 p-8 space-y-3">
            <Info className="w-8 h-8 text-zinc-300 mx-auto" />
            <h3 className="font-heading font-bold text-base text-black">No Candidate Recommendations Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No opposite-gender candidates matched active criteria or verification constraints.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setVerifiedOnly(false); setDismissedIds(new Set()); }}
              className="text-xs border-zinc-300"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {visibleMatches.map((match, idx) => {
              const cand = match.candidate!;
              const isExpanded = !!expandedCards[cand.id];
              const isAiGen = !!aiGenerating[cand.id];

              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-2xs hover:border-black transition-all overflow-hidden"
                >
                  {/* Top Bar with Candidate Header & Overall Score */}
                  <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-zinc-100">
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {/* Avatar initials in solid black */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-black text-white font-heading font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-2xs">
                        {cand.firstName[0]}{cand.lastName[0]}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                            #{idx + 1} Recommendation
                          </span>
                          <h2 className="font-heading font-bold text-lg sm:text-xl text-black truncate">
                            {cand.firstName} {cand.lastName}
                          </h2>
                          {match.tier && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-mono ${
                                match.tier.includes('High')
                                  ? 'bg-black text-white border-black'
                                  : match.tier.includes('Strong')
                                  ? 'bg-zinc-800 text-white border-zinc-800'
                                  : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                              }`}
                            >
                              ★ {match.tier}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] font-mono bg-zinc-100 text-zinc-800 border-zinc-300">
                            {cand.verificationStatus === 'verified' ? '✓ Verified' : 'Pending'}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span>{cand.age} yrs</span>
                          <span>•</span>
                          <span>{cand.heightCm} cm</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {cand.city}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-zinc-400" /> {cand.designation} at {cand.currentCompany}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-zinc-400" /> {cand.undergraduateCollege}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Overall Score Dial & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 shrink-0">
                      <div className="text-left md:text-right">
                        <div className="text-2xl sm:text-3xl font-heading font-bold text-black font-mono">
                          {match.overallScore}
                          <span className="text-xs font-mono font-normal text-zinc-400">/100</span>
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-zinc-500">
                          {match.scoreCoverage}% Coverage
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex items-center md:flex-col gap-1.5">
                        <Button
                          onClick={() => setSelectedMatchForSend(match)}
                          size="sm"
                          className="bg-black text-white hover:bg-zinc-800 text-xs font-medium h-8 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Send Match
                        </Button>
                        <Button
                          onClick={() => handleDismiss(cand.id)}
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-7 text-zinc-400 hover:text-black hover:bg-zinc-100"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Pass
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-6 space-y-4 bg-zinc-50/40">
                    {/* Strengths & Conflicts Signals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Positive Signals */}
                      <div className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-black font-mono uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Compatibility Strengths</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {match.strengths.slice(0, 3).map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-zinc-800">
                              <span className="text-black font-bold">•</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Potential Friction Points & Unknowns */}
                      <div className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-700 font-mono uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Friction Points & Unknowns</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {match.potentialConflicts.length > 0 ? (
                            match.potentialConflicts.slice(0, 2).map((c, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-zinc-700">
                                <span className="text-zinc-500 font-bold">•</span>
                                <span>{c}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-zinc-400 italic text-[11px]">No explicit friction points detected.</div>
                          )}
                          {match.unknowns.length > 0 && (
                            <div className="flex items-start gap-1.5 text-zinc-500 text-[11px] pt-1 font-mono">
                              <HelpCircle className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                              <span>Needs check: {match.unknowns[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI / Deterministic Match Rationale Card */}
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span className="text-xs font-bold uppercase font-mono tracking-wider text-black">
                            Matchmaker Rationale & Profile Fit
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono ${
                              match.provider === 'gemini' || (match.explanationSource === 'ai' && match.provider !== 'openai')
                                ? 'bg-black text-white border-black'
                                : match.provider === 'openai'
                                ? 'bg-zinc-800 text-white border-zinc-800'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-300'
                            }`}
                          >
                            {match.provider === 'gemini' || (match.explanationSource === 'ai' && match.provider !== 'openai')
                              ? '✨ Google Gemini'
                              : match.provider === 'openai'
                              ? '✨ OpenAI'
                              : 'Deterministic Engine'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isAiGen}
                          onClick={() => handleRegenerateWithAi(cand.id)}
                          className="text-[11px] h-7 text-black hover:bg-zinc-100 self-start sm:self-auto font-mono"
                        >
                          {isAiGen ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Reasoning with Gemini...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" /> Regenerate with Gemini
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        {match.explanation}
                      </p>
                      {match.keySynergies && match.keySynergies.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100">
                          <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block mb-1">
                            Key Profile Fit Synergies:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {match.keySynergies.map((synergy, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-mono"
                              >
                                ✓ {synergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Collapsible 7-Factor Breakdown */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleExpand(cand.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-black hover:underline font-mono"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Hide 7-Factor Score Breakdown
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> View 7-Factor Score Breakdown
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3.5 p-4 bg-white rounded-xl border border-zinc-200 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {match.factorScores.map(factor => (
                              <div key={factor.factor} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium text-black">
                                    {factor.name} ({factor.weight}%)
                                  </span>
                                  <span className="font-bold text-black font-mono">{factor.score}/100</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-black rounded-full"
                                    style={{ width: `${factor.score}%` }}
                                  />
                                </div>
                                {factor.evidence.length > 0 && (
                                  <p className="text-[10px] text-zinc-500 truncate">
                                    {factor.evidence[0]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Match Introduction Modal */}
      {selectedMatchForSend && customer && (
        <SendMatchModal
          customer={customer}
          match={selectedMatchForSend}
          isOpen={!!selectedMatchForSend}
          onClose={() => setSelectedMatchForSend(null)}
          onSent={() => {
            fetchMatches();
          }}
        />
      )}
    </AppShell>
  );
}
