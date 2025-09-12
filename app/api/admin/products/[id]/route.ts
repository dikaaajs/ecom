import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for product updates
const updateProductSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  inStock: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Update product in database
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct 
      },
      { status: 200 }
    )

  } catch (error : any) {
    console.error('Error updating product:', error)

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
        message: 'Failed to update product'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Product deleted successfully',
        data: existingProduct
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting product:', error)

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete product'
      },
      { status: 500 }
    )
  }
}