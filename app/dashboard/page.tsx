'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, getAISystems, getSystemCompliance } from '@/lib/api';
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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    total_systems: 0,
    total_requirements: 0,
    completed_requirements: 0,
    overall_compliance: 0,
  });
  const [systems, setSystems] = useState<SystemWithCompliance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendPeriod, setTrendPeriod] = useState('6months');

  // Generate mock trend data (replace with real API data later)
  const generateTrendData = () => {
    const months = ['Aug 12', 'Aug 19', 'Aug 26', 'Sep 9', 'Sep 23', 'Oct 7', 'Oct 21', 'Nov 4', 'Nov 18', 'Dec 2', 'Dec 16', 'Dec 30', 'Jan 13', 'Jan 27', 'Feb 3', 'Feb 10'];
    const baseValue = 5;
    let currentValue = baseValue;
    
    return months.map((month, index) => {
      currentValue = Math.min(95, currentValue + Math.random() * 8 + 2);
      return {
        date: month,
        value: Math.round(currentValue)
      };
    });
  };

  const [trendData] = useState(generateTrendData());
  const currentCompliance = trendData[trendData.length - 1]?.value || 0;
  const previousCompliance = trendData[trendData.length - 5]?.value || 0;
  const weeklyChange = (currentCompliance - previousCompliance).toFixed(1);

  useEffect(() => {
    async function loadData() {
      if (!user || loading) return;
      
      try {
        setIsLoading(true);
        const [dashboardStats, aiSystems] = await Promise.all([
          getDashboardStats(),
          getAISystems()
        ]);
        
        setStats(dashboardStats);
        
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
  }, [user, loading]);

  // SVG Line Chart Component
  const ComplianceTrendChart = () => {
    const width = 800;
    const height = 200;
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
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + chartHeight - ((val - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">{val}%</text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* X-axis labels */}
        {points.filter((_, i) => i % 3 === 0).map((p, i) => (
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WatchGraph</h1>
            <p className="text-gray-600 mt-1">Continuous AI Compliance Monitoring</p>
          </div>
          <Link 
            href="/dashboard/add-system"
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-sm"
          >
            + Add System
          </Link>
        </div>

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
            <p className="text-sm text-gray-500">Being tracked</p>
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
            <p className="text-sm text-gray-500">Across all systems</p>
          </div>
        </div>

        {/* Compliance Trend Chart */}
        {systems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
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
        )}

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
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {system.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getRiskBadgeStyle(system.risk_category)}`}>
                          {system.risk_category}
                        </span>
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
                    <div className="text-right flex-shrink-0">
                      <p className={`text-3xl font-bold ${getComplianceTextColor(system.compliance_percentage)}`}>
                        {system.compliance_percentage}%
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