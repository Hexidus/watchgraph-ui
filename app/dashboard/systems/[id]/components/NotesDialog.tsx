'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NotesDialogProps {
  mappingId: string
  requirementTitle: string
  currentNotes?: string
  onNotesUpdated: () => void
}

export function NotesDialog({ 
  mappingId, 
  requirementTitle, 
  currentNotes,
  onNotesUpdated 
}: NotesDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(currentNotes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch(`http://localhost:8001/api/requirements/${mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: notes,
          updated_by: 'user@example.com'
        })
      })

      if (!response.ok) throw new Error('Failed to save notes')
      
      toast.success('Notes saved', {
        description: 'Your notes have been updated'
      })
      
      setOpen(false)
      onNotesUpdated()
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes', {
        description: 'Please try again'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 text-xs"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {currentNotes ? 'Edit Notes' : 'Add Notes'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Requirement Notes</DialogTitle>
          <DialogDescription className="text-sm">
            {requirementTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <textarea
            placeholder="Add notes about compliance status, evidence, or next steps..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            {notes.length} characters
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}