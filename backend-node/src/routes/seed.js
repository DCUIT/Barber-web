import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';

export async function seedDatabase() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || '123';

  // Nếu dùng SQLite MVP thì không seed bằng mongoose models.
  // (MVP SQLite schema sẽ được tạo ở sqlite.js; việc seed thêm sẽ làm sau khi endpoints sqlite được nối.)
  // detect sqlite driver also when running with CLI flag (--driver=sqlite)
  const argvDriver = process.argv.find(a => a.startsWith('--driver='))?.split('=')[1];
  const effectiveDriver = (argvDriver ?? process.env.DB_DRIVER ?? '').toLowerCase();

  if (effectiveDriver === 'sqlite') {
    console.log('SQLite driver enabled: skip mongoose seed');
    return;
  }


  const existingAdmin = await User.findOne({ username: adminUsername });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminUsername, passwordHash, role: 'admin' });
    console.log('Seeded admin');
  }

  const servicesCount = await Service.countDocuments({});
  if (servicesCount === 0) {
    await Service.create([
      {
        name: 'Fade Cut',
        price: 120000,
        durationMinutes: 45,
        description: 'Kiểu fade hiện đại',
        image: ''
      },
      {
        name: 'Undercut',
        price: 150000,
        durationMinutes: 60,
        description: 'Undercut sắc nét',
        image: ''
      },
      {
        name: 'Hair Tattoo',
        price: 200000,
        durationMinutes: 60,
        description: 'Tạo hình tattoo tóc',
        image: ''
      },
      {
        name: 'Hair Wash',
        price: 60000,
        durationMinutes: 20,
        description: 'Gội và massage thư giãn',
        image: ''
      }
    ]);
    console.log('Seeded services');
  }

  const barbersCount = await Barber.countDocuments({});
  if (barbersCount === 0) {
    await Barber.create([
      {
        name: 'Alex',
        avatar: '',
        experienceYears: 5,
        specialty: 'Fade & Undercut',
        rating: 4.8,
        workingHours: {
          mon: [{ start: '09:00', end: '17:00' }],
          tue: [{ start: '09:00', end: '17:00' }],
          wed: [{ start: '09:00', end: '17:00' }],
          thu: [{ start: '09:00', end: '17:00' }],
          fri: [{ start: '09:00', end: '17:00' }],
          sat: [{ start: '09:00', end: '15:00' }],
          sun: []
        }
      },
      {
        name: 'Sam',
        avatar: '',
        experienceYears: 3,
        specialty: 'Hair Tattoo',
        rating: 4.6,
        workingHours: {
          mon: [{ start: '10:00', end: '18:00' }],
          tue: [{ start: '10:00', end: '18:00' }],
          wed: [{ start: '10:00', end: '18:00' }],
          thu: [{ start: '10:00', end: '18:00' }],
          fri: [{ start: '10:00', end: '18:00' }],
          sat: [{ start: '10:00', end: '14:00' }],
          sun: []
        }
      }
    ]);
    console.log('Seeded barbers');
  }
}


