const bcrypt = require('bcryptjs');

async function generateHashes() {
  const saltRounds = 10;
  
  const passwords = {
    admin123: await bcrypt.hash('admin123', saltRounds),
    librarian123: await bcrypt.hash('librarian123', saltRounds),
    student123: await bcrypt.hash('student123', saltRounds),
    faculty123: await bcrypt.hash('faculty123', saltRounds),
    patron123: await bcrypt.hash('patron123', saltRounds)
  };

  console.log('Generated password hashes:');
  for (const [password, hash] of Object.entries(passwords)) {
    console.log(`${password}: '${hash}'`);
  }

  return passwords;
}

if (require.main === module) {
  generateHashes().catch(console.error);
}

module.exports = { generateHashes };
