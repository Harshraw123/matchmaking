import { TrinaryChoice } from './types';

export function calculateAgeAlignment(
  actualAge: number,
  preferredMin?: number,
  preferredMax?: number
): { score: number; evidence: string; isUnknown: boolean } {
  if (preferredMin === undefined && preferredMax === undefined) {
    return { score: 70, evidence: 'No age constraints specified; applying standard baseline.', isUnknown: true };
  }

  const min = preferredMin ?? 18;
  const max = preferredMax ?? 80;

  if (actualAge >= min && actualAge <= max) {
    return { score: 100, evidence: `Age (${actualAge}) is comfortably within preferred bracket (${min}–${max}).`, isUnknown: false };
  }

  // Grace tolerance within 2 years
  const diff = actualAge < min ? min - actualAge : actualAge - max;
  if (diff <= 2) {
    return { score: 75, evidence: `Age (${actualAge}) is near preferred range (${min}–${max}) by ${diff} year(s).`, isUnknown: false };
  }

  if (diff <= 4) {
    return { score: 45, evidence: `Age (${actualAge}) deviates from preferred range (${min}–${max}) by ${diff} years.`, isUnknown: false };
  }

  return { score: 15, evidence: `Age (${actualAge}) substantially deviates from preferred range (${min}–${max}).`, isUnknown: false };
}

export function calculateLocationAlignment(
  customerCity: string,
  candidateCity: string,
  preferredLocations?: string[]
): { score: number; evidence: string; isUnknown: boolean } {
  const normCustomerCity = customerCity.trim().toLowerCase();
  const normCandidateCity = candidateCity.trim().toLowerCase();

  // If candidate is in preferred locations list
  if (preferredLocations && preferredLocations.length > 0) {
    const normPreferred = preferredLocations.map(l => l.trim().toLowerCase());
    if (normPreferred.includes(normCandidateCity)) {
      return { score: 100, evidence: `Candidate is based in preferred city (${candidateCity}).`, isUnknown: false };
    }
  }

  if (normCustomerCity === normCandidateCity) {
    return { score: 100, evidence: `Both reside in the same city (${candidateCity}).`, isUnknown: false };
  }

  // Metro clusters
  const ncr = ['delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'faridabad'];
  const mumbaiRegion = ['mumbai', 'navi mumbai', 'thane', 'pune'];

  if (ncr.includes(normCustomerCity) && ncr.includes(normCandidateCity)) {
    return { score: 85, evidence: `Both are located within the National Capital Region (${customerCity} & ${candidateCity}).`, isUnknown: false };
  }

  if (mumbaiRegion.includes(normCustomerCity) && mumbaiRegion.includes(normCandidateCity)) {
    return { score: 85, evidence: `Both are located within Western Maharashtra hub (${customerCity} & ${candidateCity}).`, isUnknown: false };
  }

  return { score: 40, evidence: `Reside in different locations (${customerCity} vs ${candidateCity}).`, isUnknown: false };
}

export function calculateTrinaryCompatibility(
  customerChoice?: TrinaryChoice,
  candidateChoice?: TrinaryChoice
): { score: number; evidence: string; isUnknown: boolean } {
  if (!customerChoice || !candidateChoice) {
    return { score: 60, evidence: 'Preference unrecorded or pending confirmation.', isUnknown: true };
  }

  if (customerChoice === candidateChoice) {
    return { score: 100, evidence: `Shared exact stance: "${customerChoice}".`, isUnknown: false };
  }

  if (
    (customerChoice === 'Yes' && candidateChoice === 'Maybe') ||
    (customerChoice === 'Maybe' && candidateChoice === 'Yes')
  ) {
    return { score: 85, evidence: `Favorable alignment ("${customerChoice}" & "${candidateChoice}").`, isUnknown: false };
  }

  if (
    (customerChoice === 'No' && candidateChoice === 'Maybe') ||
    (customerChoice === 'Maybe' && candidateChoice === 'No')
  ) {
    return { score: 65, evidence: `Moderate flexibility ("${customerChoice}" & "${candidateChoice}").`, isUnknown: false };
  }

  // Direct conflict (Yes vs No)
  return { score: 15, evidence: `Divergent viewpoints ("${customerChoice}" vs "${candidateChoice}").`, isUnknown: false };
}

export function calculateSetOverlap(
  listA: string[] = [],
  listB: string[] = []
): { score: number; common: string[]; isUnknown: boolean } {
  if (!listA.length || !listB.length) {
    return { score: 50, common: [], isUnknown: true };
  }

  const setB = new Set(listB.map(s => s.toLowerCase().trim()));
  const common = listA.filter(item => setB.has(item.toLowerCase().trim()));

  const unionSize = new Set([
    ...listA.map(s => s.toLowerCase().trim()),
    ...listB.map(s => s.toLowerCase().trim())
  ]).size;

  const jaccard = unionSize > 0 ? (common.length / unionSize) : 0;
  // Scaled score with a healthy floor if there are matches
  const score = common.length > 0
    ? Math.min(100, Math.round(50 + (common.length * 20) + (jaccard * 30)))
    : 35;

  return { score, common, isUnknown: false };
}
