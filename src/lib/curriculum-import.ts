/**
 * Curriculum Import Utilities
 * Parse and import curriculum data from files
 */

import * as XLSX from 'xlsx'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Types for import data
export interface ImportDataRow {
  branch_code: string
  branch_name_ar: string
  branch_name_en: string
  subject_name_ar: string
  subject_name_en: string
  unit_name_ar: string
  unit_name_en: string
  lesson_name_ar: string
  lesson_name_en: string
  order?: number
  lesson_duration?: number | null
}

export interface ValidationError {
  row: number
  field: string
  message: string
}

export interface ImportResult {
  success: boolean
  created: {
    branches: number
    subjects: number
    units: number
    lessons: number
  }
  updated: {
    branches: number
    subjects: number
    units: number
    lessons: number
  }
  errors: ValidationError[]
  totalRows: number
  processedRows: number
}

export type ImportMode = 'replace' | 'merge' | 'append'

// Required columns for import
const REQUIRED_COLUMNS = [
  'branch_code',
  'branch_name_ar',
  'branch_name_en',
  'subject_name_ar',
  'subject_name_en',
  'unit_name_ar',
  'unit_name_en',
  'lesson_name_ar',
  'lesson_name_en'
]

// Column aliases for flexibility
const COLUMN_ALIASES: Record<string, string[]> = {
  'branch_code': ['branch_code', 'كود_الشعبة', 'branchcode'],
  'branch_name_ar': ['branch_name_ar', 'اسم_الشعبة_عربي', 'branchnamear', 'branch_name_arabic'],
  'branch_name_en': ['branch_name_en', 'اسم_الشعبة_إنجليزي', 'branchnameen', 'branch_name_english'],
  'subject_name_ar': ['subject_name_ar', 'اسم_المادة_عربي', 'subjectnamear', 'subject_name_arabic'],
  'subject_name_en': ['subject_name_en', 'اسم_المادة_إنجليزي', 'subjectnameen', 'subject_name_english'],
  'unit_name_ar': ['unit_name_ar', 'اسم_الوحدة_عربي', 'unitnamear', 'unit_name_arabic'],
  'unit_name_en': ['unit_name_en', 'اسم_الوحدة_إنجليزي', 'unitnameen', 'unit_name_english'],
  'lesson_name_ar': ['lesson_name_ar', 'اسم_الدرس_عربي', 'lessonnamear', 'lesson_name_arabic'],
  'lesson_name_en': ['lesson_name_en', 'اسم_الدرس_إنجليزي', 'lessonnameen', 'lesson_name_english'],
  'order': ['order', 'الترتيب', 'lesson_order'],
  'lesson_duration': ['lesson_duration', 'مدة_الدرس', 'duration', 'lessonduration']
}

/**
 * Normalize column headers to standard names
 */
function normalizeHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_')
    
    for (const [standardName, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(alias => alias.toLowerCase() === normalizedHeader || 
          alias.toLowerCase() === header.toLowerCase().trim())) {
        mapping[header] = standardName
        break
      }
    }
  }
  
  return mapping
}

/**
 * Parse uploaded file and extract data
 */
export function parseImportFile(buffer: Buffer, format: 'json' | 'csv' | 'xlsx'): ImportDataRow[] {
  let data: ImportDataRow[] = []

  switch (format) {
    case 'json':
      data = JSON.parse(buffer.toString('utf-8')) as ImportDataRow[]
      break

    case 'csv':
    case 'xlsx': {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Get headers
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })
      
      if (jsonData.length === 0) {
        return []
      }

      // Normalize headers
      const headers = Object.keys(jsonData[0])
      const headerMapping = normalizeHeaders(headers)
      
      // Transform rows with normalized headers
      data = jsonData.map((row) => {
        const normalizedRow: Record<string, unknown> = {}
        
        for (const [originalKey, value] of Object.entries(row)) {
          const normalizedKey = headerMapping[originalKey] || originalKey
          normalizedRow[normalizedKey] = value
        }
        
        return normalizedRow as unknown as ImportDataRow
      })
      break
    }
  }

  return data
}

/**
 * Validate import data structure
 */
export function validateImportData(data: ImportDataRow[]): ValidationError[] {
  const errors: ValidationError[] = []

  data.forEach((row, index) => {
    for (const column of REQUIRED_COLUMNS) {
      const value = row[column as keyof ImportDataRow]
      if (value === undefined || value === null || value === '') {
        errors.push({
          row: index + 2, // +2 for 1-based index and header row
          field: column,
          message: `الحقل "${column}" مطلوب`
        })
      }
    }
  })

  return errors
}

/**
 * Import curriculum data with transaction
 */
export async function importCurriculum(
  data: ImportDataRow[],
  mode: ImportMode
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    created: { branches: 0, subjects: 0, units: 0, lessons: 0 },
    updated: { branches: 0, subjects: 0, units: 0, lessons: 0 },
    errors: [],
    totalRows: data.length,
    processedRows: 0
  }

  try {
    await prisma.$transaction(async (tx) => {
      // In replace mode, delete all existing curriculum data
      if (mode === 'replace') {
        await tx.lesson.deleteMany({})
        await tx.unit.deleteMany({})
        await tx.subject.deleteMany({})
        await tx.branch.deleteMany({})
      }

      // Track created entities to avoid duplicates within import
      const branchMap = new Map<string, string>() // code -> id
      const subjectMap = new Map<string, string>() // branchId_nameAr -> id
      const unitMap = new Map<string, string>() // subjectId_nameAr -> id
      const lessonMap = new Map<string, string>() // unitId_nameAr -> id

      // Pre-load existing entities for merge/append mode
      if (mode !== 'replace') {
        const existingBranches = await tx.branch.findMany()
        existingBranches.forEach(b => branchMap.set(b.code, b.id))

        const existingSubjects = await tx.subject.findMany()
        existingSubjects.forEach(s => subjectMap.set(`${s.branchId}_${s.nameAr}`, s.id))

        const existingUnits = await tx.unit.findMany()
        existingUnits.forEach(u => unitMap.set(`${u.subjectId}_${u.nameAr}`, u.id))

        const existingLessons = await tx.lesson.findMany()
        existingLessons.forEach(l => lessonMap.set(`${l.unitId}_${l.nameAr}`, l.id))
      }

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2

        try {
          // 1. Find or create Branch
          let branchId = branchMap.get(row.branch_code)
          
          if (!branchId) {
            const existingBranch = mode !== 'replace' ? 
              await tx.branch.findUnique({ where: { code: row.branch_code } }) : null
            
            if (existingBranch) {
              branchId = existingBranch.id
              branchMap.set(row.branch_code, branchId)
              
              // Update branch names if different
              if (existingBranch.nameAr !== row.branch_name_ar || 
                  existingBranch.nameEn !== row.branch_name_en) {
                await tx.branch.update({
                  where: { id: branchId },
                  data: {
                    nameAr: row.branch_name_ar,
                    nameEn: row.branch_name_en
                  }
                })
                result.updated.branches++
              }
            } else {
              const newBranch = await tx.branch.create({
                data: {
                  code: row.branch_code,
                  nameAr: row.branch_name_ar,
                  nameEn: row.branch_name_en,
                  order: 0,
                  isActive: true
                }
              })
              branchId = newBranch.id
              branchMap.set(row.branch_code, branchId)
              result.created.branches++
            }
          }

          // 2. Find or create Subject
          const subjectKey = `${branchId}_${row.subject_name_ar}`
          let subjectId = subjectMap.get(subjectKey)
          
          if (!subjectId) {
            const existingSubject = mode !== 'replace' ?
              await tx.subject.findFirst({
                where: { branchId, nameAr: row.subject_name_ar }
              }) : null
            
            if (existingSubject) {
              subjectId = existingSubject.id
              subjectMap.set(subjectKey, subjectId)
              
              if (existingSubject.nameEn !== row.subject_name_en) {
                await tx.subject.update({
                  where: { id: subjectId },
                  data: { nameEn: row.subject_name_en }
                })
                result.updated.subjects++
              }
            } else {
              const newSubject = await tx.subject.create({
                data: {
                  branchId,
                  nameAr: row.subject_name_ar,
                  nameEn: row.subject_name_en,
                  order: 0,
                  isActive: true
                }
              })
              subjectId = newSubject.id
              subjectMap.set(subjectKey, subjectId)
              result.created.subjects++
            }
          }

          // 3. Find or create Unit
          const unitKey = `${subjectId}_${row.unit_name_ar}`
          let unitId = unitMap.get(unitKey)
          
          if (!unitId) {
            const existingUnit = mode !== 'replace' ?
              await tx.unit.findFirst({
                where: { subjectId, nameAr: row.unit_name_ar }
              }) : null
            
            if (existingUnit) {
              unitId = existingUnit.id
              unitMap.set(unitKey, unitId)
              
              if (existingUnit.nameEn !== row.unit_name_en) {
                await tx.unit.update({
                  where: { id: unitId },
                  data: { nameEn: row.unit_name_en }
                })
                result.updated.units++
              }
            } else {
              const newUnit = await tx.unit.create({
                data: {
                  subjectId,
                  nameAr: row.unit_name_ar,
                  nameEn: row.unit_name_en,
                  order: 0,
                  isActive: true
                }
              })
              unitId = newUnit.id
              unitMap.set(unitKey, unitId)
              result.created.units++
            }
          }

          // 4. Find or create Lesson
          const lessonKey = `${unitId}_${row.lesson_name_ar}`
          let lessonId = lessonMap.get(lessonKey)
          
          if (!lessonId) {
            const existingLesson = mode !== 'replace' ?
              await tx.lesson.findFirst({
                where: { unitId, nameAr: row.lesson_name_ar }
              }) : null
            
            if (existingLesson) {
              lessonId = existingLesson.id
              lessonMap.set(lessonKey, lessonId)
              
              if (existingLesson.nameEn !== row.lesson_name_en || 
                  existingLesson.duration !== row.lesson_duration) {
                await tx.lesson.update({
                  where: { id: lessonId },
                  data: {
                    nameEn: row.lesson_name_en,
                    duration: row.lesson_duration ?? null
                  }
                })
                result.updated.lessons++
              }
            } else {
              const newLesson = await tx.lesson.create({
                data: {
                  unitId,
                  nameAr: row.lesson_name_ar,
                  nameEn: row.lesson_name_en,
                  order: row.order ?? 0,
                  duration: row.lesson_duration ?? null,
                  isActive: true
                }
              })
              lessonId = newLesson.id
              lessonMap.set(lessonKey, lessonId)
              result.created.lessons++
            }
          }

          result.processedRows++
        } catch (error) {
          result.errors.push({
            row: rowNum,
            field: 'general',
            message: error instanceof Error ? error.message : 'خطأ في معالجة الصف'
          })
        }
      }
    }, {
      maxWait: 30000,
      timeout: 120000 // 2 minutes timeout for large imports
    })
  } catch (error) {
    result.success = false
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      result.errors.push({
        row: 0,
        field: 'database',
        message: `خطأ في قاعدة البيانات: ${error.message}`
      })
    } else {
      result.errors.push({
        row: 0,
        field: 'general',
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      })
    }
  }

  return result
}

/**
 * Detect file format from filename or content type
 */
export function detectFileFormat(filename: string, contentType?: string): 'json' | 'csv' | 'xlsx' | null {
  const ext = filename.toLowerCase().split('.').pop()
  
  if (ext === 'json') return 'json'
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  
  // Try content type
  if (contentType) {
    if (contentType.includes('json')) return 'json'
    if (contentType.includes('csv')) return 'csv'
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'xlsx'
  }
  
  return null
}
