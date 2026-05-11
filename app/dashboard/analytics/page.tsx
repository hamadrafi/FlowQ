'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Building2
} from 'lucide-react';
import { fetcher } from '@/lib/api-client';

export default function AnalyticsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadAnalytics(selectedOrgId);
    }
  }, [selectedOrgId]);

  async function loadOrganizations() {
    try {
      const data = await fetcher('/organization/list');
      setOrganizations(data.organizations || []);
      if (data.organizations && data.organizations.length > 0) {
        setSelectedOrgId(data.organizations[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics(orgId: string) {
    setDataLoading(true);
    try {
      const data = await fetcher(`/organization/analytics?orgId=${orgId}`);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Queue Analytics</h2>
          <p className="text-gray-500">Monitor performance and customer flow across your organization.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-200">
          <Building2 className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-900 outline-none pr-4"
          >
            {organizations.map(org => (
              <option key={org._id} value={org._id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      {dataLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Total Waiting" 
              value={analytics.summary.totalWaiting} 
              icon={Users} 
              color="text-blue-600" 
              bgColor="bg-blue-50" 
            />
            <StatCard 
              label="Total Completed" 
              value={analytics.summary.totalCompleted} 
              icon={CheckCircle2} 
              color="text-green-600" 
              bgColor="bg-green-50" 
            />
            <StatCard 
              label="Avg. Wait Time" 
              value={`${analytics.summary.avgWaitTimeMinutes || 0}m`} 
              icon={Clock} 
              color="text-orange-600" 
              bgColor="bg-orange-50" 
            />
            <StatCard 
              label="Active Queues" 
              value={analytics.totalServices} 
              icon={TrendingUp} 
              color="text-purple-600" 
              bgColor="bg-purple-50" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-sky-500" />
                Service Breakdown
              </h3>
              <div className="space-y-6">
                {analytics.services.map((service: any) => (
                  <div key={service.serviceId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{service.serviceName}</span>
                      <span className="text-gray-400">{service.waiting} waiting · {service.completed} done</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (service.waiting / (analytics.summary.totalWaiting || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Busiest Service</h3>
              {analytics.busiestService ? (
                <div className="mt-4">
                  <p className="text-3xl font-black text-sky-600">{analytics.busiestService.name}</p>
                  <p className="text-gray-500 mt-2">Currently handling <span className="font-bold text-gray-900">{analytics.busiestService.waiting}</span> waiting customers</p>
                </div>
              ) : (
                <p className="text-gray-400 mt-4">No active data yet</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Select an organization to view analytics</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
        </div>
        <div className={cn("p-3 rounded-xl", bgColor, color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
