'use client'

import { useState, useEffect } from 'react'
import { BookOpen, FileText, X, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface Subject {
  id: string
  nameAr: string
  nameEn: string
  color: string | null
  units: {
    id: string
    nameAr: string
    nameEn: string
    lessons: {
      id: string
      nameAr: string
      nameEn: string
    }[]
  }[]
}

interface SubjectLessonSelectorProps {
  subjectId?: string | null
  lessonId?: string | null
  onSubjectChange: (subjectId: string | null) => void
  onLessonChange: (lessonId: string | null) => void
  studyLanguage?: string
}

export default function SubjectLessonSelector({
  subjectId,
  lessonId,
  onSubjectChange,
  onLessonChange,
  studyLanguage = 'arabic'
}: SubjectLessonSelectorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/subjects')
      const data = await res.json()
      if (data.success) {
        setSubjects(data.subjects)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get selected subject
  const selectedSubject = subjects.find(s => s.id === subjectId)

  // Get all lessons for the selected subject
  const availableLessons = selectedSubject?.units.flatMap(unit =>
    unit.lessons.map(lesson => ({
      id: lesson.id,
      nameAr: lesson.nameAr,
      nameEn: lesson.nameEn,
      unitName: unit.nameAr,
      unitNameEn: unit.nameEn
    }))
  ) || []

  // Handle subject change - clear lesson when subject changes
  const handleSubjectChange = (value: string) => {
    if (value === 'none') {
      onSubjectChange(null)
      onLessonChange(null)
    } else {
      onSubjectChange(value)
      onLessonChange(null) // Clear lesson when subject changes
    }
  }

  // Handle lesson change
  const handleLessonChange = (value: string) => {
    if (value === 'none') {
      onLessonChange(null)
    } else {
      onLessonChange(value)
    }
  }

  // Clear subject
  const clearSubject = () => {
    onSubjectChange(null)
    onLessonChange(null)
  }

  // Clear lesson only
  const clearLesson = () => {
    onLessonChange(null)
  }

  const getSubjectName = (subject: Subject) => {
    return studyLanguage === 'arabic' ? subject.nameAr : subject.nameEn
  }

  const getLessonName = (lesson: { nameAr: string; nameEn: string }) => {
    return studyLanguage === 'arabic' ? lesson.nameAr : lesson.nameEn
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>جاري تحميل المواد...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subject Selector */}
      <div className="space-y-2">
        <Label className="text-right block flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          المادة (اختياري)
        </Label>
        <div className="flex gap-2">
          <Select value={subjectId || 'none'} onValueChange={handleSubjectChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="اختر المادة..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">بدون مادة</span>
              </SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <div className="flex items-center gap-2">
                    {subject.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                    <span>{getSubjectName(subject)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subjectId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSubject}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lesson Selector - Only show if subject is selected */}
      {subjectId && selectedSubject && (
        <div className="space-y-2">
          <Label className="text-right block flex items-center gap-2">
            <FileText className="w-4 h-4" />
            الدرس (اختياري)
          </Label>
          <div className="flex gap-2">
            <Select value={lessonId || 'none'} onValueChange={handleLessonChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="اختر الدرس..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">بدون درس</span>
                </SelectItem>
                {selectedSubject.units.map((unit) => (
                  <SelectGroup key={unit.id}>
                    <SelectLabel className="font-semibold">
                      {studyLanguage === 'arabic' ? unit.nameAr : unit.nameEn}
                    </SelectLabel>
                    {unit.lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        <span className="text-sm">
                          {getLessonName(lesson)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {lessonId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearLesson}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Selected Tags */}
      {(subjectId || lessonId) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedSubject && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-secondary/80"
              style={{
                backgroundColor: selectedSubject.color ? `${selectedSubject.color}20` : undefined,
                borderColor: selectedSubject.color || undefined
              }}
            >
              {selectedSubject.color && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedSubject.color }}
                />
              )}
              <span>{getSubjectName(selectedSubject)}</span>
              <button
                type="button"
                onClick={clearSubject}
                className="mr-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {lessonId && availableLessons.find(l => l.id === lessonId) && (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-accent"
            >
              <FileText className="w-3 h-3" />
              <span>{getLessonName(availableLessons.find(l => l.id === lessonId)!)}</span>
              <button
                type="button"
                onClick={clearLesson}
                className="mr-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
