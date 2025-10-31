import bcrypt from 'bcryptjs';

const password = 'Admin@2023'; // This will be the admin password
bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
  console.log('Original password (save this):', password);
});