'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createAISystem } from '@/lib/api'

export default function AddSystemPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    risk_category: 'high',
    organization: '',
    department: '',
    owner_email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('System name is required')
      return
    }
    
    if (!formData.organization.trim()) {
      toast.error('Organization is required')
      return
    }

    setSubmitting(true)

    try {
      const newSystem = await createAISystem(formData)

      toast.success('System created successfully!', {
        description: `${formData.name} has been added`
      })

      router.push(`/dashboard/systems/${newSystem.id}`)
    } catch (error) {
      console.error('Error creating system:', error)
      toast.error('Failed to create system', {
        description: 'Please try again'
      })
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Register New AI System</CardTitle>
            <CardDescription>
              Add a new AI system to track compliance with EU AI Act requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  System Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Chatbot"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the AI system, its purpose, and how it's used..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_category">
                  EU AI Act Risk Category <span className="text-red-500">*</span>
                </Label>
                <select
                  id="risk_category"
                  value={formData.risk_category}
                  onChange={(e) => handleChange('risk_category', e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="unacceptable">Unacceptable Risk (Prohibited)</option>
                  <option value="high">High Risk</option>
                  <option value="limited">Limited Risk (Transparency Obligations)</option>
                  <option value="minimal">Minimal or No Risk</option>
                </select>
                <p className="text-xs text-gray-500">
                  High-risk systems include those used in employment, education, law enforcement, or critical infrastructure
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">
                  Organization <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="organization"
                  placeholder="e.g., Acme Corporation"
                  value={formData.organization}
                  onChange={(e) => handleChange('organization', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Customer Success"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_email">System Owner Email</Label>
                <Input
                  id="owner_email"
                  type="email"
                  placeholder="e.g., owner@company.com"
                  value={formData.owner_email}
                  onChange={(e) => handleChange('owner_email', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create System'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}