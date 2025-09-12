import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'

async function setupDatabase() {
  try {
    console.log('Setting up database...')

    // Create initial admin user
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    const hashedPassword = await hashPassword(adminPassword)

    const existingAdmin = await prisma.adminUser.findUnique({
      where: { username: adminUsername }
    })

    if (!existingAdmin) {
      await prisma.adminUser.create({
        data: {
          username: adminUsername,
          password: hashedPassword,
          role: 'admin'
        }
      })
      console.log(`✅ Created admin user: ${adminUsername}`)
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminUsername}`)
    }

    // Create initial site settings
    const defaultSettings = [
      { key: 'siteName', value: 'Pixel Perfection' },
      { key: 'siteDescription', value: 'Premium pixel art merchandise and custom designs' },
      { key: 'contactEmail', value: 'hello@pixelperfection.com' },
      { key: 'storeAddress', value: '123 Pixel Street, Art District, Creative City' },
      { key: 'socialLinks', value: JSON.stringify({ instagram: '', whatsapp: '' }) }
    ]

    for (const setting of defaultSettings) {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    }

    console.log('✅ Created default site settings')
    console.log('🎉 Database setup complete!')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()