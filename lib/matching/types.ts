export type Gender = 'male' | 'female';
export type TrinaryChoice = 'Yes' | 'No' | 'Maybe';
export type VerificationStatus = 'verified' | 'pending_review' | 'unverified';
export type JourneyStage = 
  | 'onboarding'
  | 'profile_review'
  | 'ready_for_matches'
  | 'active_matching'
  | 'in_discussion'
  | 'matched';

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string; // ISO YYYY-MM-DD
  age: number;
  country: string;
  city: string;
  heightCm: number;
  email: string;
  phone: string;
  maritalStatus: 'Never Married' | 'Divorced' | 'Widowed' | 'Awaiting Divorce';
  
  // Education & Career
  educationLevel: string;
  undergraduateCollege: string;
  degree: string;
  currentCompany: string;
  designation: string;
  annualIncomeRange: string;
  annualIncomeMin: number;
  annualIncomeMax: number;
  
  // Family & Background (Sensitive attributes optional & isolated)
  languagesKnown: string[];
  siblingsCount: number;
  siblingsDetails?: string;
  religion?: string;
  caste?: string;
  
  // Lifestyle & Values
  wantChildren: TrinaryChoice;
  openToRelocation: TrinaryChoice;
  openToPets: TrinaryChoice;
  dietaryPreference?: string;
  hobbies: string[];
  relationshipGoals: string;
  personalValues: string[];
  workArrangement: 'Remote' | 'Hybrid' | 'On-site';
  familyInvolvement: 'High' | 'Moderate' | 'Low';
  
  // Operational
  verificationStatus: VerificationStatus;
  profileCompleteness: number; // 0 - 100
  journeyStage: JourneyStage;
  assignedMatchmakerId?: string;
  consentToShare: boolean;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  avatarUrl?: string;
  notesCount?: number;
  createdAt: string;
}

export interface PartnerPreferences {
  id: string;
  customerId: string;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  preferredLocations?: string[];
  preferredEducation?: string[];
  preferredProfessions?: string[];
  preferredHeightMinCm?: number;
  preferredHeightMaxCm?: number;
  preferredIncomeMin?: number;
  preferredChildren?: TrinaryChoice[];
  preferredRelocation?: TrinaryChoice[];
  preferredDietary?: string[];
  preferredLanguages?: string[];
  otherRequirements?: string;
  nonNegotiables?: string[];
}

export type FactorKey = 
  | 'mutualPreferences'
  | 'childrenAndValues'
  | 'lifestyleAndInterests'
  | 'careerAndEducation'
  | 'relocationAndLocation'
  | 'languageCompatibility'
  | 'profileCompletenessAndVerification';

export interface FactorScore {
  factor: FactorKey;
  name: string;
  score: number; // 0 - 100
  weight: number; // Configured weight (e.g. 30, 20, 15...)
  applicable: boolean;
  evidence: string[];
  conflicts: string[];
  unknowns: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface MatchResult {
  customerId: string;
  candidateId: string;
  overallScore: number; // 0 - 100
  scoreCoverage: number; // 0 - 100
  factorScores: FactorScore[];
  strengths: string[];
  potentialConflicts: string[];
  unknowns: string[];
  eligibilityReasons: string[];
  explanationSource: 'deterministic' | 'ai';
  tier?: string; // e.g. "High Potential Match" | "Strong Compatibility" | "Moderate Fit"
  keySynergies?: string[];
  frictionPoints?: string[];
  explanation?: string;
  introDraft?: string;
  candidate?: CustomerProfile;
  provider?: 'gemini' | 'openai' | 'deterministic';
  apiStatus?: {
    configured: boolean;
    provider: string;
    status: 'active' | 'error' | 'offline';
    message?: string;
  };
}

export interface MatchingConfig {
  requireOppositeGender?: boolean;
  requireVerifiedCandidates?: boolean;
  weights: {
    mutualPreferences: number;
    childrenAndValues: number;
    lifestyleAndInterests: number;
    careerAndEducation: number;
    relocationAndLocation: number;
    languageCompatibility: number;
    profileCompletenessAndVerification: number;
  };
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  requireOppositeGender: true,
  requireVerifiedCandidates: false, // unverified are eligible but score lower completeness
  weights: {
    mutualPreferences: 30,
    childrenAndValues: 20,
    lifestyleAndInterests: 15,
    careerAndEducation: 15,
    relocationAndLocation: 10,
    languageCompatibility: 5,
    profileCompletenessAndVerification: 5,
  },
};
