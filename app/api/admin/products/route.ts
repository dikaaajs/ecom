import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for product creation
const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  inStock: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Create product in database
    const product = await prisma.product.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        tags: validatedData.tags,
        category: validatedData.category,
        inStock: validatedData.inStock
      }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Product created successfully',
        data: product 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation Error',
          message: 'Invalid product data',
          details: error.cause
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create product'
      },
      { status: 500 }
    )
  }
}