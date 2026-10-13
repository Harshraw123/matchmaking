import { CustomerProfile, PartnerPreferences } from '../matching/types';
import { hashPassword } from '../auth/session';

export interface SyntheticDataset {
  matchmakers: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt?: string;
  }>;
  customers: CustomerProfile[];
  preferences: PartnerPreferences[];
  notes: Array<{
    id: string;
    customerId: string;
    matchmakerId: string;
    matchmakerName: string;
    noteText: string;
    category: 'Call' | 'Meeting' | 'Follow-up' | 'General';
    nextFollowUpDate?: string;
    createdAt: string;
  }>;
  introductions: Array<{
    id: string;
    customerId: string;
    candidateId: string;
    matchRecommendationId?: string;
    customMessage: string;
    sentByMatchmakerId: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'feedback_pending';
  }>;
}

const CITIES = [
  'Mumbai', 'Bengaluru', 'Delhi NCR', 'Pune', 'Hyderabad', 
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'
];

const MALE_FIRST_NAMES = [
  'Rohan', 'Siddharth', 'Kabir', 'Aditya', 'Aarav', 'Vikram', 'Dhruv', 'Arjun',
  'Dev', 'Kunal', 'Ishaan', 'Nikhil', 'Varun', 'Sameer', 'Pranav', 'Yash',
  'Gaurav', 'Manish', 'Harsh', 'Anand', 'Raghav', 'Abhishek', 'Rishi', 'Tushar',
  'Kartik', 'Vivek', 'Ayush', 'Tanmay', 'Akash', 'Shubham', 'Rahul', 'Mohit'
];

const FEMALE_FIRST_NAMES = [
  'Tara', 'Priyanka', 'Ananya', 'Rhea', 'Meera', 'Kavya', 'Sneha', 'Tanvi',
  'Natasha', 'Isha', 'Diya', 'Nandini', 'Pooja', 'Shreya', 'Aanya', 'Simran',
  'Radhika', 'Trisha', 'Sanjana', 'Anika', 'Avani', 'Gayatri', 'Zoya', 'Aditi',
  'Mallika', 'Bhavna', 'Ritu', 'Kriti', 'Nehal', 'Rupal', 'Vandana', 'Shruti'
];

const LAST_NAMES = [
  'Varma', 'Nair', 'Sen', 'Mehra', 'Rao', 'Deshmukh', 'Kapoor', 'Sharma',
  'Patel', 'Bhatia', 'Iyer', 'Menon', 'Singhania', 'Chopra', 'Banerjee', 'Joshi',
  'Kulkarni', 'Reddy', 'Agarwal', 'Choudhary', 'Malhotra', 'Gupta', 'Saxena', 'Shah'
];

const TECH_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Stripe', 'Razorpay', 'CRED', 'Flipkart', 'Swiggy', 'Zerodha', 'Uber'];
const CONSULTING_FINANCE = ['McKinsey & Co', 'BCG', 'Bain & Company', 'Goldman Sachs', 'Morgan Stanley', 'J.P. Morgan', 'Citigroup', 'Avendus Capital'];
const DESIGN_CREATIVE = ['Studio Lotus', 'Pentagram', 'Condé Nast', 'Ogilvy', 'DDB Mudra', 'Architectural Digest'];
const HEALTHCARE_LAW = ['Apollo Hospitals', 'Max Healthcare', 'Shardul Amarchand', 'Cyril Amarchand Mangaldas', 'Trilegal', 'Fortis'];

const COLLEGES = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani', 'IIM Ahmedabad', 
  'IIM Bangalore', 'IIM Calcutta', 'ISB Hyderabad', 'St. Xavier\'s College, Mumbai',
  'Lady Shri Ram College, Delhi', 'SRCC, Delhi', 'National Law School, Bangalore',
  'Ashoka University', 'CEPT University, Ahmedabad', 'NIFT Delhi', 'DTU, Delhi'
];

const VALUES_POOL = [
  'Intellectual Curiosity', 'Family Centric', 'Work-Life Balance', 'Ambition',
  'Kindness & Empathy', 'Financial Prudence', 'Lifelong Learning', 'Health & Fitness',
  'Social Responsibility', 'Creativity & Arts', 'Egalitarian Partnership'
];

const HOBBIES_POOL = [
  'Tennis', 'Specialty Coffee', 'Hiking & Outdoors', 'Contemporary Fiction',
  'Culinary Arts', 'Scuba Diving', 'Jazz & Classical Music', 'Pottery & Ceramics',
  'Marathon Running', 'Architecture Tours', 'Wine Tasting', 'Film Photography', 'Yoga & Mindfulness'
];

export function generateSyntheticDataset(): SyntheticDataset {
  // Demo Matchmakers
  const matchmakers = [
    {
      id: 'mm-lead-1',
      name: 'Aditi Roy',
      email: 'matchmaker@thedatecrew.com',
      passwordHash: hashPassword('Matchmaker@2026!'),
      role: 'Lead Matchmaker',
    },
    {
      id: 'mm-senior-2',
      name: 'Sarah Kapoor',
      email: 'sarah.kapoor@thedatecrew.com',
      passwordHash: hashPassword('Matchmaker@2026!'),
      role: 'Senior Matchmaker',
    },
  ];

  const customers: CustomerProfile[] = [];
  const preferences: PartnerPreferences[] = [];

  // 1. Seed 6 Primary Assigned Customers (Featured in Dashboard)
  const primaryCustomers: Array<{ profile: CustomerProfile; prefs: PartnerPreferences }> = [
    {
      profile: {
        id: 'cust-m-1',
        firstName: 'Rohan',
        lastName: 'Varma',
        gender: 'male',
        dateOfBirth: '1995-03-14',
        age: 31,
        country: 'India',
        city: 'Mumbai',
        heightCm: 181,
        email: 'rohan.varma@example.com',
        phone: '+91 98201 44552',
        maritalStatus: 'Never Married',
        educationLevel: 'Postgraduate',
        undergraduateCollege: 'BITS Pilani',
        degree: 'B.E. Computer Science, M.S. Stanford',
        currentCompany: 'FinTech Startup',
        designation: 'Co-Founder & CTO',
        annualIncomeRange: '₹65L - ₹1Cr+',
        annualIncomeMin: 6500000,
        annualIncomeMax: 12000000,
        languagesKnown: ['English', 'Hindi', 'Marathi'],
        siblingsCount: 1,
        siblingsDetails: 'One younger sister (Doctor in London)',
        religion: 'Hindu',
        caste: 'Kayastha',
        wantChildren: 'Yes',
        openToRelocation: 'Maybe',
        openToPets: 'Yes',
        dietaryPreference: 'Eggetarian',
        hobbies: ['Specialty Coffee', 'Tennis', 'Hiking & Outdoors', 'Contemporary Fiction'],
        relationshipGoals: 'Seeking an intellectually vibrant, supportive equal partner for marriage.',
        personalValues: ['Intellectual Curiosity', 'Egalitarian Partnership', 'Ambition', 'Work-Life Balance'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'Moderate',
        verificationStatus: 'verified',
        profileCompleteness: 98,
        journeyStage: 'ready_for_matches',
        assignedMatchmakerId: 'mm-lead-1',
        consentToShare: true,
        lastContactedAt: '2026-10-10T10:30:00.000Z',
        nextFollowUpDate: '2026-10-15T15:00:00.000Z',
        notesCount: 3,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-m-1',
        customerId: 'cust-m-1',
        preferredAgeMin: 26,
        preferredAgeMax: 30,
        preferredLocations: ['Mumbai', 'Pune', 'Bengaluru'],
        preferredEducation: ['Postgraduate', 'MBA', 'Masters'],
        preferredProfessions: ['Brand Strategist', 'Consultant', 'Architect', 'Product Lead'],
        preferredHeightMinCm: 157,
        preferredHeightMaxCm: 175,
        preferredIncomeMin: 2000000,
        preferredChildren: ['Yes', 'Maybe'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredDietary: ['Vegetarian', 'Eggetarian', 'Non-veg'],
        preferredLanguages: ['English', 'Hindi'],
        otherRequirements: 'Appreciates design aesthetics, travel, and warm family bonds.',
        nonNegotiables: ['Want Children', 'Open to Mumbai'],
      },
    },
    {
      profile: {
        id: 'cust-f-1',
        firstName: 'Tara',
        lastName: 'Mehra',
        gender: 'female',
        dateOfBirth: '1997-07-22',
        age: 29,
        country: 'India',
        city: 'Mumbai',
        heightCm: 167,
        email: 'tara.mehra@example.com',
        phone: '+91 98199 88771',
        maritalStatus: 'Never Married',
        educationLevel: 'Postgraduate',
        undergraduateCollege: 'St. Xavier\'s College, Mumbai',
        degree: 'Master in Luxury Brand Management (ESSEC)',
        currentCompany: 'Condé Nast India',
        designation: 'Senior Brand Director',
        annualIncomeRange: '₹40L - ₹65L',
        annualIncomeMin: 4000000,
        annualIncomeMax: 6000000,
        languagesKnown: ['English', 'Hindi', 'French'],
        siblingsCount: 0,
        siblingsDetails: 'Only child',
        religion: 'Hindu',
        caste: 'Khatri',
        wantChildren: 'Yes',
        openToRelocation: 'Maybe',
        openToPets: 'Yes',
        dietaryPreference: 'Non-veg',
        hobbies: ['Wine Tasting', 'Film Photography', 'Contemporary Fiction', 'Tennis'],
        relationshipGoals: 'A warm, affectionate marriage grounded in mutual respect and shared lifestyle vision.',
        personalValues: ['Creativity & Arts', 'Family Centric', 'Work-Life Balance', 'Kindness & Empathy'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'Moderate',
        verificationStatus: 'verified',
        profileCompleteness: 96,
        journeyStage: 'ready_for_matches',
        assignedMatchmakerId: 'mm-lead-1',
        consentToShare: true,
        lastContactedAt: '2026-10-11T12:00:00.000Z',
        nextFollowUpDate: '2026-10-14T11:00:00.000Z',
        notesCount: 2,
        createdAt: '2026-08-05T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-f-1',
        customerId: 'cust-f-1',
        preferredAgeMin: 29,
        preferredAgeMax: 34,
        preferredLocations: ['Mumbai', 'Bengaluru'],
        preferredEducation: ['Postgraduate', 'MBA', 'Masters'],
        preferredProfessions: ['Founder', 'CTO', 'Product Director', 'Consultant', 'Finance'],
        preferredHeightMinCm: 175,
        preferredHeightMaxCm: 190,
        preferredIncomeMin: 4500000,
        preferredChildren: ['Yes', 'Maybe'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredDietary: ['Non-veg', 'Eggetarian', 'Vegetarian'],
        preferredLanguages: ['English', 'Hindi'],
        otherRequirements: 'Emotionally mature, values culinary and travel experiences.',
        nonNegotiables: ['Want Children', 'Non-smoker'],
      },
    },
    {
      profile: {
        id: 'cust-m-2',
        firstName: 'Siddharth',
        lastName: 'Nair',
        gender: 'male',
        dateOfBirth: '1992-11-09',
        age: 34,
        country: 'India',
        city: 'Bengaluru',
        heightCm: 178,
        email: 'sid.nair@example.com',
        phone: '+91 99805 12345',
        maritalStatus: 'Never Married',
        educationLevel: 'Postgraduate',
        undergraduateCollege: 'IIT Madras',
        degree: 'B.Tech Electrical & MBA IIM Bangalore',
        currentCompany: 'Razorpay',
        designation: 'Vice President of Product',
        annualIncomeRange: '₹65L - ₹1Cr+',
        annualIncomeMin: 7500000,
        annualIncomeMax: 11000000,
        languagesKnown: ['English', 'Hindi', 'Malayalam', 'Kannada'],
        siblingsCount: 1,
        siblingsDetails: 'Elder brother in Seattle (Amazon Principal)',
        religion: 'Hindu',
        caste: 'Nair',
        wantChildren: 'Yes',
        openToRelocation: 'Yes',
        openToPets: 'Yes',
        dietaryPreference: 'Non-veg',
        hobbies: ['Scuba Diving', 'Marathon Running', 'Specialty Coffee', 'Jazz & Classical Music'],
        relationshipGoals: 'Committed matrimonial union focused on shared adventures and personal fulfillment.',
        personalValues: ['Ambition', 'Intellectual Curiosity', 'Egalitarian Partnership', 'Health & Fitness'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'Low',
        verificationStatus: 'verified',
        profileCompleteness: 94,
        journeyStage: 'active_matching',
        assignedMatchmakerId: 'mm-lead-1',
        consentToShare: true,
        lastContactedAt: '2026-10-09T16:00:00.000Z',
        nextFollowUpDate: '2026-10-16T14:30:00.000Z',
        notesCount: 4,
        createdAt: '2026-07-15T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-m-2',
        customerId: 'cust-m-2',
        preferredAgeMin: 28,
        preferredAgeMax: 33,
        preferredLocations: ['Bengaluru', 'Mumbai', 'Hyderabad'],
        preferredEducation: ['Postgraduate', 'PhD', 'Masters'],
        preferredProfessions: ['Research Scientist', 'Engineer', 'Doctor', 'Consultant'],
        preferredHeightMinCm: 160,
        preferredHeightMaxCm: 175,
        preferredIncomeMin: 2500000,
        preferredChildren: ['Yes', 'Maybe'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredLanguages: ['English', 'Hindi'],
        nonNegotiables: ['Want Children', 'Open to relocation or Bengaluru based'],
      },
    },
    {
      profile: {
        id: 'cust-f-2',
        firstName: 'Priyanka',
        lastName: 'Rao',
        gender: 'female',
        dateOfBirth: '1994-04-18',
        age: 32,
        country: 'India',
        city: 'Bengaluru',
        heightCm: 166,
        email: 'priyanka.rao@example.com',
        phone: '+91 97412 88990',
        maritalStatus: 'Never Married',
        educationLevel: 'Doctorate',
        undergraduateCollege: 'IISc Bengaluru',
        degree: 'Ph.D. in Machine Learning & AI',
        currentCompany: 'Microsoft Research India',
        designation: 'Senior Principal AI Researcher',
        annualIncomeRange: '₹65L - ₹1Cr+',
        annualIncomeMin: 6500000,
        annualIncomeMax: 9500000,
        languagesKnown: ['English', 'Hindi', 'Kannada'],
        siblingsCount: 1,
        siblingsDetails: 'Younger brother (Civil Services)',
        religion: 'Hindu',
        caste: 'Brahmin',
        wantChildren: 'Yes',
        openToRelocation: 'Yes',
        openToPets: 'Yes',
        dietaryPreference: 'Vegetarian',
        hobbies: ['Hiking & Outdoors', 'Specialty Coffee', 'Yoga & Mindfulness', 'Classical Music'],
        relationshipGoals: 'A deeply collaborative partnership celebrating intellect, kindness, and warmth.',
        personalValues: ['Intellectual Curiosity', 'Egalitarian Partnership', 'Kindness & Empathy', 'Work-Life Balance'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'Moderate',
        verificationStatus: 'verified',
        profileCompleteness: 97,
        journeyStage: 'ready_for_matches',
        assignedMatchmakerId: 'mm-lead-1',
        consentToShare: true,
        lastContactedAt: '2026-10-12T09:15:00.000Z',
        nextFollowUpDate: '2026-10-17T10:00:00.000Z',
        notesCount: 2,
        createdAt: '2026-08-10T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-f-2',
        customerId: 'cust-f-2',
        preferredAgeMin: 31,
        preferredAgeMax: 36,
        preferredLocations: ['Bengaluru', 'Mumbai', 'Hyderabad'],
        preferredEducation: ['Postgraduate', 'Doctorate', 'IIT / IIM'],
        preferredProfessions: ['Product Director', 'VP Engineering', 'Founder', 'Researcher', 'Professor'],
        preferredHeightMinCm: 172,
        preferredHeightMaxCm: 188,
        preferredIncomeMin: 5000000,
        preferredChildren: ['Yes', 'Maybe'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredLanguages: ['English', 'Hindi'],
        otherRequirements: 'Values deep thinking, balanced ambition, and mutual support.',
        nonNegotiables: ['Want Children'],
      },
    },
    {
      profile: {
        id: 'cust-m-3',
        firstName: 'Kabir',
        lastName: 'Sen',
        gender: 'male',
        dateOfBirth: '1998-02-10',
        age: 28,
        country: 'India',
        city: 'Delhi NCR',
        heightCm: 183,
        email: 'kabir.sen@example.com',
        phone: '+91 98110 33445',
        maritalStatus: 'Never Married',
        educationLevel: 'Postgraduate',
        undergraduateCollege: 'SRCC, Delhi',
        degree: 'B.Com (Hons) & MBA ISB Hyderabad',
        currentCompany: 'McKinsey & Co',
        designation: 'Engagement Manager',
        annualIncomeRange: '₹40L - ₹65L',
        annualIncomeMin: 4500000,
        annualIncomeMax: 6500000,
        languagesKnown: ['English', 'Hindi', 'Bengali'],
        siblingsCount: 0,
        religion: 'Hindu',
        caste: 'Kayastha',
        wantChildren: 'Maybe',
        openToRelocation: 'Yes',
        openToPets: 'Maybe',
        dietaryPreference: 'Non-veg',
        hobbies: ['Culinary Arts', 'Marathon Running', 'Specialty Coffee', 'Wine Tasting'],
        relationshipGoals: 'Building an energetic, progressive life partnership with high emotional intelligence.',
        personalValues: ['Ambition', 'Work-Life Balance', 'Lifelong Learning', 'Family Centric'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'Moderate',
        verificationStatus: 'verified',
        profileCompleteness: 92,
        journeyStage: 'profile_review',
        assignedMatchmakerId: 'mm-senior-2',
        consentToShare: true,
        lastContactedAt: '2026-10-08T11:00:00.000Z',
        nextFollowUpDate: '2026-10-18T16:00:00.000Z',
        notesCount: 1,
        createdAt: '2026-08-20T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-m-3',
        customerId: 'cust-m-3',
        preferredAgeMin: 25,
        preferredAgeMax: 29,
        preferredLocations: ['Delhi NCR', 'Mumbai', 'Bengaluru'],
        preferredEducation: ['Postgraduate', 'Bachelors'],
        preferredProfessions: ['Consultant', 'Corporate Lawyer', 'Brand Director', 'Designer'],
        preferredHeightMinCm: 160,
        preferredHeightMaxCm: 178,
        preferredIncomeMin: 2000000,
        preferredChildren: ['Maybe', 'Yes'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredLanguages: ['English', 'Hindi'],
        nonNegotiables: ['Open to Delhi NCR or Mumbai'],
      },
    },
    {
      profile: {
        id: 'cust-f-3',
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        gender: 'female',
        dateOfBirth: '1999-09-05',
        age: 27,
        country: 'India',
        city: 'Pune',
        heightCm: 164,
        email: 'ananya.deshmukh@example.com',
        phone: '+91 98220 77665',
        maritalStatus: 'Never Married',
        educationLevel: 'Postgraduate',
        undergraduateCollege: 'CEPT University, Ahmedabad',
        degree: 'Master of Urban Design',
        currentCompany: 'Studio Lotus',
        designation: 'Lead Architect & Urbanist',
        annualIncomeRange: '₹25L - ₹40L',
        annualIncomeMin: 2800000,
        annualIncomeMax: 3800000,
        languagesKnown: ['English', 'Hindi', 'Marathi'],
        siblingsCount: 1,
        siblingsDetails: 'One elder sister (Lawyer in Mumbai)',
        religion: 'Hindu',
        caste: 'Maratha',
        wantChildren: 'Yes',
        openToRelocation: 'Yes',
        openToPets: 'Yes',
        dietaryPreference: 'Vegetarian',
        hobbies: ['Pottery & Ceramics', 'Hiking & Outdoors', 'Architecture Tours', 'Contemporary Fiction'],
        relationshipGoals: 'A grounded, creative relationship honoring family traditions while thriving modernly.',
        personalValues: ['Creativity & Arts', 'Family Centric', 'Work-Life Balance', 'Kindness & Empathy'],
        workArrangement: 'Hybrid',
        familyInvolvement: 'High',
        verificationStatus: 'verified',
        profileCompleteness: 91,
        journeyStage: 'onboarding',
        assignedMatchmakerId: 'mm-senior-2',
        consentToShare: true,
        lastContactedAt: '2026-10-07T14:30:00.000Z',
        nextFollowUpDate: '2026-10-13T10:00:00.000Z',
        notesCount: 2,
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      prefs: {
        id: 'pref-f-3',
        customerId: 'cust-f-3',
        preferredAgeMin: 27,
        preferredAgeMax: 32,
        preferredLocations: ['Pune', 'Mumbai', 'Bengaluru'],
        preferredEducation: ['Postgraduate', 'Bachelors', 'Engineering / Architecture'],
        preferredProfessions: ['Architect', 'Founder', 'Engineer', 'Consultant'],
        preferredHeightMinCm: 172,
        preferredHeightMaxCm: 185,
        preferredIncomeMin: 3500000,
        preferredChildren: ['Yes', 'Maybe'],
        preferredRelocation: ['Yes', 'Maybe'],
        preferredLanguages: ['English', 'Hindi', 'Marathi'],
        nonNegotiables: ['Want Children', 'Non-smoker'],
      },
    },
  ];

  for (const item of primaryCustomers) {
    customers.push(item.profile);
    preferences.push(item.prefs);
  }

  // 2. Generate 110 Diverse Candidate Profiles (55 Male, 55 Female)
  const professionsList = [
    { title: 'Principal Software Engineer', sector: 'tech', comp: 'Google', degree: 'B.Tech + M.Tech CS', edu: 'Postgraduate', minInc: 5500000, maxInc: 8500000, range: '₹40L - ₹65L' },
    { title: 'VP Investment Banking', sector: 'finance', comp: 'Goldman Sachs', degree: 'MBA Finance', edu: 'Postgraduate', minInc: 7000000, maxInc: 11000000, range: '₹65L - ₹1Cr+' },
    { title: 'Senior Product Manager', sector: 'tech', comp: 'CRED', degree: 'B.Tech & MBA', edu: 'Postgraduate', minInc: 4200000, maxInc: 6000000, range: '₹40L - ₹65L' },
    { title: 'Consultant', sector: 'consulting', comp: 'Bain & Company', degree: 'MBA IIM Calcutta', edu: 'Postgraduate', minInc: 3800000, maxInc: 5200000, range: '₹25L - ₹40L' },
    { title: 'Senior Corporate Counsel', sector: 'law', comp: 'Shardul Amarchand', degree: 'B.A. LL.B (Hons)', edu: 'Bachelors', minInc: 3500000, maxInc: 5000000, range: '₹25L - ₹40L' },
    { title: 'Consultant Pediatrician', sector: 'healthcare', comp: 'Max Healthcare', degree: 'MBBS, MD Pediatrics', edu: 'Postgraduate', minInc: 3200000, maxInc: 4500000, range: '₹25L - ₹40L' },
    { title: 'Design Director', sector: 'design', comp: 'Pentagram', degree: 'Master of Design', edu: 'Postgraduate', minInc: 3600000, maxInc: 5000000, range: '₹25L - ₹40L' },
    { title: 'Founder & CEO', sector: 'tech', comp: 'Stealth HealthTech', degree: 'B.Tech IIT Delhi', edu: 'Bachelors', minInc: 6000000, maxInc: 10000000, range: '₹65L - ₹1Cr+' },
    { title: 'Strategy Director', sector: 'consulting', comp: 'McKinsey & Co', degree: 'MBA ISB', edu: 'Postgraduate', minInc: 6000000, maxInc: 9000000, range: '₹40L - ₹65L' },
    { title: 'Senior Data Scientist', sector: 'tech', comp: 'Amazon', degree: 'M.S. Data Science', edu: 'Postgraduate', minInc: 4000000, maxInc: 5800000, range: '₹40L - ₹65L' },
    { title: 'Chief of Staff', sector: 'tech', comp: 'Stripe India', degree: 'MBA IIM Ahmedabad', edu: 'Postgraduate', minInc: 4500000, maxInc: 6500000, range: '₹40L - ₹65L' },
    { title: 'Architectural Project Lead', sector: 'design', comp: 'Studio Lotus', degree: 'B.Arch CEPT', edu: 'Bachelors', minInc: 2200000, maxInc: 3200000, range: '₹15L - ₹25L' },
    { title: 'Director of Marketing', sector: 'creative', comp: 'Ogilvy', degree: 'M.A. Mass Comm', edu: 'Postgraduate', minInc: 3000000, maxInc: 4200000, range: '₹25L - ₹40L' },
    { title: 'Quantitative Trader', sector: 'finance', comp: 'Tower Research', degree: 'B.Tech IIT Bombay', edu: 'Bachelors', minInc: 8000000, maxInc: 14000000, range: '₹65L - ₹1Cr+' },
  ];

  // Helper for deterministic pseudo-random distribution
  let seedNum = 42;
  function pseudoRandom() {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  }

  function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(pseudoRandom() * arr.length)];
  }

  function pickRandomSubset<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - pseudoRandom());
    return shuffled.slice(0, count);
  }

  // Generate 55 Female Candidates (Potential matches for male customers)
  for (let i = 1; i <= 55; i++) {
    const fId = `cand-f-${i}`;
    const fFirst = FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length];
    const fLast = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const city = CITIES[i % CITIES.length];
    const age = 24 + (i % 14); // 24 to 37
    const prof = professionsList[i % professionsList.length];
    const college = COLLEGES[(i * 2) % COLLEGES.length];
    const verificationStatus = i % 8 === 0 ? 'unverified' : (i % 5 === 0 ? 'pending_review' : 'verified');
    const completeness = 70 + (i % 30); // 70 to 99%

    const wantKids = i % 9 === 0 ? 'No' : (i % 4 === 0 ? 'Maybe' : 'Yes');
    const reloc = i % 7 === 0 ? 'No' : (i % 3 === 0 ? 'Maybe' : 'Yes');
    const pets = i % 6 === 0 ? 'No' : (i % 3 === 0 ? 'Maybe' : 'Yes');
    const diet = i % 3 === 0 ? 'Vegetarian' : (i % 4 === 0 ? 'Eggetarian' : 'Non-veg');

    const candProfile: CustomerProfile = {
      id: fId,
      firstName: fFirst,
      lastName: fLast,
      gender: 'female',
      dateOfBirth: `${1990 + (36 - age)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      age,
      country: 'India',
      city,
      heightCm: 155 + (i % 19), // 155 - 173 cm
      email: `${fFirst.toLowerCase()}.${fLast.toLowerCase()}${i}@example.com`,
      phone: `+91 98${String(10000000 + i * 1421).slice(0, 8)}`,
      maritalStatus: i % 15 === 0 ? 'Divorced' : 'Never Married',
      educationLevel: prof.edu,
      undergraduateCollege: college,
      degree: prof.degree,
      currentCompany: prof.comp,
      designation: prof.title,
      annualIncomeRange: prof.range,
      annualIncomeMin: prof.minInc,
      annualIncomeMax: prof.maxInc,
      languagesKnown: pickRandomSubset(['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Bengali'], 2 + (i % 2)),
      siblingsCount: i % 3,
      religion: i % 10 === 0 ? 'Jain' : (i % 12 === 0 ? 'Sikh' : 'Hindu'),
      caste: i % 4 === 0 ? 'Brahmin' : (i % 3 === 0 ? 'Khatri' : undefined),
      wantChildren: wantKids as 'Yes' | 'No' | 'Maybe',
      openToRelocation: reloc as 'Yes' | 'No' | 'Maybe',
      openToPets: pets as 'Yes' | 'No' | 'Maybe',
      dietaryPreference: diet,
      hobbies: pickRandomSubset(HOBBIES_POOL, 3 + (i % 3)),
      relationshipGoals: 'Looking for a thoughtful, authentic life partner with mutual respect.',
      personalValues: pickRandomSubset(VALUES_POOL, 3 + (i % 2)),
      workArrangement: i % 3 === 0 ? 'Remote' : (i % 2 === 0 ? 'Hybrid' : 'On-site'),
      familyInvolvement: i % 3 === 0 ? 'Moderate' : (i % 2 === 0 ? 'High' : 'Low'),
      verificationStatus,
      profileCompleteness: completeness,
      journeyStage: i % 6 === 0 ? 'in_discussion' : 'ready_for_matches',
      consentToShare: true,
      lastContactedAt: '2026-10-05T00:00:00.000Z',
      nextFollowUpDate: '2026-10-20T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
    };

    const candPrefs: PartnerPreferences = {
      id: `pref-cand-f-${i}`,
      customerId: fId,
      preferredAgeMin: age - 1,
      preferredAgeMax: age + 6,
      preferredLocations: [city, 'Mumbai', 'Bengaluru'],
      preferredEducation: ['Postgraduate', 'Bachelors'],
      preferredProfessions: ['Engineer', 'Founder', 'Product', 'Finance', 'Consultant'],
      preferredHeightMinCm: 172,
      preferredHeightMaxCm: 188,
      preferredIncomeMin: Math.max(2500000, prof.minInc - 1000000),
      preferredChildren: wantKids === 'No' ? ['No', 'Maybe'] : ['Yes', 'Maybe'],
      preferredRelocation: reloc === 'No' ? ['No'] : ['Yes', 'Maybe'],
      nonNegotiables: wantKids === 'No' ? ['No Children'] : (i % 3 === 0 ? ['Want Children'] : []),
    };

    customers.push(candProfile);
    preferences.push(candPrefs);
  }

  // Generate 55 Male Candidates (Potential matches for female customers)
  for (let i = 1; i <= 55; i++) {
    const mId = `cand-m-${i}`;
    const mFirst = MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length];
    const mLast = LAST_NAMES[(i * 4) % LAST_NAMES.length];
    const city = CITIES[(i * 2) % CITIES.length];
    const age = 26 + (i % 14); // 26 to 39
    const prof = professionsList[(i * 3) % professionsList.length];
    const college = COLLEGES[(i * 3) % COLLEGES.length];
    const verificationStatus = i % 9 === 0 ? 'unverified' : (i % 4 === 0 ? 'pending_review' : 'verified');
    const completeness = 75 + (i % 25);

    const wantKids = i % 10 === 0 ? 'No' : (i % 3 === 0 ? 'Maybe' : 'Yes');
    const reloc = i % 8 === 0 ? 'No' : (i % 3 === 0 ? 'Maybe' : 'Yes');
    const pets = i % 5 === 0 ? 'No' : (i % 2 === 0 ? 'Maybe' : 'Yes');
    const diet = i % 4 === 0 ? 'Vegetarian' : (i % 3 === 0 ? 'Eggetarian' : 'Non-veg');

    const candProfile: CustomerProfile = {
      id: mId,
      firstName: mFirst,
      lastName: mLast,
      gender: 'male',
      dateOfBirth: `${1988 + (38 - age)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      age,
      country: 'India',
      city,
      heightCm: 172 + (i % 17), // 172 - 188 cm
      email: `${mFirst.toLowerCase()}.${mLast.toLowerCase()}${i}@example.com`,
      phone: `+91 97${String(20000000 + i * 1387).slice(0, 8)}`,
      maritalStatus: i % 16 === 0 ? 'Divorced' : 'Never Married',
      educationLevel: prof.edu,
      undergraduateCollege: college,
      degree: prof.degree,
      currentCompany: prof.comp,
      designation: prof.title,
      annualIncomeRange: prof.range,
      annualIncomeMin: prof.minInc,
      annualIncomeMax: prof.maxInc,
      languagesKnown: pickRandomSubset(['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'], 2 + (i % 2)),
      siblingsCount: i % 3,
      religion: i % 8 === 0 ? 'Jain' : 'Hindu',
      caste: i % 5 === 0 ? 'Brahmin' : undefined,
      wantChildren: wantKids as 'Yes' | 'No' | 'Maybe',
      openToRelocation: reloc as 'Yes' | 'No' | 'Maybe',
      openToPets: pets as 'Yes' | 'No' | 'Maybe',
      dietaryPreference: diet,
      hobbies: pickRandomSubset(HOBBIES_POOL, 3 + (i % 3)),
      relationshipGoals: 'Ready for marriage with a warm, ambitious, family-oriented partner.',
      personalValues: pickRandomSubset(VALUES_POOL, 3 + (i % 2)),
      workArrangement: i % 3 === 0 ? 'Remote' : (i % 2 === 0 ? 'Hybrid' : 'On-site'),
      familyInvolvement: i % 3 === 0 ? 'Moderate' : 'High',
      verificationStatus,
      profileCompleteness: completeness,
      journeyStage: i % 5 === 0 ? 'in_discussion' : 'ready_for_matches',
      consentToShare: true,
      lastContactedAt: '2026-10-06T00:00:00.000Z',
      nextFollowUpDate: '2026-10-22T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
    };

    const candPrefs: PartnerPreferences = {
      id: `pref-cand-m-${i}`,
      customerId: mId,
      preferredAgeMin: Math.max(22, age - 5),
      preferredAgeMax: age,
      preferredLocations: [city, 'Mumbai', 'Bengaluru'],
      preferredEducation: ['Postgraduate', 'Bachelors'],
      preferredProfessions: ['Brand Director', 'Product Manager', 'Architect', 'Doctor', 'Consultant'],
      preferredHeightMinCm: 155,
      preferredHeightMaxCm: 175,
      preferredIncomeMin: 1500000,
      preferredChildren: wantKids === 'No' ? ['No', 'Maybe'] : ['Yes', 'Maybe'],
      preferredRelocation: reloc === 'No' ? ['No'] : ['Yes', 'Maybe'],
      nonNegotiables: wantKids === 'No' ? ['No Children'] : (i % 4 === 0 ? ['Want Children'] : []),
    };

    customers.push(candProfile);
    preferences.push(candPrefs);
  }

  // 3. Seed Realistic Operational Notes
  const notes = [
    {
      id: 'note-1',
      customerId: 'cust-m-1',
      matchmakerId: 'mm-lead-1',
      matchmakerName: 'Aditi Roy',
      noteText: 'Detailed 45-min consultation call with Rohan. Clarified preference for a partner with strong creative or intellectual pursuits. Open to relocation between Mumbai & Pune.',
      category: 'Call' as const,
      nextFollowUpDate: '2026-10-15T15:00:00.000Z',
      createdAt: '2026-10-10T11:15:00.000Z',
    },
    {
      id: 'note-2',
      customerId: 'cust-m-1',
      matchmakerId: 'mm-lead-1',
      matchmakerName: 'Aditi Roy',
      noteText: 'Verified BITS Pilani degrees and Stanford transcripts. Authenticated company incorporation papers. Profile verification marked complete.',
      category: 'General' as const,
      createdAt: '2026-10-08T14:30:00.000Z',
    },
    {
      id: 'note-3',
      customerId: 'cust-f-1',
      matchmakerId: 'mm-lead-1',
      matchmakerName: 'Aditi Roy',
      noteText: 'In-person coffee meeting at Bandra Club. Tara confirmed she is ready to initiate matches with founders or creative directors in Mumbai. Non-negotiable is non-smoker.',
      category: 'Meeting' as const,
      nextFollowUpDate: '2026-10-14T11:00:00.000Z',
      createdAt: '2026-10-11T12:45:00.000Z',
    },
    {
      id: 'note-4',
      customerId: 'cust-f-2',
      matchmakerId: 'mm-lead-1',
      matchmakerName: 'Aditi Roy',
      noteText: 'Priyanka emphasized intellectual parity and shared curiosity. Looking for someone supportive of her scientific research engagements.',
      category: 'Follow-up' as const,
      nextFollowUpDate: '2026-10-17T10:00:00.000Z',
      createdAt: '2026-10-12T09:30:00.000Z',
    },
  ];

  // 4. Pre-seeded Introduction Records
  const introductions = [
    {
      id: 'intro-init-1',
      customerId: 'cust-m-2',
      candidateId: 'cand-f-4',
      customMessage: 'Dear Siddharth, thrilled to introduce Sneha Iyer, Senior Product Manager at Swiggy. You both share a love for marathon training and specialty coffee.',
      sentByMatchmakerId: 'mm-lead-1',
      sentAt: '2026-10-09T17:00:00.000Z',
      status: 'sent' as const,
    },
  ];

  return {
    matchmakers,
    customers,
    preferences,
    notes,
    introductions,
  };
}
