/**
 * Admin Curriculum Export API
 * Export curriculum data to JSON, CSV, or XLSX format
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  exportToJSON,
  exportToCSV,
  exportToXLSX,
  getContentType,
  generateFilename,
  type CurriculumBranch
} from '@/lib/curriculum-export'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const format = (searchParams.get('format') as 'json' | 'csv' | 'xlsx') || 'xlsx'
    const branchId = searchParams.get('branchId')

    // Validate format
    if (!['json', 'csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'صيغة غير صالحة. استخدم json أو csv أو xlsx' },
        { status: 400 }
      )
    }

    // Build query
    const whereClause = branchId ? { id: branchId } : {}

    // Fetch curriculum data with full hierarchy
    const branches = await prisma.branch.findMany({
      where: whereClause,
      include: {
        subjects: {
          include: {
            units: {
              include: {
                lessons: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Transform to export format
    const exportData: CurriculumBranch[] = branches.map(branch => ({
      id: branch.id,
      nameAr: branch.nameAr,
      nameEn: branch.nameEn,
      code: branch.code,
      order: branch.order,
      subjects: branch.subjects.map(subject => ({
        id: subject.id,
        nameAr: subject.nameAr,
        nameEn: subject.nameEn,
        order: subject.order,
        units: subject.units.map(unit => ({
          id: unit.id,
          nameAr: unit.nameAr,
          nameEn: unit.nameEn,
          order: unit.order,
          lessons: unit.lessons.map(lesson => ({
            id: lesson.id,
            nameAr: lesson.nameAr,
            nameEn: lesson.nameEn,
            order: lesson.order,
            duration: lesson.duration
          }))
        }))
      }))
    }))

    // Check if there's data to export
    if (exportData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتصدير' },
        { status: 404 }
      )
    }

    // Generate export content based on format
    let content: Buffer | string
    switch (format) {
      case 'json':
        content = exportToJSON(exportData)
        break
      case 'csv':
        // Add BOM for proper Arabic display in Excel
        content = '\uFEFF' + exportToCSV(exportData)
        break
      case 'xlsx':
      default:
        content = exportToXLSX(exportData)
        break
    }

    // Generate filename
    const branchCode = branchId ? (branches[0]?.code ?? undefined) : undefined
    const filename = generateFilename(format, branchCode)

    // Create response with proper headers
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', getContentType(format))
    responseHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`)
    responseHeaders.set('Cache-Control', 'no-cache')
    
    // For XLSX, add specific headers
    if (format === 'xlsx') {
      responseHeaders.set('Content-Length', String((content as Buffer).length))
    }

    return new NextResponse(content as BodyInit, {
      status: 200,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('Export curriculum error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التصدير' },
      { status: 500 }
    )
  }
}
