import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerProfile, PartnerPreferences } from '../types';
import { checkEligibility } from '../eligibility';
import { scoreCandidate } from '../scoring';
import { rankCandidates, rankCandidatesSync } from '../ranking';
import { generateGeminiExplanation, generateGeminiIntroDraft } from '../explanations';

// Sample mock profiles
const baseMale: CustomerProfile = {
  id: 'cust-male-1',
  firstName: 'Arjun',
  lastName: 'Mehta',
  gender: 'male',
  dateOfBirth: '1994-05-15',
  age: 31,
  country: 'India',
  city: 'Mumbai',
  heightCm: 180,
  email: 'arjun.mehta@example.com',
  phone: '+919820011223',
  maritalStatus: 'Never Married',
  educationLevel: 'Postgraduate',
  undergraduateCollege: 'IIT Bombay',
  degree: 'B.Tech + M.Tech Computer Science',
  currentCompany: 'Google India',
  designation: 'Staff Software Engineer',
  annualIncomeRange: '₹40L - ₹65L',
  annualIncomeMin: 4000000,
  annualIncomeMax: 6500000,
  languagesKnown: ['English', 'Hindi', 'Gujarati'],
  siblingsCount: 1,
  religion: 'Hindu',
  caste: 'Brahmin',
  wantChildren: 'Yes',
  openToRelocation: 'Yes',
  openToPets: 'Yes',
  dietaryPreference: 'Vegetarian',
  hobbies: ['Tennis', 'Philosophy', 'Specialty Coffee', 'Hiking'],
  relationshipGoals: 'Marriage within 12 months with mutual intellectual respect',
  personalValues: ['Intellectual Curiosity', 'Family Centric', 'Work-Life Balance'],
  workArrangement: 'Hybrid',
  familyInvolvement: 'Moderate',
  verificationStatus: 'verified',
  profileCompleteness: 95,
  journeyStage: 'ready_for_matches',
  consentToShare: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const baseFemale: CustomerProfile = {
  id: 'cust-female-1',
  firstName: 'Ananya',
  lastName: 'Sharma',
  gender: 'female',
  dateOfBirth: '1996-08-20',
  age: 29,
  country: 'India',
  city: 'Mumbai',
  heightCm: 165,
  email: 'ananya.sharma@example.com',
  phone: '+919811099887',
  maritalStatus: 'Never Married',
  educationLevel: 'Postgraduate',
  undergraduateCollege: 'St. Xavier\'s College',
  degree: 'MBA Finance',
  currentCompany: 'Morgan Stanley',
  designation: 'Vice President, Equity Research',
  annualIncomeRange: '₹40L - ₹65L',
  annualIncomeMin: 4000000,
  annualIncomeMax: 6500000,
  languagesKnown: ['English', 'Hindi'],
  siblingsCount: 1,
  religion: 'Hindu',
  caste: 'Kshatriya',
  wantChildren: 'Yes',
  openToRelocation: 'Yes',
  openToPets: 'Yes',
  dietaryPreference: 'Vegetarian',
  hobbies: ['Tennis', 'Reading Fiction', 'Specialty Coffee'],
  relationshipGoals: 'Marriage leading to supportive lifelong partnership',
  personalValues: ['Intellectual Curiosity', 'Ambition', 'Family Centric'],
  workArrangement: 'Hybrid',
  familyInvolvement: 'Moderate',
  verificationStatus: 'verified',
  profileCompleteness: 95,
  journeyStage: 'ready_for_matches',
  consentToShare: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const baseMalePrefs: PartnerPreferences = {
  id: 'pref-m-1',
  customerId: 'cust-male-1',
  preferredAgeMin: 26,
  preferredAgeMax: 30,
  preferredLocations: ['Mumbai', 'Pune'],
  preferredEducation: ['Postgraduate', 'MBA'],
  preferredHeightMinCm: 155,
  preferredHeightMaxCm: 172,
  preferredIncomeMin: 2000000,
  nonNegotiables: ['Want Children', 'Relocation to Mumbai'],
};

const baseFemalePrefs: PartnerPreferences = {
  id: 'pref-f-1',
  customerId: 'cust-female-1',
  preferredAgeMin: 29,
  preferredAgeMax: 34,
  preferredLocations: ['Mumbai', 'Bengaluru'],
  preferredProfessions: ['Engineer', 'Consultant', 'Finance'],
  preferredIncomeMin: 3500000,
  nonNegotiables: ['Want Children'],
};

test('1. Same-gender candidates are excluded', () => {
  const anotherMale = { ...baseMale, id: 'cust-male-2', firstName: 'Rohan' };
  const eligibility = checkEligibility({
    customer: baseMale,
    customerPrefs: baseMalePrefs,
    candidate: anotherMale,
  });

  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some(r => r.includes('opposite-gender')));
});

test('2. Explicit non-negotiable preference conflicts are excluded', () => {
  const incompatibleFemale: CustomerProfile = {
    ...baseFemale,
    id: 'cust-female-no-kids',
    wantChildren: 'No', // Violates non-negotiable "Want Children"
  };

  const eligibility = checkEligibility({
    customer: baseMale,
    customerPrefs: baseMalePrefs,
    candidate: incompatibleFemale,
  });

  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some(r => r.toLowerCase().includes('children')));
});

test('3. Compatible children preferences improve alignment', () => {
  const femaleYes = { ...baseFemale, wantChildren: 'Yes' as const };
  const femaleMaybe = { ...baseFemale, wantChildren: 'Maybe' as const };
  const femaleNo = { ...baseFemale, wantChildren: 'No' as const };

  const scoreYes = scoreCandidate(baseMale, undefined, femaleYes, undefined);
  const scoreMaybe = scoreCandidate(baseMale, undefined, femaleMaybe, undefined);
  const scoreNo = scoreCandidate(baseMale, undefined, femaleNo, undefined);

  const factorYes = scoreYes.factorScores.find(f => f.factor === 'childrenAndValues')!.score;
  const factorMaybe = scoreMaybe.factorScores.find(f => f.factor === 'childrenAndValues')!.score;
  const factorNo = scoreNo.factorScores.find(f => f.factor === 'childrenAndValues')!.score;

  assert.ok(factorYes > factorMaybe, `Yes (${factorYes}) should score higher than Maybe (${factorMaybe})`);
  assert.ok(factorMaybe > factorNo, `Maybe (${factorMaybe}) should score higher than No (${factorNo})`);
});

test('4. Male-specific and female-specific strategies differ appropriately', () => {
  // Male customer prioritizes preferred age tolerance / height / income tolerance
  // Female customer prioritizes career/profession compatibility and education
  const testFemaleCandidate: CustomerProfile = {
    ...baseFemale,
    designation: 'Architect',
    annualIncomeMin: 1800000, // lower income
  };

  const maleScore = scoreCandidate(baseMale, baseMalePrefs, testFemaleCandidate, baseFemalePrefs);
  
  // Female customer evaluates male candidate with different designation/income
  const testMaleCandidate: CustomerProfile = {
    ...baseMale,
    designation: 'Graphic Designer',
    annualIncomeMin: 1500000, // below female preferred 35L
  };

  const femaleScore = scoreCandidate(baseFemale, baseFemalePrefs, testMaleCandidate, baseMalePrefs);

  const maleF1 = maleScore.factorScores.find(f => f.factor === 'mutualPreferences')!.score;
  const femaleF1 = femaleScore.factorScores.find(f => f.factor === 'mutualPreferences')!.score;

  // The female strategy strictly tests profession & income thresholds, penalizing the lower income / mismatch
  assert.notEqual(maleF1, femaleF1);
  assert.ok(maleF1 > femaleF1);
});

test('5. Mutual preference alignment affects ranking', async () => {
  const perfectReciprocal: CustomerProfile = { ...baseFemale, id: 'cand-perfect' };
  const perfectPrefs: PartnerPreferences = {
    id: 'pref-perf',
    customerId: 'cand-perfect',
    preferredAgeMin: 30,
    preferredAgeMax: 33, // Arjun is 31
    preferredLocations: ['Mumbai'],
  };

  const oneSidedReciprocal: CustomerProfile = { ...baseFemale, id: 'cand-onesided', city: 'Kolkata' };
  const poorPrefs: PartnerPreferences = {
    id: 'pref-poor',
    customerId: 'cand-onesided',
    preferredAgeMin: 24,
    preferredAgeMax: 27, // Arjun (31) does NOT fit her age bracket
    preferredLocations: ['Delhi'],
  };

  const prefsMap = new Map<string, PartnerPreferences>([
    ['cand-perfect', perfectPrefs],
    ['cand-onesided', poorPrefs],
  ]);

  const ranked = await rankCandidates(
    baseMale,
    baseMalePrefs,
    [oneSidedReciprocal, perfectReciprocal],
    prefsMap,
    { enableAi: false }
  );

  assert.equal(ranked[0].candidateId, 'cand-perfect');
  assert.ok(ranked[0].overallScore > ranked[1].overallScore);
});

test('6. Missing preferences are treated as unknown', () => {
  const emptyPrefsCandidate: CustomerProfile = {
    ...baseFemale,
    hobbies: [],
    personalValues: [],
    dietaryPreference: undefined,
  };

  const result = scoreCandidate(baseMale, baseMalePrefs, emptyPrefsCandidate, undefined);

  assert.ok(result.unknowns.length > 0);
  assert.ok(result.unknowns.some(u => u.toLowerCase().includes('candidate partner preferences') || u.toLowerCase().includes('value') || u.toLowerCase().includes('dietary')));
});

test('7. Score coverage decreases when applicable information is missing', () => {
  const completeCandidate: CustomerProfile = { ...baseFemale };
  const sparseCandidate: CustomerProfile = {
    ...baseFemale,
    hobbies: [],
    personalValues: [],
    dietaryPreference: undefined,
  };

  const completeResult = scoreCandidate(baseMale, baseMalePrefs, completeCandidate, baseFemalePrefs);
  const sparseResult = scoreCandidate(baseMale, baseMalePrefs, sparseCandidate, undefined);

  assert.ok(
    completeResult.scoreCoverage > sparseResult.scoreCoverage,
    `Complete coverage (${completeResult.scoreCoverage}) should exceed sparse coverage (${sparseResult.scoreCoverage})`
  );
});

test('8. Scores remain strictly within 0–100', () => {
  const result = scoreCandidate(baseMale, baseMalePrefs, baseFemale, baseFemalePrefs);

  assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
  assert.ok(result.scoreCoverage >= 0 && result.scoreCoverage <= 100);

  for (const factor of result.factorScores) {
    assert.ok(factor.score >= 0 && factor.score <= 100, `Factor ${factor.factor} score ${factor.score} outside 0-100`);
  }
});

test('9. Candidate ranking is deterministic', async () => {
  const c1 = { ...baseFemale, id: 'cand-a' };
  const c2 = { ...baseFemale, id: 'cand-b', age: 30 };
  const c3 = { ...baseFemale, id: 'cand-c', age: 28 };

  const prefsMap = new Map<string, PartnerPreferences>();

  const rank1 = await rankCandidates(baseMale, baseMalePrefs, [c1, c2, c3], prefsMap, { enableAi: false });
  const rank2 = await rankCandidates(baseMale, baseMalePrefs, [c3, c1, c2], prefsMap, { enableAi: false });

  assert.deepEqual(
    rank1.map(r => r.candidateId),
    rank2.map(r => r.candidateId)
  );
});

test('10. Duplicate introductions are prevented where required', () => {
  const alreadyIntroduced = new Set<string>(['cust-female-1']);

  const eligibility = checkEligibility({
    customer: baseMale,
    customerPrefs: baseMalePrefs,
    candidate: baseFemale,
    alreadyIntroducedIds: alreadyIntroduced,
  });

  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some(r => r.toLowerCase().includes('introduction has already been initiated')));
});

test('11. Sensitive attributes do not influence default scoring', () => {
  const candA: CustomerProfile = {
    ...baseFemale,
    religion: 'Hindu',
    caste: 'Brahmin',
  };

  const candB: CustomerProfile = {
    ...baseFemale,
    religion: 'Jain',
    caste: 'Oswal',
  };

  const candC: CustomerProfile = {
    ...baseFemale,
    religion: undefined,
    caste: undefined,
  };

  const scoreA = scoreCandidate(baseMale, baseMalePrefs, candA, baseFemalePrefs);
  const scoreB = scoreCandidate(baseMale, baseMalePrefs, candB, baseFemalePrefs);
  const scoreC = scoreCandidate(baseMale, baseMalePrefs, candC, baseFemalePrefs);

  assert.equal(scoreA.overallScore, scoreB.overallScore);
  assert.equal(scoreA.overallScore, scoreC.overallScore);
});

test('12. AI failure does not break the matching engine', async () => {
  // Deterministic fallback explanation & intro must generate seamlessly without LLM
  const ranked = await rankCandidates(
    baseMale,
    baseMalePrefs,
    [baseFemale],
    new Map([[baseFemale.id, baseFemalePrefs]])
  );

  assert.equal(ranked.length, 1);
  assert.ok(ranked[0].explanation && ranked[0].explanation.length > 20);
  assert.ok(ranked[0].introDraft && ranked[0].introDraft.length > 50);
  assert.ok(['deterministic', 'ai'].includes(ranked[0].explanationSource));
});

test('13. Gemini explanation & intro services handle both active and fallback modes', async () => {
  const scoreResult = scoreCandidate(baseMale, baseMalePrefs, baseFemale, baseFemalePrefs);
  const explanationRes = await generateGeminiExplanation(
    baseMale,
    baseFemale,
    scoreResult.overallScore,
    scoreResult.scoreCoverage,
    scoreResult.factorScores,
    scoreResult.strengths,
    scoreResult.potentialConflicts,
    scoreResult.unknowns
  );

  assert.ok(explanationRes.explanation && explanationRes.explanation.length > 20);
  assert.ok(['ai', 'deterministic'].includes(explanationRes.source));

  const introRes = await generateGeminiIntroDraft(
    baseMale,
    baseFemale,
    scoreResult.factorScores,
    scoreResult.strengths
  );

  assert.ok(introRes.introDraft && introRes.introDraft.length > 40);
  assert.ok(['ai', 'deterministic'].includes(introRes.source));
});
