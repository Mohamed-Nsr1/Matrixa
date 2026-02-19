'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Lock, Loader2 } from 'lucide-react'

interface OptInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoice: (isOptedIn: boolean) => Promise<void>
}

export default function OptInModal({ open, onOpenChange, onChoice }: OptInModalProps) {
  const [loading, setLoading] = useState(false)

  const handleChoice = async (isOptedIn: boolean) => {
    setLoading(true)
    try {
      await onChoice(isOptedIn)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center sm:text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <DialogTitle className="text-xl">انضم للوحة المتصدرين!</DialogTitle>
          <DialogDescription className="text-base">
            هل تريد المشاركة في لوحة المتصدرين والتنافس مع زملائك؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald mt-0.5" />
              <div>
                <p className="font-medium text-emerald">المشاركة تعني:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• ظهور اسمك وترتيبك في اللوحة</li>
                  <li>• عرض نقاطك وإحصائياتك</li>
                  <li>• التنافس مع الطلاب الآخرين</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">خصوصيتك مهمة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  يمكنك الانسحاب في أي وقت من الإعدادات. لن يتم مشاركة بياناتك الشخصية.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={() => handleChoice(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Trophy className="w-4 h-4 ml-2" />
            )}
            نعم، أريد المشاركة!
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => handleChoice(false)}
            disabled={loading}
          >
            لا، شكراً
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
