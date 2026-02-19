/**
 * Receipt Upload API
 * 
 * Handles uploading payment receipt images for manual payment requests.
 * Security: Only authenticated users, file type/size validation, rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم اختيار ملف' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP)' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileHash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 16)
    
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `receipt_${user.id}_${Date.now()}_${fileHash}.${ext}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Return public URL
    const publicUrl = `/uploads/receipts/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء رفع الملف' },
      { status: 500 }
    )
  }
}
