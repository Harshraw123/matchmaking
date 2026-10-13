import { CustomerProfile, FactorScore } from './types';

export function generateDeterministicExplanation(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  overallScore: number,
  scoreCoverage: number,
  factorScores: FactorScore[],
  strengths: string[],
  potentialConflicts: string[]
): string {
  const topFactors = [...factorScores]
    .filter(f => f.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const topFactorNames = topFactors.map(f => f.name.toLowerCase()).join(' and ');

  let toneDescriptor = 'Promising potential alignment';
  if (overallScore >= 85) toneDescriptor = 'Exceptional mutual compatibility';
  else if (overallScore >= 75) toneDescriptor = 'Strong complementary match';
  else if (overallScore >= 60) toneDescriptor = 'Moderate compatibility with selective commonalities';
  else toneDescriptor = 'Low alignment across core preference criteria';

  const strengthsSummary = strengths.length > 0 
    ? `Key shared foundations include ${strengths.slice(0, 2).join('; ')}.` 
    : '';

  const conflictSummary = potentialConflicts.length > 0
    ? ` Note that ${potentialConflicts[0].toLowerCase()} will benefit from early conversation.`
    : '';

  const coverageNote = scoreCoverage < 75 
    ? ` (Data coverage is currently ${scoreCoverage}%; some preferences remain to be confirmed with the client).` 
    : '';

  return `${toneDescriptor} (${overallScore}/100) anchored by strong synergy in ${topFactorNames || 'personal biodata'}. ${strengthsSummary}${conflictSummary}${coverageNote}`;
}

export function generateDeterministicIntroDraft(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  factorScores: FactorScore[],
  strengths: string[]
): string {
  const commonHobbies = customer.hobbies.filter(h => 
    candidate.hobbies.map(x => x.toLowerCase()).includes(h.toLowerCase())
  );

  const hobbyPhrase = commonHobbies.length > 0
    ? `Both of you share an enthusiasm for ${commonHobbies.slice(0, 2).join(' and ')}.`
    : `Both profiles reflect high commitment to intentional personal growth and shared values.`;

  const locationContext = customer.city === candidate.city 
    ? `as you both reside in ${candidate.city}` 
    : `with ${candidate.firstName} based in ${candidate.city}`;

  return `Dear ${customer.firstName},

I am delighted to introduce ${candidate.firstName} ${candidate.lastName}, who caught our attention as an exceptionally well-aligned candidate for you.

${candidate.firstName} is working as a ${candidate.designation} at ${candidate.currentCompany} with a background from ${candidate.undergraduateCollege}. ${locationContext}, there is strong synergy across your lifestyle values. ${hobbyPhrase}

Our team noticed especially strong alignment in your long-term perspectives and career sensibilities. We believe an introductory virtual coffee would be a delightful next step.

Warm regards,
Your Dedicated Matchmaker
The Date Crew`;
}
