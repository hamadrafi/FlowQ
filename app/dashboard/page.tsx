'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Building2, 
  Activity,
  History,
  UserPlus,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { fetcher } from '@/lib/api-client';

export default function DashboardOverview() {
  const [stats, setStats] = useState({ orgs: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const orgsData = await fetcher('/organization/list');
        const orgs = orgsData.organizations || [];
        setStats({ orgs: orgs.length });

        // Load recent activity for ALL orgs
        if (orgs.length > 0) {
          const allActivities: any[] = [];
          await Promise.all(
            orgs.map(async (org: any) => {
              try {
                const data = await fetcher(`/organization/activity?orgId=${org._id}`);
                if (data.success) allActivities.push(...data.activities);
              } catch { /* skip if one org fails */ }
            })
          );
          // Sort newest first
          allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivities(allActivities.slice(0, 10));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setActivityLoading(false);
      }
    }
    loadStats();
  }, []);

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-500 mt-1">Here is what's happening across your queues today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Organizations</h3>
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? '...' : stats.orgs}</p>
          <Link href="/dashboard/organizations" className="mt-4 text-sm font-medium text-sky-600 flex items-center hover:underline">
            Manage locations <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">System Status</h3>
          </div>
          <p className="text-xl font-bold text-green-600">Operational</p>
          <p className="text-sm text-gray-400 mt-2">All services are running normally.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-sky-600 transition-all duration-300">
          <Link href="/dashboard/organizations" className="flex flex-col items-center">
            <div className="p-4 bg-gray-50 text-gray-400 rounded-full group-hover:bg-white group-hover:text-sky-600 transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <p className="mt-4 font-bold text-gray-900 group-hover:text-white transition-colors">Add Organization</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center">
            <History className="w-5 h-5 mr-2 text-gray-400" />
            Recent Activity
          </h3>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Last 24 Hours</span>
        </div>

        {activityLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 italic">No recent activity to show.</p>
            <p className="text-sm text-gray-300 mt-1">Activities will appear here as you manage your queues.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((act, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-xl ${act.type === 'completed' ? 'bg-green-50 text-green-600' : 'bg-sky-50 text-sky-600'}`}>
                    {act.type === 'completed' 
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <UserPlus className="w-4 h-4" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{act.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {act.type === 'completed' ? 'Completed' : 'Joined'} · {act.serviceName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-400 space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo(act.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
