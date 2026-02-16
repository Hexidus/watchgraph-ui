'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import EvidenceSection from './components/EvidenceSection'
import { getAISystem, getSystemRequirements, getSystemCompliance, updateRequirementStatus as apiUpdateRequirementStatus } from '@/lib/api'

interface Requirement {
  mapping_id: string
  requirement_id: string
  article: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'non_compliant'
  notes?: string
  updated_at: string
}

interface System {
  id: string
  name: string
  description: string
  risk_category: string
  organization: string
  department?: string
  owner_email?: string
}

interface ComplianceData {
  compliance_percentage: number
  total_requirements: number
  requirements_completed: number
  requirements_in_progress: number
  requirements_not_started: number
  requirements_non_compliant: number
}

export default function SystemDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const systemId = params.id as string
  
  const [system, setSystem] = useState<System | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [compliance, setCompliance] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [systemId])

  const fetchData = async () => {
    try {
      const [systemData, reqData, compData] = await Promise.all([
        getAISystem(systemId),
        getSystemRequirements(systemId),
        getSystemCompliance(systemId)
      ])
      
      setSystem(systemData)
      setRequirements(reqData)
      setCompliance(compData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load system data', {
        description: 'Please try refreshing the page'
      })
      setLoading(false)
    }
  }

  // Filter requirements based on search and status
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      req.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateRequirementStatus = async (mappingId: string, newStatus: string, requirementTitle: string) => {
    if (newStatus === 'non_compliant') {
      const confirmed = window.confirm(
        `Are you sure you want to mark "${requirementTitle}" as Non-Compliant?`
      )
      if (!confirmed) return
    }

    setUpdatingId(mappingId)
    
    try {
      await apiUpdateRequirementStatus(mappingId, { 
        status: newStatus,
        notes: undefined
      })
      
      const statusMessages = {
        completed: '✓ Marked as complete',
        in_progress: '⟳ Marked as in progress',
        non_compliant: '✗ Marked as non-compliant',
        not_started: 'Reset to not started'
      }
      
      toast.success(statusMessages[newStatus as keyof typeof statusMessages] || 'Status updated', {
        description: requirementTitle
      })
      
      await fetchData()
    } catch (error) {
      console.error('Error updating requirement:', error)
      toast.error('Failed to update requirement', {
        description: 'Please try again'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'non_compliant': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <div className="text-lg">Loading system details...</div>
        </div>
      </div>
    )
  }

  if (!system) {
    return (
      <div className="p-8">
        <div className="text-lg text-red-600">System not found</div>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{system.name}</h1>
              <p className="text-gray-600">{system.description}</p>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Organization:</span>{' '}
                  <span className="font-medium">{system.organization}</span>
                </div>
                {system.department && (
                  <div>
                    <span className="text-gray-500">Department:</span>{' '}
                    <span className="font-medium">{system.department}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge 
              variant={system.risk_category === 'high' ? 'destructive' : 'default'}
              className="text-lg px-4 py-2"
            >
              {system.risk_category.toUpperCase()} RISK
            </Badge>
          </div>
        </div>

        {compliance && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Overall Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {compliance.compliance_percentage}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {compliance.requirements_completed}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {compliance.requirements_in_progress}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Not Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {compliance.requirements_not_started}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Non-Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {compliance.requirements_non_compliant}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search requirements by keyword, article, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              >
                <option value="all">All Statuses ({requirements.length})</option>
                <option value="not_started">Not Started ({requirements.filter(r => r.status === 'not_started').length})</option>
                <option value="in_progress">In Progress ({requirements.filter(r => r.status === 'in_progress').length})</option>
                <option value="completed">Completed ({requirements.filter(r => r.status === 'completed').length})</option>
                <option value="non_compliant">Non-Compliant ({requirements.filter(r => r.status === 'non_compliant').length})</option>
              </select>
            </div>
            
            {/* Results count */}
            {(searchQuery || statusFilter !== 'all') && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredRequirements.length} of {requirements.length} requirements
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-4">
            EU AI Act Requirements ({requirements.length})
          </h2>
          
          {filteredRequirements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {requirements.length === 0 
                  ? "No requirements assigned to this system yet."
                  : "No requirements match your search criteria. Try adjusting your filters."}
              </CardContent>
            </Card>
          ) : (
            filteredRequirements.map((req) => (
              <Card key={req.mapping_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{req.article}</Badge>
                        <Badge className={getStatusColor(req.status)}>
                          {req.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">{req.title}</CardTitle>
                      <p className="text-sm text-gray-600">{req.description}</p>
                      
                      {/* Notes Display */}
                      {req.notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium text-blue-900">Notes: </span>
                              <span className="text-blue-800">{req.notes}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Evidence Section */}
                      <EvidenceSection mappingId={req.mapping_id} />
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button
                        size="sm"
                        variant={req.status === 'completed' ? 'default' : 'outline'}
                        onClick={() => updateRequirementStatus(req.mapping_id, 'completed', req.title)}
                        disabled={updatingId === req.mapping_id}
                        className="w-full"
                      >
                        {updatingId === req.mapping_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '✓ Complete'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={req.status === 'in_progress' ? 'default' : 'outline'}
                        onClick={() => updateRequirementStatus(req.mapping_id, 'in_progress', req.title)}
                        disabled={updatingId === req.mapping_id}
                        className="w-full"
                      >
                        {updatingId === req.mapping_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '⟳ In Progress'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={req.status === 'non_compliant' ? 'destructive' : 'outline'}
                        onClick={() => updateRequirementStatus(req.mapping_id, 'non_compliant', req.title)}
                        disabled={updatingId === req.mapping_id}
                        className="w-full"
                      >
                        {updatingId === req.mapping_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '✗ Non-Compliant'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}