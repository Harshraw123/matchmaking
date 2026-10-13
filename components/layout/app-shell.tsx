'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  HeartHandshake,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  activeCustomerId?: string;
  activeCustomerName?: string;
}

export function AppShell({
  children,
  breadcrumbs = [],
  activeCustomerId,
  activeCustomerName,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navLinks = [
    {
      name: 'Operations Dashboard',
      href: '/dashboard',
      icon: Layers,
      active: pathname === '/dashboard',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row text-[#09090B]">
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-serif font-bold text-xs tracking-wider shadow-xs">
            TDC
          </div>
          <div>
            <span className="font-serif font-bold text-sm tracking-tight text-black block leading-none">The Date Crew</span>
            <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 block mt-0.5">Workspace</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-zinc-900 hover:bg-zinc-100 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-20 h-screen w-72 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-in-out shadow-lg md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Monogram Area */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-serif font-bold text-sm tracking-wider shadow-xs">
              TDC
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-black tracking-tight leading-none">The Date Crew</div>
              <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mt-1">
                Matchmaker Suite
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-zinc-400 hover:text-black"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Links Area */}
        <div className="flex-1 px-3.5 py-5 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase font-mono text-zinc-400">
              Navigation
            </div>
            <nav className="space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      link.active
                        ? 'bg-black text-white shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Active Profile Context Section */}
          {activeCustomerId && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase font-mono text-zinc-400">
                Active Client
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-black truncate max-w-[150px]">
                    {activeCustomerName || 'Selected Client'}
                  </span>
                  <Badge variant="outline" className="text-[9px] bg-black text-white border-black font-mono shrink-0">
                    Active
                  </Badge>
                </div>
                <div className="space-y-1 pt-0.5">
                  <Link
                    href={`/customers/${activeCustomerId}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === `/customers/${activeCustomerId}`
                        ? 'bg-white text-black font-semibold shadow-2xs border border-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Full Biodata
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                  <Link
                    href={`/customers/${activeCustomerId}/matches`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === `/customers/${activeCustomerId}/matches`
                        ? 'bg-black text-white font-semibold shadow-xs'
                        : 'text-black bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HeartHandshake className="w-3.5 h-3.5" /> Matches
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* System Status Block */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-black font-mono">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Matching Engine</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Deterministic 7-factor algorithms with Google Gemini & offline fallback.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 font-mono pt-0.5">
              <CheckCircle2 className="w-3 h-3 text-black" /> 116 Profiles Ingested
            </div>
          </div>
        </div>

        {/* User Account Footer Card */}
        <div className="p-3.5 border-t border-zinc-100 bg-zinc-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {user?.name ? user.name[0] : 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-black truncate">
                  {user?.name || 'Matchmaker'}
                </div>
                <div className="text-[10px] text-zinc-500 truncate font-mono">
                  {user?.role || 'Lead Operator'}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-black hover:bg-zinc-200/60 p-1.5 rounded-lg shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-zinc-200">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Link href="/dashboard" className="hover:text-black transition-colors font-mono uppercase text-[10px]">
              TDC Workspace
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-black transition-colors truncate max-w-[160px]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-black font-semibold truncate max-w-[200px]">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 bg-zinc-50 text-zinc-600">
              STATUS: ONLINE
            </Badge>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
