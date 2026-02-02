'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Paperclip
} from 'lucide-react'
import { toast } from 'sonner'

interface Evidence {
  id: string
  file_name: string
  file_type: string
  file_size: number
  status: 'current' | 'expiring_soon' | 'expired' | 'archived'
  description?: string
  expiration_date?: string
  uploaded_by?: string
  created_at: string
}

interface EvidenceSectionProps {
  mappingId: string
}

export default function EvidenceSection({ mappingId }: EvidenceSectionProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) {
      fetchEvidence()
    }
  }, [expanded, mappingId])

  const fetchEvidence = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${mappingId}/evidence`
      )
      if (!res.ok) throw new Error('Failed to fetch evidence')
      const data = await res.json()
      setEvidence(data.items || [])
    } catch (error) {
      console.error('Error fetching evidence:', error)
      toast.error('Failed to load evidence')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'docx', 'csv']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !allowedTypes.includes(ext)) {
      toast.error('Invalid file type', {
        description: `Allowed: ${allowedTypes.join(', ')}`
      })
      return
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum file size is 25MB'
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${mappingId}/evidence`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Upload failed')
      }

      toast.success('Evidence uploaded', {
        description: file.name
      })
      
      await fetchEvidence()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Upload failed', {
        description: error.message || 'Please try again'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (evidenceId: string, fileName: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/evidence/${evidenceId}/download`
      )
      if (!res.ok) throw new Error('Failed to get download URL')
      
      const data = await res.json()
      window.open(data.download_url, '_blank')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed', {
        description: 'Please try again'
      })
    }
  }

  const handleDelete = async (evidenceId: string, fileName: string) => {
    const confirmed = window.confirm(`Delete "${fileName}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(evidenceId)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/evidence/${evidenceId}`,
        { method: 'DELETE' }
      )
      
      if (!res.ok) throw new Error('Delete failed')
      
      toast.success('Evidence deleted', {
        description: fileName
      })
      
      await fetchEvidence()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed', {
        description: 'Please try again'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="w-4 h-4 text-blue-500" />
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-100 text-green-800">Current</Badge>
      case 'expiring_soon':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return null
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
      >
        <Paperclip className="w-4 h-4" />
        Evidence {evidence.length > 0 && `(${evidence.length})`}
        {expanded ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx,.csv"
              className="hidden"
              id={`evidence-upload-${mappingId}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Evidence
                </>
              )}
            </Button>
            <span className="text-xs text-gray-500">
              PDF, PNG, JPG, XLSX, DOCX, CSV (max 25MB)
            </span>
          </div>

          {/* Evidence List */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading evidence...
            </div>
          ) : evidence.length === 0 ? (
            <div className="text-sm text-gray-500 py-4">
              No evidence uploaded yet
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  {getFileIcon(item.file_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {item.file_name}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(item.file_size)} • Uploaded {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(item.id, item.file_name)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id, item.file_name)}
                      disabled={deletingId === item.id}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}