import { createAdminUser } from '../lib/auth-utils'

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  try {
    const adminUser = await createAdminUser(username, password)
    console.log('Admin user created successfully:', adminUser)
  } catch (error) {
    console.error('Failed to create admin user:', error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })