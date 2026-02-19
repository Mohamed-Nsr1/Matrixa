'use client'

import { cn } from '@/lib/utils'

interface RichTextContentProps {
  content: string
  className?: string
  preview?: boolean
  maxLines?: number
  dir?: 'rtl' | 'ltr'
}

/**
 * Component to render rich text HTML content
 * Used for displaying notes with formatting
 */
export default function RichTextContent({
  content,
  className,
  preview = false,
  maxLines = 4,
  dir = 'rtl'
}: RichTextContentProps) {
  // If content is plain text (no HTML tags), render it directly
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (!isHtml) {
    return (
      <p
        className={cn(
          'text-muted-foreground text-sm whitespace-pre-wrap',
          preview && `line-clamp-${maxLines}`,
          className
        )}
        dir={dir}
      >
        {content}
      </p>
    )
  }

  // Strip HTML tags for preview
  if (preview) {
    const stripHtml = (html: string) => {
      const tmp = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
      return tmp.replace(/\n\s*\n/g, '\n').trim()
    }

    const plainText = stripHtml(content)

    return (
      <p
        className={cn(
          'text-muted-foreground text-sm whitespace-pre-wrap',
          `line-clamp-${maxLines}`,
          className
        )}
        dir={dir}
      >
        {plainText}
      </p>
    )
  }

  return (
    <div
      className={cn(
        'rich-text-content prose prose-sm prose-invert max-w-none',
        // Headings
        '[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-4',
        '[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-1.5 [&>h2]:mt-3',
        '[&>h3]:text-base [&>h3]:font-semibold [&>h3]:mb-1 [&>h3]:mt-2',
        // Paragraphs
        '[&>p]:text-muted-foreground [&>p]:mb-2',
        // Lists
        '[&>ul]:list-disc [&>ul]:pr-5 [&>ul]:mb-2',
        '[&>ol]:list-decimal [&>ol]:pr-5 [&>ol]:mb-2',
        '[&>li]:text-muted-foreground [&>li]:mb-1',
        // Code
        '[&>pre]:bg-muted [&>pre]:rounded-lg [&>pre]:p-3 [&>pre]:my-2 [&>pre]:overflow-x-auto [&>pre]:font-mono [&>pre]:text-sm',
        '[&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-sm',
        '[&>pre>code]:bg-transparent [&>pre>code]:p-0',
        // Links
        '[&>a]:text-primary [&>a]:underline [&>a]:hover:opacity-80',
        // Text formatting
        '[&_strong]:font-bold [&_strong]:text-foreground',
        '[&_em]:italic',
        '[&_u]:underline',
        '[&_s]:line-through',
        // Text alignment
        '[&_.text-align-right]:text-right',
        '[&_.text-align-center]:text-center',
        '[&_.text-align-left]:text-left',
        '[&_.text-align-justify]:text-justify',
        className
      )}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
