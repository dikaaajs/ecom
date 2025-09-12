import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create initial admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log(`✅ Created admin user: ${adminUser.username}`)

  // Create sample products
  const sampleProducts = [
    {
      id: 'pixel-keychain-1',
      title: 'Retro Gaming Keychain',
      description: 'Classic 8-bit style gaming controller keychain with vibrant pixel art design',
      price: 12.99,
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
      tags: ['keychain', 'gaming', 'retro', '8-bit'],
      category: 'accessories',
      inStock: true,
    },
    {
      id: 'pixel-tote-1',
      title: 'Pixel Art Tote Bag',
      description: 'Spacious canvas tote bag featuring original pixel art characters',
      price: 24.99,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      tags: ['tote bag', 'canvas', 'pixel art', 'characters'],
      category: 'bags',
      inStock: true,
    },
    {
      id: 'pixel-sticker-pack-1',
      title: 'Pixel Sticker Pack - Heroes',
      description: 'Set of 12 high-quality vinyl stickers featuring pixel art heroes and villains',
      price: 8.99,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      tags: ['stickers', 'vinyl', 'heroes', 'pack'],
      category: 'stickers',
      inStock: true,
    },
    {
      id: 'pixel-print-1',
      title: 'Cyberpunk City Print',
      description: 'High-quality art print of a futuristic cyberpunk cityscape in pixel art style',
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
      tags: ['print', 'cyberpunk', 'city', 'futuristic'],
      category: 'prints',
      inStock: true,
    },
    {
      id: 'pixel-keychain-2',
      title: 'Space Explorer Keychain',
      description: 'Adorable pixel art astronaut keychain perfect for space enthusiasts',
      price: 11.99,
      imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=400&fit=crop',
      tags: ['keychain', 'space', 'astronaut', 'cute'],
      category: 'accessories',
      inStock: true,
    },
    {
      id: 'pixel-sticker-pack-2',
      title: 'Pixel Sticker Pack - Animals',
      description: 'Cute pixel art animal stickers featuring cats, dogs, and woodland creatures',
      price: 7.99,
      imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=400&fit=crop',
      tags: ['stickers', 'animals', 'cute', 'woodland'],
      category: 'stickers',
      inStock: true,
    },
  ]

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  console.log(`✅ Created ${sampleProducts.length} sample products`)

  // Create initial site settings
  const siteSettings = [
    { key: 'siteName', value: 'Pixel Perfection' },
    { key: 'siteDescription', value: 'Premium pixel art merchandise and custom designs for gaming enthusiasts and art lovers.' },
    { key: 'contactEmail', value: 'hello@pixelperfection.com' },
    { key: 'storeAddress', value: '123 Pixel Street, Art District, Creative City 12345' },
    { key: 'socialInstagram', value: 'https://instagram.com/pixelperfection' },
    { key: 'socialWhatsapp', value: 'https://wa.me/1234567890' },
    { key: 'faqGeneral', value: JSON.stringify([
      {
        question: 'What is pixel art?',
        answer: 'Pixel art is a form of digital art where images are created and edited at the pixel level, giving them a distinctive retro, blocky appearance reminiscent of early video games.'
      },
      {
        question: 'Do you offer custom designs?',
        answer: 'Yes! We create custom pixel art designs for personal use, businesses, and special occasions. Contact us to discuss your project.'
      },
      {
        question: 'What materials do you use?',
        answer: 'We use high-quality materials including durable vinyl for stickers, premium canvas for tote bags, and metal keychains with protective coating.'
      }
    ]) },
    { key: 'shippingInfo', value: 'We offer worldwide shipping with tracking. Orders typically ship within 2-3 business days.' },
  ]

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log(`✅ Created ${siteSettings.length} site settings`)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })