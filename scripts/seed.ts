import { generateSyntheticDataset } from '../lib/data/synthetic';

async function main() {
  console.log('🌱 Starting synthetic data seed for The Date Crew (TDC) Matchmaker Workspace...');
  
  const dataset = generateSyntheticDataset();

  console.log(`✅ Seeded ${dataset.matchmakers.length} matchmaker accounts:`);
  for (const mm of dataset.matchmakers) {
    console.log(`   - ${mm.name} (${mm.email}) - Role: ${mm.role}`);
  }

  const maleCount = dataset.customers.filter(c => c.gender === 'male').length;
  const femaleCount = dataset.customers.filter(c => c.gender === 'female').length;
  const verifiedCount = dataset.customers.filter(c => c.verificationStatus === 'verified').length;

  console.log(`✅ Seeded ${dataset.customers.length} total customer profiles:`);
  console.log(`   - Men: ${maleCount}`);
  console.log(`   - Women: ${femaleCount}`);
  console.log(`   - Verified Profiles: ${verifiedCount}`);
  console.log(`✅ Seeded ${dataset.preferences.length} partner preference specifications.`);
  console.log(`✅ Seeded ${dataset.notes.length} historical consultation notes.`);
  console.log(`✅ Seeded ${dataset.introductions.length} match introduction records.`);

  console.log('\n✨ Database seeding completed successfully! Demo accounts ready.');
}

main().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
