'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, getAISystems, getSystemCompliance, getFrameworks, getComplianceByFramework, getActivityFeed } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface SystemWithCompliance {
  id: string;
  name: string;
  description: string;
  risk_category: string;
  organization: string;
  department: string;
  compliance_percentage: number;
  requirements_completed: number;
  total_requirements: number;
}

interface Framework {
  id: string;
  name: string;
  short_code: string;
  color: string;
  requirement_count: number;
}

interface FrameworkCompliance {
  id: string;
  name: string;
  short_code: string;
  color: string;
  total_requirements: number;
  completed: number;
  compliance_pct: number;
}

interface ComplianceEvent {
  id: string;
  system_id: string;
  system_name: string;
  event_type: string;
  title: string;
  description: string;
  severity: string;
  frameworks: Array<{
    short_code: string;
    name: string;
    color: string;
    article_ref: string;
  }>;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    total_systems: 0,
    total_requirements: 0,
    completed_requirements: 0,
    overall_compliance: 0,
  });
  const [systems, setSystems] = useState<SystemWithCompliance[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [frameworkCompliance, setFrameworkCompliance] = useState<{
    overall_compliance: number;
    frameworks: FrameworkCompliance[];
  }>({ overall_compliance: 0, frameworks: [] });
  const [activityFeed, setActivityFeed] = useState<ComplianceEvent[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendPeriod, setTrendPeriod] = useState('6months');
  const [activityFilter, setActivityFilter] = useState('all');

  // Generate mock trend data (replace with real API data later)
  const generateTrendData = () => {
    const months = ['Aug 12', 'Sep 9', 'Oct 21', 'Dec 2', 'Jan 13', 'Feb 10'];
    const baseValue = 15;
    let currentValue = baseValue;
    
    return months.map((month) => {
      currentValue = Math.min(95, currentValue + Math.random() * 12 + 3);
      return {
        date: month,
        value: Math.round(currentValue)
      };
    });
  };

  const [trendData] = useState(generateTrendData());
  const currentCompliance = trendData[trendData.length - 1]?.value || 0;
  const previousCompliance = trendData[trendData.length - 2]?.value || 0;
  const weeklyChange = (currentCompliance - previousCompliance).toFixed(1);

  useEffect(() => {
    async function loadData() {
      if (!user || loading) return;
      
      try {
        setIsLoading(true);
        
        // Fetch core data first
        const [dashboardStats, aiSystems] = await Promise.all([
          getDashboardStats(),
          getAISystems()
        ]);
        
        setStats(dashboardStats);
        
        // Fetch optional data - don't fail if these error
        try {
          const frameworksData = await getFrameworks();
          setFrameworks(frameworksData);
        } catch (e) {
          console.warn('Failed to load frameworks:', e);
        }
        
        try {
          const complianceData = await getComplianceByFramework();
          setFrameworkCompliance(complianceData);
        } catch (e) {
          console.warn('Failed to load compliance by framework:', e);
        }
        
        try {
          const activityData = await getActivityFeed(10);
          setActivityFeed(activityData.events || []);
        } catch (e) {
          console.warn('Failed to load activity feed:', e);
        }
        
        // Fetch compliance data for each system
        const systemsWithCompliance = await Promise.all(
          aiSystems.map(async (system: any) => {
            try {
              const compliance = await getSystemCompliance(system.id);
              return {
                ...system,
                compliance_percentage: compliance.compliance_percentage || 0,
                requirements_completed: compliance.requirements_completed || 0,
                total_requirements: compliance.total_requirements || 0,
              };
            } catch (err) {
              return {
                ...system,
                compliance_percentage: 0,
                requirements_completed: 0,
                total_requirements: 0,
              };
            }
          })
        );
        
        setSystems(systemsWithCompliance);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, loading, selectedFramework]);

  // Framework color mapping
  const getFrameworkColor = (shortCode: string) => {
    const colors: Record<string, string> = {
      'eu-ai-act': '#3b82f6',
      'nist-ai-rmf': '#ec4899',
      'iso-42001': '#6366f1'
    };
    return colors[shortCode] || '#6b7280';
  };

  const getFrameworkBgColor = (shortCode: string) => {
    const colors: Record<string, string> = {
      'eu-ai-act': 'bg-blue-100 text-blue-700',
      'nist-ai-rmf': 'bg-pink-100 text-pink-700',
      'iso-42001': 'bg-indigo-100 text-indigo-700'
    };
    return colors[shortCode] || 'bg-gray-100 text-gray-700';
  };

  // Donut Chart Component
  const DonutChart = () => {
    const size = 160;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const total = frameworkCompliance.frameworks.reduce((sum, fw) => sum + fw.total_requirements, 0);
    let currentAngle = -90;

    if (frameworkCompliance.frameworks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <p className="text-gray-500 text-sm">No framework data available</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {frameworkCompliance.frameworks.map((fw) => {
              const percentage = total > 0 ? (fw.total_requirements / total) * 100 : 0;
              const strokeDasharray = (percentage / 100) * circumference;
              const rotation = currentAngle;
              currentAngle += (percentage / 100) * 360;

              return (
                <circle
                  key={fw.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={getFrameworkColor(fw.short_code)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: 'center',
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {frameworkCompliance.overall_compliance.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">Overall</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 w-full">
          {frameworkCompliance.frameworks.map((fw) => (
            <div key={fw.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getFrameworkColor(fw.short_code) }}
                />
                <span className="text-gray-600">{fw.name}</span>
              </div>
              <span className="font-semibold" style={{ color: getFrameworkColor(fw.short_code) }}>
                {fw.compliance_pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Activity Feed Component
  const ActivityFeed = () => {
    const getSeverityStyles = (severity: string) => {
      switch (severity) {
        case 'alert':
          return { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' };
        case 'success':
          return { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' };
        case 'warning':
          return { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' };
        default:
          return { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' };
      }
    };

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case 'alert':
          return (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
        case 'success':
          return (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
        case 'warning':
          return (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          );
        default:
          return (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    };

    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return 'Just now';
    };

    const filteredEvents = activityFilter === 'all' 
      ? activityFeed 
      : activityFeed.filter(e => e.severity === activityFilter);

    return (
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          filteredEvents.slice(0, 5).map((event) => {
            const styles = getSeverityStyles(event.severity);
            return (
              <div key={event.id} className={`flex gap-4 p-4 rounded-lg ${styles.bg} border ${styles.border}`}>
                <div className={`shrink-0 ${styles.icon}`}>
                  {getSeverityIcon(event.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{event.system_name}</span> — {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-500">{getTimeAgo(event.created_at)}</span>
                    {event.frameworks?.map((fw, idx) => (
                      <span 
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getFrameworkBgColor(fw.short_code)}`}
                      >
                        {fw.short_code.toUpperCase().replace('-', ' ')} {fw.article_ref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // SVG Line Chart Component
  const ComplianceTrendChart = () => {
    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = 100;
    const minValue = 0;

    const points = trendData.map((d, i) => {
      const x = padding.left + (i / (trendData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight;
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + chartHeight - ((val - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">{val}%</text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* End point */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="6" fill="#3b82f6" />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - 8} textAnchor="middle" className="text-xs fill-gray-400">
            {p.date}
          </text>
        ))}
      </svg>
    );
  };

  // Progress Bar Component
  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getComplianceTextColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeStyle = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'LIMITED':
        return 'bg-yellow-100 text-yellow-700';
      case 'MINIMAL':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate total requirements across frameworks
  const totalFrameworkRequirements = frameworkCompliance.frameworks.reduce(
    (sum, fw) => sum + fw.total_requirements, 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WatchGraph</h1>
            <p className="text-gray-600 mt-1">Continuous AI Compliance Monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">
              Export Report
            </button>
            <Link 
              href="/dashboard/add-system"
              className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-sm"
            >
              + Add System
            </Link>
          </div>
        </div>

        {/* Framework Selector Tabs */}
        {frameworks.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setSelectedFramework(null)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                selectedFramework === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Frameworks
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {totalFrameworkRequirements}
              </span>
            </button>
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setSelectedFramework(fw.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  selectedFramework === fw.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {fw.name}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                  {fw.requirement_count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Total Systems
            </h3>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {stats.total_systems}
            </p>
            <p className="text-sm text-gray-500">Being monitored</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Total Requirements
            </h3>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {stats.total_requirements}
            </p>
            <p className="text-sm text-gray-500">Across {frameworks.length || 3} frameworks</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Completed
            </h3>
            <p className="text-4xl font-bold text-green-600 mb-2">
              {stats.completed_requirements}
            </p>
            <p className="text-sm text-gray-500">Requirements met</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Overall Compliance
            </h3>
            <p className={`text-4xl font-bold mb-2 ${getComplianceTextColor(stats.overall_compliance)}`}>
              {stats.overall_compliance}%
            </p>
            <p className="text-sm text-gray-500">Across all frameworks</p>
          </div>
        </div>

        {/* Charts Row: Trend + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Compliance Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Compliance Trend
                </h3>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl font-bold text-gray-900">{currentCompliance}%</span>
                  <span className={`text-sm font-medium ${Number(weeklyChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(weeklyChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(weeklyChange))}% this week
                  </span>
                </div>
              </div>
              <select 
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1month">Last month</option>
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last year</option>
              </select>
            </div>
            <ComplianceTrendChart />
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Compliance by Framework
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">NEW</span>
            </div>
            <DonutChart />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Real-Time Compliance Activity
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">NEW</span>
            </div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All events</option>
              <option value="alert">Alerts only</option>
              <option value="success">Completions</option>
              <option value="warning">Warnings</option>
            </select>
          </div>
          <ActivityFeed />
        </div>

        {/* AI Systems List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Your AI Systems</h2>
          </div>
          
          {systems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-sm mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No AI systems registered yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Get started by registering your first AI system for compliance monitoring.
                </p>
                <Link 
                  href="/dashboard/add-system"
                  className="inline-block mt-6 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition"
                >
                  + Register Your First System
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {systems.map((system) => (
                <Link 
                  key={system.id} 
                  href={`/dashboard/systems/${system.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {system.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getRiskBadgeStyle(system.risk_category)}`}>
                          {system.risk_category}
                        </span>
                        {/* Framework badges */}
                        {frameworks.slice(0, 2).map((fw) => (
                          <span 
                            key={fw.id}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getFrameworkBgColor(fw.short_code)}`}
                          >
                            {fw.short_code === 'eu-ai-act' ? 'EU AI ACT' : 
                             fw.short_code === 'nist-ai-rmf' ? 'NIST' : 'ISO 42001'}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {system.description || 'No description provided'}
                      </p>
                      {system.organization && (
                        <p className="text-xs text-gray-500 mb-4">
                          {system.organization}{system.department && ` · ${system.department}`}
                        </p>
                      )}
                      <ProgressBar 
                        percentage={system.compliance_percentage} 
                        color={getProgressColor(system.compliance_percentage)} 
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {system.requirements_completed} of {system.total_requirements} complete
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-bold ${getComplianceTextColor(system.compliance_percentage)}`}>
                        {system.compliance_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Compliant</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



