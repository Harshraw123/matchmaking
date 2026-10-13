import { CustomerProfile, PartnerPreferences, MatchResult } from '../matching/types';
import { generateSyntheticDataset, SyntheticDataset } from '../data/synthetic';

// Singleton in-memory persistent store for development & demo mode
class MatchmakerStore {
  private data: SyntheticDataset;
  private recommendations: Map<string, MatchResult[]>; // keyed by customerId

  constructor() {
    this.data = generateSyntheticDataset();
    this.recommendations = new Map();
  }

  // --- Auth / Matchmakers ---
  getMatchmakerByEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    return this.data.matchmakers.find(m => m.email.toLowerCase() === cleanEmail) || null;
  }

  getMatchmakerById(id: string) {
    return this.data.matchmakers.find(m => m.id === id) || null;
  }

  addMatchmaker(data: {
    id?: string;
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
  }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = this.getMatchmakerByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newMatchmaker = {
      id: data.id || `mm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role: data.role || 'Senior Matchmaker',
      createdAt: new Date().toISOString(),
    };

    this.data.matchmakers.push(newMatchmaker);
    return newMatchmaker;
  }

  // --- Customers ---
  getAllCustomers(filters?: {
    search?: string;
    journeyStage?: string;
    city?: string;
    gender?: string;
    maritalStatus?: string;
    verificationStatus?: string;
    sortBy?: 'name' | 'age' | 'completeness' | 'lastContacted';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) {
    let list = [...this.data.customers];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        c.currentCompany.toLowerCase().includes(q)
      );
    }

    if (filters?.journeyStage && filters.journeyStage !== 'all') {
      list = list.filter(c => c.journeyStage === filters.journeyStage);
    }

    if (filters?.city && filters.city !== 'all') {
      list = list.filter(c => c.city.toLowerCase() === filters.city!.toLowerCase());
    }

    if (filters?.gender && filters.gender !== 'all') {
      list = list.filter(c => c.gender === filters.gender);
    }

    if (filters?.maritalStatus && filters.maritalStatus !== 'all') {
      list = list.filter(c => c.maritalStatus === filters.maritalStatus);
    }

    if (filters?.verificationStatus && filters.verificationStatus !== 'all') {
      list = list.filter(c => c.verificationStatus === filters.verificationStatus);
    }

    // Sorting
    const sortField = filters?.sortBy || 'name';
    const sortAsc = (filters?.sortOrder || 'asc') === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === 'age') {
        cmp = a.age - b.age;
      } else if (sortField === 'completeness') {
        cmp = a.profileCompleteness - b.profileCompleteness;
      } else if (sortField === 'lastContacted') {
        const da = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const db = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        cmp = da - db;
      }
      return sortAsc ? cmp : -cmp;
    });

    const total = list.length;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    return {
      customers: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  getCustomerById(id: string): CustomerProfile | null {
    const cust = this.data.customers.find(c => c.id === id);
    if (!cust) return null;
    const notesCount = this.data.notes.filter(n => n.customerId === id).length;
    return { ...cust, notesCount };
  }

  updateCustomer(id: string, updates: Partial<CustomerProfile>): CustomerProfile | null {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = this.data.customers[index];
    const updated = {
      ...existing,
      ...updates,
      id, // protect id
    };

    this.data.customers[index] = updated;
    return updated;
  }

  // --- Partner Preferences ---
  getPartnerPreferences(customerId: string): PartnerPreferences | null {
    return this.data.preferences.find(p => p.customerId === customerId) || null;
  }

  getAllPreferencesMap(): Map<string, PartnerPreferences> {
    const map = new Map<string, PartnerPreferences>();
    for (const p of this.data.preferences) {
      map.set(p.customerId, p);
    }
    return map;
  }

  updatePartnerPreferences(customerId: string, updates: Partial<PartnerPreferences>): PartnerPreferences {
    const index = this.data.preferences.findIndex(p => p.customerId === customerId);
    if (index !== -1) {
      const updated = { ...this.data.preferences[index], ...updates };
      this.data.preferences[index] = updated;
      return updated;
    }

    const created: PartnerPreferences = {
      id: `pref-${customerId}`,
      customerId,
      ...updates,
    };
    this.data.preferences.push(created);
    return created;
  }

  // --- Notes & Follow-ups ---
  getCustomerNotes(customerId: string) {
    return this.data.notes
      .filter(n => n.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addCustomerNote(note: {
    customerId: string;
    matchmakerId: string;
    matchmakerName: string;
    noteText: string;
    category?: 'Call' | 'Meeting' | 'Follow-up' | 'General';
    nextFollowUpDate?: string;
  }) {
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customerId: note.customerId,
      matchmakerId: note.matchmakerId,
      matchmakerName: note.matchmakerName,
      noteText: note.noteText,
      category: note.category || 'General',
      nextFollowUpDate: note.nextFollowUpDate,
      createdAt: new Date().toISOString(),
    };

    this.data.notes.push(newNote);

    // Update customer's last contacted & next follow-up dates
    this.updateCustomer(note.customerId, {
      lastContactedAt: new Date().toISOString(),
      ...(note.nextFollowUpDate ? { nextFollowUpDate: note.nextFollowUpDate } : {}),
    });

    return newNote;
  }

  // --- Match Recommendations & Introductions ---
  getMatchRecommendations(customerId: string): MatchResult[] {
    return this.recommendations.get(customerId) || [];
  }

  saveMatchRecommendations(customerId: string, recs: MatchResult[]) {
    this.recommendations.set(customerId, recs);
  }

  getIntroductions(customerId: string) {
    return this.data.introductions.filter(i => i.customerId === customerId);
  }

  getAllIntroducedCandidateIds(customerId: string): Set<string> {
    const set = new Set<string>();
    for (const intro of this.data.introductions) {
      if (intro.customerId === customerId) {
        set.add(intro.candidateId);
      }
    }
    return set;
  }

  sendMatchIntroduction(data: {
    customerId: string;
    candidateId: string;
    matchRecommendationId?: string;
    customMessage: string;
    sentByMatchmakerId: string;
  }) {
    // Check if already introduced
    const existing = this.data.introductions.find(
      i => i.customerId === data.customerId && i.candidateId === data.candidateId
    );

    if (existing) {
      throw new Error('An introduction has already been dispatched to this candidate.');
    }

    const newIntro = {
      id: `intro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customerId: data.customerId,
      candidateId: data.candidateId,
      matchRecommendationId: data.matchRecommendationId,
      customMessage: data.customMessage,
      sentByMatchmakerId: data.sentByMatchmakerId,
      sentAt: new Date().toISOString(),
      status: 'sent' as const,
    };

    this.data.introductions.push(newIntro);

    // Automatically create a corresponding note for accountability
    const candidate = this.getCustomerById(data.candidateId);
    const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate';
    this.addCustomerNote({
      customerId: data.customerId,
      matchmakerId: data.sentByMatchmakerId,
      matchmakerName: 'Matchmaker',
      noteText: `Match introduction dispatched for ${candidateName} (${data.candidateId}). Message sent.`,
      category: 'General',
    });

    return newIntro;
  }

  // --- Operational Metrics ---
  getOperationalMetrics() {
    const all = this.data.customers;
    const now = new Date();

    const totalAssignedCustomers = all.filter(c => c.assignedMatchmakerId).length;
    const verifiedProfiles = all.filter(c => c.verificationStatus === 'verified').length;
    const profilesAwaitingReview = all.filter(c => c.verificationStatus === 'pending_review').length;
    const readyForMatches = all.filter(c => c.journeyStage === 'ready_for_matches').length;
    const pendingIntroductions = this.data.introductions.filter(i => i.status === 'sent').length;
    const upcomingFollowUps = all.filter(c => c.nextFollowUpDate && new Date(c.nextFollowUpDate) >= now).length;

    return {
      totalAssignedCustomers,
      verifiedProfiles,
      profilesAwaitingReview,
      readyForMatches,
      pendingIntroductions,
      upcomingFollowUps,
    };
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { matchmakerStore?: MatchmakerStore };
export const store = globalForStore.matchmakerStore || new MatchmakerStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.matchmakerStore = store;
}
