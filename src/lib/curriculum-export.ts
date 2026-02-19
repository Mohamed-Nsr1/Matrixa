/**
 * Curriculum Export Utilities
 * Export curriculum data to JSON, CSV, and XLSX formats
 */

import * as XLSX from 'xlsx'

// Types for curriculum data
export interface CurriculumExportData {
  branch_code: string
  branch_name_ar: string
  branch_name_en: string
  subject_name_ar: string
  subject_name_en: string
  unit_name_ar: string
  unit_name_en: string
  lesson_name_ar: string
  lesson_name_en: string
  order: number
  lesson_duration?: number | null
}

export interface CurriculumBranch {
  id: string
  nameAr: string
  nameEn: string
  code: string
  order: number
  subjects: CurriculumSubject[]
}

export interface CurriculumSubject {
  id: string
  nameAr: string
  nameEn: string
  order: number
  units: CurriculumUnit[]
}

export interface CurriculumUnit {
  id: string
  nameAr: string
  nameEn: string
  order: number
  lessons: CurriculumLesson[]
}

export interface CurriculumLesson {
  id: string
  nameAr: string
  nameEn: string
  order: number
  duration: number | null
}

/**
 * Flatten curriculum hierarchy to rows for export
 */
function flattenCurriculum(branches: CurriculumBranch[]): CurriculumExportData[] {
  const rows: CurriculumExportData[] = []
  let globalOrder = 0

  for (const branch of branches) {
    for (const subject of branch.subjects) {
      for (const unit of subject.units) {
        for (const lesson of unit.lessons) {
          rows.push({
            branch_code: branch.code,
            branch_name_ar: branch.nameAr,
            branch_name_en: branch.nameEn,
            subject_name_ar: subject.nameAr,
            subject_name_en: subject.nameEn,
            unit_name_ar: unit.nameAr,
            unit_name_en: unit.nameEn,
            lesson_name_ar: lesson.nameAr,
            lesson_name_en: lesson.nameEn,
            order: globalOrder++,
            lesson_duration: lesson.duration
          })
        }
      }
    }
  }

  return rows
}

/**
 * Export curriculum data to JSON format
 */
export function exportToJSON(branches: CurriculumBranch[]): string {
  const data = flattenCurriculum(branches)
  return JSON.stringify(data, null, 2)
}

/**
 * Export curriculum data to CSV format
 */
export function exportToCSV(branches: CurriculumBranch[]): string {
  const data = flattenCurriculum(branches)
  
  if (data.length === 0) {
    return ''
  }

  // Define column headers (Arabic)
  const headers = [
    'branch_code',
    'branch_name_ar', 
    'branch_name_en',
    'subject_name_ar',
    'subject_name_en',
    'unit_name_ar',
    'unit_name_en',
    'lesson_name_ar',
    'lesson_name_en',
    'order',
    'lesson_duration'
  ]

  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof CurriculumExportData]
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

/**
 * Export curriculum data to XLSX (Excel) format
 */
export function exportToXLSX(branches: CurriculumBranch[]): Buffer {
  const data = flattenCurriculum(branches)
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  
  // Define column headers with Arabic labels
  const headers = [
    { key: 'branch_code', label: 'كود الشعبة' },
    { key: 'branch_name_ar', label: 'اسم الشعبة (عربي)' },
    { key: 'branch_name_en', label: 'اسم الشعبة (إنجليزي)' },
    { key: 'subject_name_ar', label: 'اسم المادة (عربي)' },
    { key: 'subject_name_en', label: 'اسم المادة (إنجليزي)' },
    { key: 'unit_name_ar', label: 'اسم الوحدة (عربي)' },
    { key: 'unit_name_en', label: 'اسم الوحدة (إنجليزي)' },
    { key: 'lesson_name_ar', label: 'اسم الدرس (عربي)' },
    { key: 'lesson_name_en', label: 'اسم الدرس (إنجليزي)' },
    { key: 'order', label: 'الترتيب' },
    { key: 'lesson_duration', label: 'مدة الدرس (دقائق)' }
  ]

  // Transform data for worksheet with Arabic headers
  const worksheetData = data.map(row => {
    const transformedRow: Record<string, unknown> = {}
    headers.forEach(h => {
      transformedRow[h.label] = row[h.key as keyof CurriculumExportData] ?? ''
    })
    return transformedRow
  })

  // Create worksheet with data
  const worksheet = XLSX.utils.json_to_sheet(worksheetData, { header: headers.map(h => h.label) })

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // branch_code
    { wch: 20 }, // branch_name_ar
    { wch: 20 }, // branch_name_en
    { wch: 20 }, // subject_name_ar
    { wch: 20 }, // subject_name_en
    { wch: 20 }, // unit_name_ar
    { wch: 20 }, // unit_name_en
    { wch: 25 }, // lesson_name_ar
    { wch: 25 }, // lesson_name_en
    { wch: 10 }, // order
    { wch: 15 }  // lesson_duration
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المنهج الدراسي')

  // Write to buffer with proper encoding
  const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  // Ensure we return a proper Buffer
  return Buffer.isBuffer(xlsxBuffer) ? xlsxBuffer : Buffer.from(xlsxBuffer)
}

/**
 * Get content type for export format
 */
export function getContentType(format: 'json' | 'csv' | 'xlsx'): string {
  switch (format) {
    case 'json':
      return 'application/json'
    case 'csv':
      return 'text/csv; charset=utf-8'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: 'json' | 'csv' | 'xlsx'): string {
  return format
}

/**
 * Generate filename for export
 */
export function generateFilename(format: 'json' | 'csv' | 'xlsx', branchCode?: string): string {
  const date = new Date().toISOString().split('T')[0]
  const branchSuffix = branchCode ? `_${branchCode}` : ''
  return `curriculum${branchSuffix}_${date}.${format}`
}
