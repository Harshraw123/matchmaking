'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Senior Matchmaker');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role.trim() || 'Senior Matchmaker',
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please check details.');
      }

      // Successful registration & auto-login
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordLongEnough = password.length >= 8;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-[#09090B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2.5">
        {/* Monogram Crest in Pitch Black */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-heading text-xl font-bold shadow-md tracking-wider">
          TDC
        </div>
        <h1 className="font-heading font-bold text-2xl tracking-tight text-black">
          The Date Crew
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 font-semibold">
          Operator Registration
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="font-heading font-bold text-base text-black">Create Operator Account</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Provision credentials for client discovery and algorithmic matching.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-zinc-100 text-black text-xs rounded-xl border border-zinc-300 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-black mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Harsh Rawat"
                  required
                  autoFocus
                  className="pl-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Work Email</Label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@thedatecrew.com"
                  required
                  className="pl-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
              </div>
            </div>

            {/* Role Title */}
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Operational Role</Label>
              <div className="relative mt-1.5">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 text-xs border border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50 text-black outline-none"
                >
                  <option value="Lead Matchmaker">Lead Matchmaker</option>
                  <option value="Senior Matchmaker">Senior Matchmaker</option>
                  <option value="Associate Matchmaker">Associate Matchmaker</option>
                  <option value="Operations Director">Operations Director</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="pl-9 pr-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <CheckCircle2
                    className={`w-3 h-3 ${isPasswordLongEnough ? 'text-emerald-600' : 'text-zinc-300'}`}
                  />
                  <span>8+ characters</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-xs font-semibold text-zinc-700">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="pl-9 pr-9 text-xs border-zinc-300 focus:border-black focus:ring-black h-10 rounded-lg bg-zinc-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <CheckCircle2
                    className={`w-3 h-3 ${doPasswordsMatch ? 'text-emerald-600' : 'text-zinc-300'}`}
                  />
                  <span>Passwords match</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 text-xs font-medium h-10 rounded-lg shadow-sm transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning Account...
                </>
              ) : (
                'Create Account & Enter Workspace'
              )}
            </Button>
          </form>

          {/* Link to login */}
          <div className="pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Already registered as an operator?{' '}
              <Link
                href="/login"
                className="font-semibold text-black hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400 font-mono">
          The Date Crew (TDC) • Matrimonial Operations Platform
        </p>
      </div>
    </div>
  );
}
