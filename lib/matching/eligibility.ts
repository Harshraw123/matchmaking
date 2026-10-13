import { CustomerProfile, PartnerPreferences, EligibilityResult, MatchingConfig } from './types';

export interface EligibilityContext {
  customer: CustomerProfile;
  customerPrefs?: PartnerPreferences;
  candidate: CustomerProfile;
  candidatePrefs?: PartnerPreferences;
  config?: MatchingConfig;
  alreadyIntroducedIds?: Set<string>;
}

export function checkEligibility(context: EligibilityContext): EligibilityResult {
  const {
    customer,
    customerPrefs,
    candidate,
    candidatePrefs,
    config,
    alreadyIntroducedIds = new Set(),
  } = context;

  const reasons: string[] = [];

  // 1. Cannot match with oneself
  if (customer.id === candidate.id) {
    return {
      eligible: false,
      reasons: ['Candidate is the same customer.'],
    };
  }

  // 2. Opposite-gender constraint
  const requireOpposite = config?.requireOppositeGender ?? true;
  if (requireOpposite && customer.gender === candidate.gender) {
    return {
      eligible: false,
      reasons: [`Candidate gender (${candidate.gender}) does not satisfy opposite-gender matchmaking criteria.`],
    };
  }

  // 3. Duplicate introductions prevention
  if (alreadyIntroducedIds.has(candidate.id)) {
    return {
      eligible: false,
      reasons: ['An active match introduction has already been initiated with this candidate.'],
    };
  }

  // 4. Candidate match lifecycle check (e.g., if candidate is already matched or married)
  if (candidate.journeyStage === 'matched') {
    return {
      eligible: false,
      reasons: ['Candidate has already been successfully matched.'],
    };
  }

  // 5. Configurable verification constraint
  if (config?.requireVerifiedCandidates && candidate.verificationStatus !== 'verified') {
    return {
      eligible: false,
      reasons: ['Candidate profile is awaiting verification review.'],
    };
  }

  // 6. Explicit Non-negotiable Conflicts
  const customerNonNegotiables = (customerPrefs?.nonNegotiables || []).map(n => n.toLowerCase());

  // Check Non-negotiable: Children
  if (customerNonNegotiables.some(n => n.includes('children') || n.includes('kids'))) {
    if (customer.wantChildren === 'Yes' && candidate.wantChildren === 'No') {
      reasons.push('Candidate does not want children, violating customer non-negotiable preference.');
    } else if (customer.wantChildren === 'No' && candidate.wantChildren === 'Yes') {
      reasons.push('Candidate wants children, violating customer non-negotiable preference.');
    }
  }

  // Check Non-negotiable: Relocation
  if (customerNonNegotiables.some(n => n.includes('relocation') || n.includes('location'))) {
    if (customer.city !== candidate.city && customer.openToRelocation === 'No' && candidate.openToRelocation === 'No') {
      reasons.push('Both candidates reside in different cities and refuse relocation, violating location constraint.');
    }
  }

  // Check Non-negotiable: Dietary
  if (customerNonNegotiables.some(n => n.includes('vegetarian') || n.includes('veg'))) {
    if (candidate.dietaryPreference && !candidate.dietaryPreference.toLowerCase().includes('veg')) {
      reasons.push('Candidate dietary preference violates customer non-negotiable dietary requirement.');
    }
  }

  // Check Hard Age bounds if customer explicitly defined age preferences with non-negotiable flag
  if (customerNonNegotiables.some(n => n.includes('age'))) {
    if (customerPrefs?.preferredAgeMin && candidate.age < customerPrefs.preferredAgeMin) {
      reasons.push(`Candidate age (${candidate.age}) is below non-negotiable minimum (${customerPrefs.preferredAgeMin}).`);
    }
    if (customerPrefs?.preferredAgeMax && candidate.age > customerPrefs.preferredAgeMax) {
      reasons.push(`Candidate age (${candidate.age}) exceeds non-negotiable maximum (${customerPrefs.preferredAgeMax}).`);
    }
  }

  // Reciprocal non-negotiable check: Candidate's non-negotiables
  const candidateNonNegotiables = (candidatePrefs?.nonNegotiables || []).map(n => n.toLowerCase());
  if (candidateNonNegotiables.some(n => n.includes('children') || n.includes('kids'))) {
    if (candidate.wantChildren === 'Yes' && customer.wantChildren === 'No') {
      reasons.push('Customer does not want children, violating candidate non-negotiable preference.');
    } else if (candidate.wantChildren === 'No' && customer.wantChildren === 'Yes') {
      reasons.push('Customer wants children, violating candidate non-negotiable preference.');
    }
  }

  if (reasons.length > 0) {
    return {
      eligible: false,
      reasons,
    };
  }

  return {
    eligible: true,
    reasons: ['Passed all eligibility criteria.'],
  };
}
