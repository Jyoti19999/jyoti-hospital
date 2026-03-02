const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Test@123';
  const hash = await bcrypt.hash(password, 10);
  console.log('\n🔐 Password Hash Generated:');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nYou can use this hash to update staff passwords in the database.');
}

generateHash();
