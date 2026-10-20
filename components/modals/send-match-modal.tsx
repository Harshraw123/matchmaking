'use client';

import React, { useState, useEffect } from 'react';
import { MatchResult, CustomerProfile } from '@/lib/matching/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Send, Loader2, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

interface SendMatchModalProps {
  customer: CustomerProfile;
  match: MatchResult;
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function SendMatchModal({
  customer,
  match,
  isOpen,
  onClose,
  onSent,
}: SendMatchModalProps) {
  const candidate = match.candidate;
  const [message, setMessage] = useState(match.introDraft || '');
  const [loading, setLoading] = useState(false);
  const [generatingIntro, setGeneratingIntro] = useState(false);
  const [introProvider, setIntroProvider] = useState<string>(
    match.provider || (match.explanationSource === 'ai' ? 'gemini' : 'deterministic')
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateIntroWithGemini = async () => {
    if (!candidate) return;
    setGeneratingIntro(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}/matches/ai-explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          action: 'intro',
        }),
      });
      const data = await res.json();
      if (res.ok && data.intro?.introDraft) {
        setMessage(data.intro.introDraft);
        setIntroProvider(data.intro.provider || 'gemini');
      } else {
        setError(data.error || 'Failed to generate introduction with Gemini.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error generating introduction.');
    } finally {
      setGeneratingIntro(false);
    }
  };

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

  if (!isOpen || !candidate) return null;

  const handleSend = async () => {
    if (!message || message.trim().length < 10) {
      setError('Please provide an introduction message with at least 10 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${customer.id}/matches/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          matchRecommendationId: `rec-${customer.id}-${candidate.id}`,
          customMessage: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch introduction.');
      }

      setSuccess(true);
      setTimeout(() => {
        onSent();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending match.');
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
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-heading text-sm">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-black">Dispatch Match Introduction</h2>
              <p className="text-xs text-zinc-500">
                Presenting {candidate.firstName} {candidate.lastName} to {customer.firstName} {customer.lastName}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="text-zinc-400 hover:text-black p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-black">Introduction Dispatched</h3>
              <p className="text-xs text-zinc-500 max-w-md font-mono">
                The introduction record has been logged, status updated to <span className="font-semibold text-black">SENT</span>, and recorded into client history.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-zinc-100 text-black text-xs rounded-xl border border-zinc-300 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-black" />
                  <span>{error}</span>
                </div>
              )}

              {/* Candidate Quick Snapshot */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-black text-white font-heading font-bold flex items-center justify-center text-xs shrink-0">
                    {candidate.firstName[0]}{candidate.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-sm text-black truncate">
                      {candidate.firstName} {candidate.lastName}, {candidate.age}y
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {candidate.designation} • {candidate.city}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-black font-mono">
                    {match.overallScore}% Fit
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono bg-white border-zinc-300 text-black">
                    {candidate.verificationStatus}
                  </Badge>
                </div>
              </div>

              {/* Introduction Message Composer */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-black">
                      Personalized Introduction Message
                    </Label>
                    <Badge variant="outline" className="text-[9px] font-mono bg-zinc-50 text-zinc-600 border-zinc-300">
                      {introProvider === 'gemini' || introProvider === 'openai' ? '✨ AI Draft' : 'Deterministic Draft'}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={generatingIntro || loading}
                    onClick={handleGenerateIntroWithGemini}
                    className="text-[11px] h-6 px-2 text-black hover:bg-zinc-100 font-mono self-start sm:self-auto"
                  >
                    {generatingIntro ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Drafting with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1 text-black" /> Regenerate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={8}
                  className="font-sans text-xs leading-relaxed border-zinc-300 bg-white text-black resize-y p-3 focus:border-black"
                  placeholder="Draft introductory note..."
                />
              </div>

              {/* Demo Notice Banner */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-start gap-2 text-[11px] text-zinc-600">
                <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-black">Demo Dispatch:</span> Persists the introduction record into the client&apos;s timeline and match history. No live external email is transmitted.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 py-3.5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={loading} className="text-xs border-zinc-300 h-9">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading}
              className="bg-black text-white hover:bg-zinc-800 text-xs h-9 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" /> Confirm & Send Intro
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
