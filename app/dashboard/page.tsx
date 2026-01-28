'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AISystem {
  id: string
  name: string
  description: string
  risk_category: string
  organization: string
  department: string
  owner_email: string
  created_at: string
  updated_at: string
}

interface ComplianceData {
  system_id: string
  system_name: string
  risk_category: string
  total_requirements: number
  compliance_percentage: number
  status_breakdown: {
    not_started: number
    in_progress: number
    completed: number
    non_compliant: number
  }
}

export default function DashboardPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [complianceData, setComplianceData] = useState<{ [key: string]: ComplianceData }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystems()
  }, [])

  const fetchSystems = async () => {
    try {
      // Fetch all AI systems
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/systems`)
      const data = await response.json()
      setSystems(data)

      // Fetch compliance data for each system
      const compliancePromises = data.map(async (system: AISystem) => {
        const compResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/systems/${system.id}/compliance`)
        const compData = await compResponse.json()
        return { [system.id]: compData }
      })

      const complianceResults = await Promise.all(compliancePromises)
      const complianceMap = Object.assign({}, ...complianceResults)
      setComplianceData(complianceMap)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'destructive'
      case 'limited': return 'default'
      case 'minimal': return 'secondary'
      case 'unacceptable': return 'destructive'
      default: return 'default'
    }
  }

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading...</div>
          <div className="text-muted-foreground">Fetching your AI systems</div>
        </div>
      </div>
    )
  }

  const totalSystems = systems.length
  const totalRequirements = Object.values(complianceData).reduce((sum, data) => sum + data.total_requirements, 0)
  const overallCompliance = totalRequirements > 0
    ? Object.values(complianceData).reduce((sum, data) => sum + (data.compliance_percentage * data.total_requirements), 0) / totalRequirements
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">WatchGraph</h1>
              <p className="text-muted-foreground">Continuous AI Compliance Monitoring</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard/add-system'}>
              + Add System
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Systems</CardDescription>
              <CardTitle className="text-4xl">{totalSystems}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Being monitored</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Requirements</CardDescription>
              <CardTitle className="text-4xl">{totalRequirements}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Compliance</CardDescription>
              <CardTitle className={`text-4xl ${getComplianceColor(overallCompliance)}`}>
                {overallCompliance.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Across all systems</p>
            </CardContent>
          </Card>
        </div>

        {/* Systems List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your AI Systems</h2>
          </div>

          {systems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No AI systems registered yet</p>
                <Button onClick={() => window.location.href = '/dashboard/add-system'}>
                  Register Your First System
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {systems.map((system) => {
                const compliance = complianceData[system.id]
                return (
                  <Card key={system.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/systems/${system.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{system.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{system.description}</CardDescription>
                        </div>
                        <Badge variant={getRiskBadgeColor(system.risk_category)}>
                          {system.risk_category.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {system.organization} • {system.department}
                          </p>
                          {compliance && (
                            <p className="text-sm">
                              {compliance.status_breakdown.completed} of {compliance.total_requirements} requirements complete
                            </p>
                          )}
                        </div>
                        {compliance && (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getComplianceColor(compliance.compliance_percentage)}`}>
                              {compliance.compliance_percentage.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Compliant</p>
                          </div>
                        )}
                      </div>
                      {compliance && (
                        <div className="mt-4 w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${compliance.compliance_percentage}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}