import postgres from 'postgres';
import { generateSyntheticDataset } from '../lib/data/synthetic';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require', max: 5 });

async function migrate() {
  console.log('🔄 Creating Neon PostgreSQL tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Senior Matchmaker',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: users');

  await sql`
    CREATE TABLE IF NOT EXISTS matchmakers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Senior Matchmaker',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: matchmakers');

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      age INTEGER NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      city TEXT NOT NULL,
      height_cm INTEGER NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      marital_status TEXT NOT NULL,
      education_level TEXT NOT NULL,
      undergraduate_college TEXT NOT NULL,
      degree TEXT NOT NULL,
      current_company TEXT NOT NULL,
      designation TEXT NOT NULL,
      annual_income_range TEXT NOT NULL,
      annual_income_min INTEGER NOT NULL,
      annual_income_max INTEGER NOT NULL,
      languages_known JSONB NOT NULL,
      siblings_count INTEGER NOT NULL DEFAULT 0,
      siblings_details TEXT,
      religion TEXT,
      caste TEXT,
      want_children TEXT NOT NULL,
      open_to_relocation TEXT NOT NULL,
      open_to_pets TEXT NOT NULL,
      dietary_preference TEXT,
      hobbies JSONB NOT NULL,
      relationship_goals TEXT NOT NULL,
      personal_values JSONB NOT NULL,
      work_arrangement TEXT NOT NULL DEFAULT 'Hybrid',
      family_involvement TEXT NOT NULL DEFAULT 'Moderate',
      verification_status TEXT NOT NULL DEFAULT 'pending_review',
      profile_completeness INTEGER NOT NULL DEFAULT 80,
      journey_stage TEXT NOT NULL DEFAULT 'profile_review',
      assigned_matchmaker_id TEXT,
      consent_to_share BOOLEAN NOT NULL DEFAULT true,
      last_contacted_at TIMESTAMP,
      next_follow_up_date TIMESTAMP,
      avatar_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: customers');

  await sql`
    CREATE TABLE IF NOT EXISTS partner_preferences (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      preferred_age_min INTEGER,
      preferred_age_max INTEGER,
      preferred_locations JSONB,
      preferred_education JSONB,
      preferred_professions JSONB,
      preferred_height_min_cm INTEGER,
      preferred_height_max_cm INTEGER,
      preferred_income_min INTEGER,
      preferred_children JSONB,
      preferred_relocation JSONB,
      preferred_dietary JSONB,
      preferred_languages JSONB,
      other_requirements TEXT,
      non_negotiables JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: partner_preferences');

  await sql`
    CREATE TABLE IF NOT EXISTS customer_notes (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      matchmaker_id TEXT NOT NULL,
      matchmaker_name TEXT NOT NULL,
      note_text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      next_follow_up_date TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: customer_notes');

  await sql`
    CREATE TABLE IF NOT EXISTS match_recommendations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      candidate_id TEXT NOT NULL REFERENCES customers(id),
      overall_score INTEGER NOT NULL,
      score_coverage INTEGER NOT NULL,
      factor_scores JSONB NOT NULL,
      strengths JSONB,
      potential_conflicts JSONB,
      unknowns JSONB,
      eligibility_reasons JSONB,
      explanation_source TEXT NOT NULL DEFAULT 'deterministic',
      explanation TEXT,
      intro_draft TEXT,
      status TEXT NOT NULL DEFAULT 'recommended',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✅ Created table: match_recommendations');

  await sql`
    CREATE TABLE IF NOT EXISTS match_introductions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      candidate_id TEXT NOT NULL REFERENCES customers(id),
      match_recommendation_id TEXT,
      custom_message TEXT NOT NULL,
      sent_by_matchmaker_id TEXT NOT NULL,
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'sent'
    );
  `;
  console.log('✅ Created table: match_introductions');

  // Seed default operator user into Neon if not present
  const dataset = generateSyntheticDataset();
  for (const mm of dataset.matchmakers) {
    await sql`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (${mm.id}, ${mm.name}, ${mm.email.toLowerCase()}, ${mm.passwordHash}, ${mm.role})
      ON CONFLICT (email) DO NOTHING
    `;
    await sql`
      INSERT INTO matchmakers (id, name, email, password_hash, role)
      VALUES (${mm.id}, ${mm.name}, ${mm.email.toLowerCase()}, ${mm.passwordHash}, ${mm.role})
      ON CONFLICT (email) DO NOTHING
    `;
  }
  console.log('✅ Seeded initial operator user into users & matchmakers');

  console.log('🎉 Neon DB migration completed successfully!');
  await sql.end();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await sql.end();
  process.exit(1);
});
