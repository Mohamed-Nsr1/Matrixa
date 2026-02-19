/**
 * Admin Curriculum Import API
 * Import curriculum data from file (JSON, CSV, XLSX)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  parseImportFile,
  validateImportData,
  importCurriculum,
  detectFileFormat,
  type ImportMode
} from '@/lib/curriculum-import'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get mode from query params
    const searchParams = request.nextUrl.searchParams
    const mode = (searchParams.get('mode') as ImportMode) || 'merge'

    // Validate mode
    if (!['replace', 'merge', 'append'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'وضع غير صالح. استخدم replace أو merge أو append' },
        { status: 400 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم تحديد ملف' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)' },
        { status: 400 }
      )
    }

    // Detect file format
    const format = detectFileFormat(file.name, file.type)
    if (!format) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'صيغة الملف غير مدعومة. استخدم JSON أو CSV أو XLSX' 
        },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse file
    let data
    try {
      data = parseImportFile(buffer, format)
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `خطأ في قراءة الملف: ${parseError instanceof Error ? parseError.message : 'خطأ غير معروف'}` 
        },
        { status: 400 }
      )
    }

    // Check if data is empty
    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الملف فارغ أو لا يحتوي على بيانات صالحة' },
        { status: 400 }
      )
    }

    // Validate data
    const validationErrors = validateImportData(data)
    if (validationErrors.length > 0) {
      // Limit errors to first 10 for response
      const displayErrors = validationErrors.slice(0, 10)
      return NextResponse.json(
        {
          success: false,
          error: 'بيانات غير صالحة',
          validationErrors: displayErrors,
          totalErrors: validationErrors.length
        },
        { status: 400 }
      )
    }

    // Warning for replace mode
    if (mode === 'replace') {
      // Count existing curriculum
      // const existingCount = await prisma.lesson.count()
      // Could add confirmation requirement here
    }

    // Import data
    const result = await importCurriculum(data, mode)

    return NextResponse.json({
      success: result.success,
      result: {
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        totalRows: result.totalRows,
        processedRows: result.processedRows
      }
    })
  } catch (error) {
    console.error('Import curriculum error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `حدث خطأ أثناء الاستيراد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` 
      },
      { status: 500 }
    )
  }
}
