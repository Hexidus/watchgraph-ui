'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, getAISystems } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    total_systems: 0,
    total_requirements: 0,
    completed_requirements: 0,
    overall_compliance: 0,
  });
  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setSystems(aiSystems);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, loading]);

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
          <button className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-sm">
            + Add System
          </button>
        </div>

        {/* Stats Cards - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Systems */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Systems
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {stats.total_systems}
            </p>
            <p className="text-sm text-gray-500">Being monitored</p>
          </div>

          {/* Total Requirements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Requirements
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {stats.total_requirements}
            </p>
            <p className="text-sm text-gray-500">Being tracked</p>
          </div>

          {/* Completed Requirements - NEW CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Completed
              </h3>
            </div>
            <p className="text-4xl font-bold text-green-600 mb-2">
              {stats.completed_requirements}
            </p>
            <p className="text-sm text-gray-500">Requirements met</p>
          </div>

          {/* Overall Compliance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Overall Compliance
              </h3>
            </div>
            <p className={`text-4xl font-bold mb-2 ${
              stats.overall_compliance >= 80 ? 'text-green-600' : 
              stats.overall_compliance >= 50 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {stats.overall_compliance}%
            </p>
            <p className="text-sm text-gray-500">Across all systems</p>
          </div>
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
                <button className="mt-6 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition">
                  + Register Your First System
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {systems.map((system: any) => (
                <div key={system.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {system.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          system.risk_category === 'HIGH' ? 'bg-red-100 text-red-800' :
                          system.risk_category === 'LIMITED' ? 'bg-yellow-100 text-yellow-800' :
                          system.risk_category === 'MINIMAL' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {system.risk_category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {system.description || 'No description provided'}
                      </p>
                      {system.organization && (
                        <p className="text-xs text-gray-500 mt-2">
                          {system.organization} {system.department && `• ${system.department}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}