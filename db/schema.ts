import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const matchmakers = pgTable("matchmakers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("Senior Matchmaker"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("Senior Matchmaker"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender").notNull(), // 'male' | 'female'
  dateOfBirth: text("date_of_birth").notNull(),
  age: integer("age").notNull(),
  country: text("country").notNull().default("India"),
  city: text("city").notNull(),
  heightCm: integer("height_cm").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  maritalStatus: text("marital_status").notNull(),
  
  educationLevel: text("education_level").notNull(),
  undergraduateCollege: text("undergraduate_college").notNull(),
  degree: text("degree").notNull(),
  currentCompany: text("current_company").notNull(),
  designation: text("designation").notNull(),
  annualIncomeRange: text("annual_income_range").notNull(),
  annualIncomeMin: integer("annual_income_min").notNull(),
  annualIncomeMax: integer("annual_income_max").notNull(),

  languagesKnown: jsonb("languages_known").notNull().$type<string[]>(),
  siblingsCount: integer("siblings_count").notNull().default(0),
  siblingsDetails: text("siblings_details"),
  religion: text("religion"),
  caste: text("caste"),

  wantChildren: text("want_children").notNull(), // 'Yes' | 'No' | 'Maybe'
  openToRelocation: text("open_to_relocation").notNull(),
  openToPets: text("open_to_pets").notNull(),
  dietaryPreference: text("dietary_preference"),
  hobbies: jsonb("hobbies").notNull().$type<string[]>(),
  relationshipGoals: text("relationship_goals").notNull(),
  personalValues: jsonb("personal_values").notNull().$type<string[]>(),
  workArrangement: text("work_arrangement").notNull().default("Hybrid"),
  familyInvolvement: text("family_involvement").notNull().default("Moderate"),

  verificationStatus: text("verification_status").notNull().default("pending_review"),
  profileCompleteness: integer("profile_completeness").notNull().default(80),
  journeyStage: text("journey_stage").notNull().default("profile_review"),
  assignedMatchmakerId: text("assigned_matchmaker_id"),
  consentToShare: boolean("consent_to_share").notNull().default(true),
  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerPreferences = pgTable("partner_preferences", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  preferredAgeMin: integer("preferred_age_min"),
  preferredAgeMax: integer("preferred_age_max"),
  preferredLocations: jsonb("preferred_locations").$type<string[]>(),
  preferredEducation: jsonb("preferred_education").$type<string[]>(),
  preferredProfessions: jsonb("preferred_professions").$type<string[]>(),
  preferredHeightMinCm: integer("preferred_height_min_cm"),
  preferredHeightMaxCm: integer("preferred_height_max_cm"),
  preferredIncomeMin: integer("preferred_income_min"),
  preferredChildren: jsonb("preferred_children").$type<string[]>(),
  preferredRelocation: jsonb("preferred_relocation").$type<string[]>(),
  preferredDietary: jsonb("preferred_dietary").$type<string[]>(),
  preferredLanguages: jsonb("preferred_languages").$type<string[]>(),
  otherRequirements: text("other_requirements"),
  nonNegotiables: jsonb("non_negotiables").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerNotes = pgTable("customer_notes", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  matchmakerId: text("matchmaker_id").notNull(),
  matchmakerName: text("matchmaker_name").notNull(),
  noteText: text("note_text").notNull(),
  category: text("category").notNull().default("General"), // 'Call' | 'Meeting' | 'Follow-up' | 'General'
  nextFollowUpDate: timestamp("next_follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchRecommendations = pgTable("match_recommendations", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  candidateId: text("candidate_id").notNull().references(() => customers.id),
  overallScore: integer("overall_score").notNull(),
  scoreCoverage: integer("score_coverage").notNull(),
  factorScores: jsonb("factor_scores").notNull(),
  strengths: jsonb("strengths").$type<string[]>(),
  potentialConflicts: jsonb("potential_conflicts").$type<string[]>(),
  unknowns: jsonb("unknowns").$type<string[]>(),
  eligibilityReasons: jsonb("eligibility_reasons").$type<string[]>(),
  explanationSource: text("explanation_source").notNull().default("deterministic"),
  explanation: text("explanation"),
  introDraft: text("intro_draft"),
  status: text("status").notNull().default("recommended"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const matchIntroductions = pgTable("match_introductions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  candidateId: text("candidate_id").notNull().references(() => customers.id),
  matchRecommendationId: text("match_recommendation_id"),
  customMessage: text("custom_message").notNull(),
  sentByMatchmakerId: text("sent_by_matchmaker_id").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").notNull().default("sent"),
});

export type Matchmaker = typeof matchmakers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type PartnerPreference = typeof partnerPreferences.$inferSelect;
export type CustomerNote = typeof customerNotes.$inferSelect;
export type MatchRecommendation = typeof matchRecommendations.$inferSelect;
export type MatchIntroduction = typeof matchIntroductions.$inferSelect;
