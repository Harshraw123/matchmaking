import {
  CustomerProfile,
  PartnerPreferences,
  FactorScore,
  MatchingConfig,
  DEFAULT_MATCHING_CONFIG,
} from './types';
import {
  calculateAgeAlignment,
  calculateLocationAlignment,
  calculateTrinaryCompatibility,
  calculateSetOverlap,
} from './preferences';

export interface ScoreFactorsResult {
  factorScores: FactorScore[];
  overallScore: number;
  scoreCoverage: number;
  strengths: string[];
  potentialConflicts: string[];
  unknowns: string[];
}

export function scoreCandidate(
  customer: CustomerProfile,
  customerPrefs: PartnerPreferences | undefined,
  candidate: CustomerProfile,
  candidatePrefs: PartnerPreferences | undefined,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): ScoreFactorsResult {
  const factorScores: FactorScore[] = [];
  const strengths: string[] = [];
  const potentialConflicts: string[] = [];
  const unknowns: string[] = [];

  const weights = config.weights;

  // --------------------------------------------------------------------------
  // FACTOR 1: Mutual Partner-Preference Alignment (30%)
  // Incorporates Gender-Specific Strategies (Section 8.3)
  // --------------------------------------------------------------------------
  const factor1Evidence: string[] = [];
  const factor1Conflicts: string[] = [];
  const factor1Unknowns: string[] = [];
  let factor1ScoreSum = 0;
  let factor1ChecksCount = 0;

  // A. Customer -> Candidate Fit
  if (customer.gender === 'male') {
    // Strategy for Male Customer looking at Female Candidate:
    // Focus on stated age preferences (often younger), height tolerance, children compatibility, and income tolerance
    if (customerPrefs?.preferredAgeMin !== undefined || customerPrefs?.preferredAgeMax !== undefined) {
      const ageRes = calculateAgeAlignment(candidate.age, customerPrefs.preferredAgeMin, customerPrefs.preferredAgeMax);
      factor1ScoreSum += ageRes.score;
      factor1ChecksCount++;
      factor1Evidence.push(ageRes.evidence);
      if (ageRes.score < 50) factor1Conflicts.push(`Candidate age (${candidate.age}) differs from preferred bracket.`);
    } else {
      factor1Unknowns.push('Male customer has no specific age bracket set; standard parity applied.');
      factor1ScoreSum += 70;
      factor1ChecksCount++;
    }

    // Height preference
    if (customerPrefs?.preferredHeightMaxCm !== undefined || customerPrefs?.preferredHeightMinCm !== undefined) {
      const hMin = customerPrefs.preferredHeightMinCm ?? 140;
      const hMax = customerPrefs.preferredHeightMaxCm ?? 190;
      if (candidate.heightCm >= hMin && candidate.heightCm <= hMax) {
        factor1ScoreSum += 100;
        factor1Evidence.push(`Candidate height (${candidate.heightCm} cm) matches preferred range (${hMin}–${hMax} cm).`);
      } else {
        factor1ScoreSum += 60;
        factor1Conflicts.push(`Candidate height (${candidate.heightCm} cm) is outside stated range.`);
      }
      factor1ChecksCount++;
    }

    // Income alignment / tolerance
    if (customerPrefs?.preferredIncomeMin) {
      if (candidate.annualIncomeMin >= customerPrefs.preferredIncomeMin) {
        factor1ScoreSum += 95;
        factor1Evidence.push(`Candidate income meets minimum preferred threshold.`);
      } else {
        factor1ScoreSum += 70; // Male preference often shows higher flexibility on partner income
        factor1Evidence.push(`Candidate income is lower than preferred threshold, within typical flexibility.`);
      }
      factor1ChecksCount++;
    }
  } else {
    // Strategy for Female Customer looking at Male Candidate:
    // Prioritize career and profession, education tier, values, relocation, and lifestyle
    if (customerPrefs?.preferredProfessions && customerPrefs.preferredProfessions.length > 0) {
      const prefProf = customerPrefs.preferredProfessions.map(p => p.toLowerCase());
      const hasProfMatch = prefProf.some(p => 
        candidate.designation.toLowerCase().includes(p) || 
        candidate.educationLevel.toLowerCase().includes(p)
      );
      if (hasProfMatch) {
        factor1ScoreSum += 100;
        factor1Evidence.push(`Candidate profession (${candidate.designation}) matches preferred career fields.`);
      } else {
        factor1ScoreSum += 65;
        factor1Conflicts.push(`Candidate profession (${candidate.designation}) is not in top preferred career list.`);
      }
      factor1ChecksCount++;
    } else {
      factor1Unknowns.push('Female customer has no specific profession constraints specified.');
    }

    // Career income threshold
    if (customerPrefs?.preferredIncomeMin) {
      if (candidate.annualIncomeMin >= customerPrefs.preferredIncomeMin) {
        factor1ScoreSum += 100;
        factor1Evidence.push(`Candidate income (${candidate.annualIncomeRange}) meets preferred financial comfort range.`);
      } else {
        factor1ScoreSum += 40;
        factor1Conflicts.push(`Candidate income bracket is below preferred minimum.`);
      }
      factor1ChecksCount++;
    }

    // Education preference
    if (customerPrefs?.preferredEducation && customerPrefs.preferredEducation.length > 0) {
      const prefEdu = customerPrefs.preferredEducation.map(e => e.toLowerCase());
      const hasEduMatch = prefEdu.some(e => 
        candidate.educationLevel.toLowerCase().includes(e) || 
        candidate.degree.toLowerCase().includes(e)
      );
      if (hasEduMatch) {
        factor1ScoreSum += 100;
        factor1Evidence.push(`Candidate degree (${candidate.degree}) fulfills education preference.`);
      } else {
        factor1ScoreSum += 60;
        factor1Conflicts.push(`Candidate degree (${candidate.degree}) differs from requested education.`);
      }
      factor1ChecksCount++;
    }
  }

  // B. Reciprocal Check: Does Customer satisfy Candidate's Preferences?
  if (candidatePrefs) {
    if (candidatePrefs.preferredAgeMin !== undefined || candidatePrefs.preferredAgeMax !== undefined) {
      const recipAge = calculateAgeAlignment(customer.age, candidatePrefs.preferredAgeMin, candidatePrefs.preferredAgeMax);
      factor1ScoreSum += recipAge.score;
      factor1ChecksCount++;
      if (recipAge.score >= 80) {
        factor1Evidence.push(`Customer age fits candidate's preferred bracket (${candidatePrefs.preferredAgeMin ?? 18}–${candidatePrefs.preferredAgeMax ?? 80}).`);
      } else {
        factor1Conflicts.push(`Customer age does not fully fit candidate's reciprocal preference.`);
      }
    }

    if (candidatePrefs.preferredLocations && candidatePrefs.preferredLocations.length > 0) {
      const normLocations = candidatePrefs.preferredLocations.map(l => l.toLowerCase());
      if (normLocations.includes(customer.city.toLowerCase())) {
        factor1ScoreSum += 100;
        factor1Evidence.push(`Customer city (${customer.city}) is in candidate's preferred location list.`);
      } else {
        factor1ScoreSum += 50;
      }
      factor1ChecksCount++;
    }
  } else {
    factor1Unknowns.push('Candidate partner preferences not fully recorded; reciprocal fit estimated.');
  }

  const factor1Score = factor1ChecksCount > 0 
    ? Math.round(factor1ScoreSum / factor1ChecksCount) 
    : 70;

  factorScores.push({
    factor: 'mutualPreferences',
    name: 'Mutual Partner-Preference Alignment',
    score: factor1Score,
    weight: weights.mutualPreferences,
    applicable: true,
    evidence: factor1Evidence,
    conflicts: factor1Conflicts,
    unknowns: factor1Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 2: Children and Long-Term Values (20%)
  // --------------------------------------------------------------------------
  const factor2Evidence: string[] = [];
  const factor2Conflicts: string[] = [];
  const factor2Unknowns: string[] = [];

  // Children alignment
  const childrenAlign = calculateTrinaryCompatibility(customer.wantChildren, candidate.wantChildren);
  let factor2Score = childrenAlign.score * 0.6;
  factor2Evidence.push(`Views on having children: ${childrenAlign.evidence}`);
  if (childrenAlign.score <= 40) {
    factor2Conflicts.push(`Contrasting stances on children (${customer.wantChildren} vs ${candidate.wantChildren}).`);
  }

  // Values overlap
  const valuesOverlap = calculateSetOverlap(customer.personalValues, candidate.personalValues);
  if (valuesOverlap.isUnknown) {
    factor2Unknowns.push('One or both profiles lack personal value tags.');
    factor2Score += 50 * 0.4;
  } else {
    factor2Score += valuesOverlap.score * 0.4;
    if (valuesOverlap.common.length > 0) {
      factor2Evidence.push(`Shared core values: ${valuesOverlap.common.join(', ')}.`);
    } else {
      factor2Conflicts.push('No immediate overlap in listed core personal values.');
    }
  }

  factorScores.push({
    factor: 'childrenAndValues',
    name: 'Children & Long-Term Values',
    score: Math.round(factor2Score),
    weight: weights.childrenAndValues,
    applicable: true,
    evidence: factor2Evidence,
    conflicts: factor2Conflicts,
    unknowns: factor2Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 3: Lifestyle & Interests (15%)
  // --------------------------------------------------------------------------
  const factor3Evidence: string[] = [];
  const factor3Conflicts: string[] = [];
  const factor3Unknowns: string[] = [];

  // Pets
  const petsAlign = calculateTrinaryCompatibility(customer.openToPets, candidate.openToPets);
  let f3Score = petsAlign.score * 0.35;
  factor3Evidence.push(`Pet openness: ${petsAlign.evidence}`);

  // Hobbies overlap
  const hobbiesOverlap = calculateSetOverlap(customer.hobbies, candidate.hobbies);
  if (hobbiesOverlap.isUnknown) {
    factor3Unknowns.push('Limited leisure hobbies documented.');
    f3Score += 50 * 0.35;
  } else {
    f3Score += hobbiesOverlap.score * 0.35;
    if (hobbiesOverlap.common.length > 0) {
      factor3Evidence.push(`Mutual hobbies & passions: ${hobbiesOverlap.common.join(', ')}.`);
    }
  }

  // Dietary alignment
  if (customer.dietaryPreference && candidate.dietaryPreference) {
    if (customer.dietaryPreference.toLowerCase() === candidate.dietaryPreference.toLowerCase()) {
      f3Score += 100 * 0.15;
      factor3Evidence.push(`Matching dietary preference: ${candidate.dietaryPreference}.`);
    } else {
      f3Score += 70 * 0.15;
      factor3Evidence.push(`Different dietary choices (${customer.dietaryPreference} & ${candidate.dietaryPreference}).`);
    }
  } else {
    factor3Unknowns.push('Dietary preferences unconfirmed.');
    f3Score += 65 * 0.15;
  }

  // Work arrangement (remote / hybrid / onsite)
  if (customer.workArrangement === candidate.workArrangement) {
    f3Score += 100 * 0.15;
    factor3Evidence.push(`Same professional flexibility model (${customer.workArrangement}).`);
  } else {
    f3Score += 75 * 0.15;
  }

  factorScores.push({
    factor: 'lifestyleAndInterests',
    name: 'Lifestyle & Interests',
    score: Math.round(f3Score),
    weight: weights.lifestyleAndInterests,
    applicable: true,
    evidence: factor3Evidence,
    conflicts: factor3Conflicts,
    unknowns: factor3Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 4: Career & Education Compatibility (15%)
  // --------------------------------------------------------------------------
  const factor4Evidence: string[] = [];
  const factor4Conflicts: string[] = [];
  const factor4Unknowns: string[] = [];
  let f4Score = 70;

  // Education level
  if (customer.educationLevel && candidate.educationLevel) {
    if (customer.educationLevel === candidate.educationLevel) {
      f4Score += 15;
      factor4Evidence.push(`Equivalent educational attainment (${candidate.educationLevel}).`);
    } else {
      factor4Evidence.push(`Distinct educational backgrounds (${customer.educationLevel} and ${candidate.educationLevel}).`);
    }
  }

  // College prestige / tier synergy
  if (customer.undergraduateCollege && candidate.undergraduateCollege) {
    factor4Evidence.push(`Academic background: ${candidate.undergraduateCollege} (${candidate.degree}).`);
  }

  // Career designation & company
  if (candidate.currentCompany) {
    factor4Evidence.push(`Currently ${candidate.designation} at ${candidate.currentCompany}.`);
  }

  f4Score = Math.min(100, Math.max(0, f4Score));

  factorScores.push({
    factor: 'careerAndEducation',
    name: 'Career & Education Compatibility',
    score: Math.round(f4Score),
    weight: weights.careerAndEducation,
    applicable: true,
    evidence: factor4Evidence,
    conflicts: factor4Conflicts,
    unknowns: factor4Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 5: Relocation & Location (10%)
  // --------------------------------------------------------------------------
  const factor5Evidence: string[] = [];
  const factor5Conflicts: string[] = [];
  const factor5Unknowns: string[] = [];

  const locAlign = calculateLocationAlignment(customer.city, candidate.city, customerPrefs?.preferredLocations);
  let f5Score = locAlign.score;
  factor5Evidence.push(locAlign.evidence);

  if (customer.city !== candidate.city) {
    const relocAlign = calculateTrinaryCompatibility(customer.openToRelocation, candidate.openToRelocation);
    if (customer.openToRelocation === 'Yes' || candidate.openToRelocation === 'Yes') {
      f5Score = Math.max(f5Score, 75);
      factor5Evidence.push('Active flexibility for inter-city relocation exists.');
    } else if (customer.openToRelocation === 'No' && candidate.openToRelocation === 'No') {
      f5Score = Math.min(f5Score, 30);
      factor5Conflicts.push('Both parties have specified reluctance to relocate.');
    } else {
      factor5Unknowns.push('Relocation flexibility requires matchmaker clarification.');
    }
  }

  factorScores.push({
    factor: 'relocationAndLocation',
    name: 'Relocation & Location',
    score: Math.round(f5Score),
    weight: weights.relocationAndLocation,
    applicable: true,
    evidence: factor5Evidence,
    conflicts: factor5Conflicts,
    unknowns: factor5Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 6: Language Compatibility (5%)
  // --------------------------------------------------------------------------
  const factor6Evidence: string[] = [];
  const factor6Conflicts: string[] = [];
  const factor6Unknowns: string[] = [];

  const langOverlap = calculateSetOverlap(customer.languagesKnown, candidate.languagesKnown);
  let f6Score = 50;
  if (langOverlap.common.length > 0) {
    f6Score = Math.min(100, 60 + langOverlap.common.length * 15);
    factor6Evidence.push(`Shared spoken languages: ${langOverlap.common.join(', ')}.`);
  } else {
    factor6Conflicts.push('No immediate shared languages registered in biodata.');
    f6Score = 25;
  }

  factorScores.push({
    factor: 'languageCompatibility',
    name: 'Language Compatibility',
    score: Math.round(f6Score),
    weight: weights.languageCompatibility,
    applicable: true,
    evidence: factor6Evidence,
    conflicts: factor6Conflicts,
    unknowns: factor6Unknowns,
  });

  // --------------------------------------------------------------------------
  // FACTOR 7: Profile Completeness & Verification (5%)
  // --------------------------------------------------------------------------
  const factor7Evidence: string[] = [];
  const factor7Conflicts: string[] = [];
  const factor7Unknowns: string[] = [];

  let verificationScore = 50;
  if (candidate.verificationStatus === 'verified') {
    verificationScore = 100;
    factor7Evidence.push('Candidate profile is verified with authenticated documentation.');
  } else if (candidate.verificationStatus === 'pending_review') {
    verificationScore = 75;
    factor7Unknowns.push('Candidate credentials currently under matchmaker review.');
  } else {
    verificationScore = 40;
    factor7Conflicts.push('Candidate identity verification is unverified.');
  }

  const avgCompleteness = (customer.profileCompleteness + candidate.profileCompleteness) / 2;
  const f7Score = Math.round((verificationScore * 0.6) + (avgCompleteness * 0.4));
  factor7Evidence.push(`Profile completeness average is ${Math.round(avgCompleteness)}%.`);

  factorScores.push({
    factor: 'profileCompletenessAndVerification',
    name: 'Profile Completeness & Verification',
    score: f7Score,
    weight: weights.profileCompletenessAndVerification,
    applicable: true,
    evidence: factor7Evidence,
    conflicts: factor7Conflicts,
    unknowns: factor7Unknowns,
  });

  // --------------------------------------------------------------------------
  // AGGREGATION & COVERAGE CALCULATION
  // Formula: overallScore = sum(weight * score) / sum(weight)
  // --------------------------------------------------------------------------
  let totalWeightedScore = 0;
  let totalApplicableWeight = 0;
  let totalKnownDataWeight = 0;
  const totalConfigWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  for (const factor of factorScores) {
    if (factor.applicable) {
      totalWeightedScore += factor.score * factor.weight;
      totalApplicableWeight += factor.weight;

      // Penalize coverage if factor has high unknowns
      const unknownPenalty = factor.unknowns.length * 0.25;
      const coverageFraction = Math.max(0, 1 - unknownPenalty);
      totalKnownDataWeight += factor.weight * coverageFraction;
    }

    // Collect strengths, conflicts, unknowns
    if (factor.score >= 80) {
      strengths.push(...factor.evidence);
    }
    potentialConflicts.push(...factor.conflicts);
    unknowns.push(...factor.unknowns);
  }

  const rawOverall = totalApplicableWeight > 0 ? totalWeightedScore / totalApplicableWeight : 0;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall)));

  const rawCoverage = totalConfigWeight > 0 ? (totalKnownDataWeight / totalConfigWeight) * 100 : 0;
  const scoreCoverage = Math.min(100, Math.max(0, Math.round(rawCoverage)));

  // Deduplicate strings
  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 5);
  const uniqueConflicts = Array.from(new Set(potentialConflicts)).slice(0, 5);
  const uniqueUnknowns = Array.from(new Set(unknowns)).slice(0, 5);

  return {
    factorScores,
    overallScore,
    scoreCoverage,
    strengths: uniqueStrengths,
    potentialConflicts: uniqueConflicts,
    unknowns: uniqueUnknowns,
  };
}
