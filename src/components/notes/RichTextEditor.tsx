'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Toolbar button component - defined outside to avoid being recreated on each render
function ToolbarButton({
  onClick,
  isActive,
  children,
  title
}: {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={onClick}
      className="h-8 w-8 p-0"
      title={title}
    >
      {children}
    </Toggle>
  )
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  minHeight?: number
  dir?: 'rtl' | 'ltr'
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب ملاحظتك هنا...',
  className,
  editorClassName,
  minHeight = 200,
  dir = 'rtl'
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-lg p-4 font-mono text-sm my-2 overflow-x-auto'
          }
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: dir === 'rtl' ? 'right' : 'left'
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
          '[&_.is-editor-empty:before]:text-muted-foreground [&_.is-editor-empty:before]:float-right',
          editorClassName
        ),
        dir
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const setLink = useCallback(() => {
    if (!editor) return

    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().setLink({ href: linkUrl }).run()
    setLinkUrl('')
  }, [editor, linkUrl])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2 first:border-l-0 first:pl-0 first:ml-0">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="عريض"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="مائل"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="تحته خط"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="يتوسطه خط"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="عنوان رئيسي"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="عنوان فرعي"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="عنوان صغير"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="قائمة نقطية"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="قائمة مرقمة"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Code Block */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="كتلة كود"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="محاذاة لليمين"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="توسيط"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="محاذاة لليسار"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="ضبط"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('link')}
                className="h-8 w-8 p-0"
                title="رابط"
              >
                <LinkIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-2">
                <label className="text-sm font-medium">أضف رابط</label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8"
                    dir="ltr"
                  />
                  <Button size="sm" onClick={setLink} className="shrink-0">
                    إضافة
                  </Button>
                </div>
                {editor.isActive('link') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={removeLink}
                    className="w-full"
                  >
                    <Unlink className="w-4 h-4 ml-1" />
                    إزالة الرابط
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="overflow-auto"
        style={{ minHeight }}
      />

      {/* Custom Styles for the editor */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: right;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-right: 1.5rem;
          padding-left: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror a {
          color: var(--primary);
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          opacity: 0.8;
        }
        .ProseMirror pre {
          background-color: var(--muted);
          border-radius: 0.5rem;
          padding: 1rem;
          font-family: monospace;
          font-size: 0.875rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        .ProseMirror code {
          background-color: var(--muted);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
        .ProseMirror p {
          margin-bottom: 0.5rem;
        }
        .ProseMirror[dir="rtl"] ul,
        .ProseMirror[dir="rtl"] ol {
          padding-right: 1.5rem;
          padding-left: 0;
        }
      `}</style>
    </div>
  )
}
