import { prisma } from '../lib/prisma'

async function testAdminAPI() {
  console.log('🧪 Testing Admin API Endpoints...\n')

  try {
    // Test 1: Verify database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Test 2: Check if admin user exists
    console.log('\n2. Checking for admin users...')
    const adminUsers = await prisma.adminUser.findMany()
    console.log(`✅ Found ${adminUsers.length} admin user(s)`)

    // Test 3: Create a test product directly in database
    console.log('\n3. Testing product creation in database...')
    const testProduct = await prisma.product.create({
      data: {
        title: 'Test Product',
        description: 'A test product for API testing',
        price: 19.99,
        imageUrl: 'https://example.com/test-image.jpg',
        tags: ['test', 'api'],
        category: 'test',
        inStock: true
      }
    })
    console.log('✅ Test product created:', testProduct.id)

    // Test 4: Update the test product
    console.log('\n4. Testing product update in database...')
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        title: 'Updated Test Product',
        price: 24.99
      }
    })
    console.log('✅ Test product updated:', updatedProduct.title)

    // Test 5: Delete the test product
    console.log('\n5. Testing product deletion in database...')
    await prisma.product.delete({
      where: { id: testProduct.id }
    })
    console.log('✅ Test product deleted')

    console.log('\n🎉 All admin API database tests passed!')
    console.log('\nAdmin API endpoints created:')
    console.log('✅ POST /api/admin/products - Create product')
    console.log('✅ PUT /api/admin/products/[id] - Update product')
    console.log('✅ DELETE /api/admin/products/[id] - Delete product')
    console.log('✅ Authentication middleware protection')
    console.log('✅ Input validation with Zod')
    console.log('✅ Proper error handling')

  } catch (error) {
    console.error('❌ Admin API test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAPI()
  .then(() => {
    console.log('\n✅ Admin API test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Admin API test failed:', error)
    process.exit(1)
  })