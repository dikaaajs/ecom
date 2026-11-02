import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    // Public storefront settings must never expose the warehouse/sender address.
    const settings = await prisma.siteSetting.findMany({
      where: { key: { notIn: ['shippingOrigin'] } },
    })

    // Transform array of key-value pairs into an object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Provide default values for common settings if they don't exist
    const defaultSettings : any = {
      siteName: 'Pixel Perfection',
      siteDescription: 'Premium pixel art merchandise and custom designs',
      contactEmail: 'hello@pixelperfection.com',
      storeAddress: '',
      socialLinks: '{}',
      ...settingsObject
    }

    // Parse JSON fields
    try {
      defaultSettings.socialLinks = JSON.parse(defaultSettings.socialLinks)
    } catch {
      defaultSettings.socialLinks = {}
    }

    return NextResponse.json({
      success: true,
      data: defaultSettings
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service Unavailable',
          message: 'Database connection failed'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch site settings'
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    try {
      const body = await req.json()
  
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        )
      }
  
      const parsed = z.record(z.string().min(1).max(100), z.union([z.string().max(10000), z.number(), z.boolean(), z.record(z.string(), z.unknown())])).safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: "Invalid settings", issues: parsed.error.flatten() }, { status: 400 })
      // Shipping origin is edited exclusively via the validated admin-only endpoint.
      if (Object.prototype.hasOwnProperty.call(parsed.data, 'shippingOrigin')) {
        return NextResponse.json({ error: 'Use /api/admin/shipping-origin for this setting' }, { status: 400 })
      }
      const updates = Object.entries(parsed.data) as [string, any][]
  
      // lakukan upsert untuk setiap key
      const results = await Promise.all(
        updates.map(async ([key, value]) => {
          return prisma.siteSetting.upsert({
            where: { key },
            update: { value: typeof value === 'object' ? JSON.stringify(value) : String(value) },
            create: { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) },
          })
        })
      )
  
      return NextResponse.json(
        {
          success: true,
          message: "Settings updated successfully",
          data: results,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error("Error updating settings:", error)
  
      if (error instanceof Error && error.message.includes("connect")) {
        return NextResponse.json(
          {
            success: false,
            error: "Service Unavailable",
            message: "Database connection failed",
          },
          { status: 503 }
        )
      }
  
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to update site settings",
        },
        { status: 500 }
      )
    }
  }