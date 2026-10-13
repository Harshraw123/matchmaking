'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFillDemo = () => {
    setEmail('matchmaker@thedatecrew.com');
    setPassword('Matchmaker@2026!');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 text-[#09090B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2.5">
        {/* Monogram Crest in Pitch Black */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-heading text-xl font-bold shadow-md tracking-wider">
          TDC
        </div>
        <h1 className="font-heading font-bold text-2xl tracking-tight text-black">
          The Date Crew
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 font-semibold">
          Matchmaker Workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="font-heading font-bold text-base text-black">Internal Operator Login</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Access verified matrimonial candidates and scoring engine.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-zinc-100 text-black text-xs rounded-xl border border-zinc-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Work Email</Label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="matchmaker@thedatecrew.com"
                  required
                  className="pl-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-700">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pl-9 pr-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 text-xs font-medium h-10 rounded-lg shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                'Sign In to Workspace'
              )}
            </Button>
          </form>

          {/* Link to Sign Up */}
          <div className="pt-2 text-center">
            <p className="text-xs text-zinc-500">
              Need an operator account?{' '}
              <Link
                href="/sign-up"
                className="font-semibold text-black hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Demo Account Quick-Fill Card */}
          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Demo Account
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillDemo}
                className="text-[11px] h-7 bg-zinc-100 text-black border-zinc-300 hover:bg-zinc-200"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Autofill Demo Account
              </Button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 font-mono space-y-1">
              <div><strong className="text-black font-semibold">User:</strong> matchmaker@thedatecrew.com</div>
              <div><strong className="text-black font-semibold">Pass:</strong> Matchmaker@2026!</div>
              <div><strong className="text-black font-semibold">Role:</strong> Lead Matchmaker</div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400 font-mono">
          The Date Crew (TDC) • Matrimonial Operations Platform
        </p>
      </div>
    </div>
  );
}
