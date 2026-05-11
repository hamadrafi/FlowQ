'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  UserX, 
  Clock,
  Play
} from 'lucide-react';
import { fetcher, poster } from '@/lib/api-client';
import { getSocket } from '@/lib/socket-client';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LiveQueuePage() {
  const { serviceId } = useParams();
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      loadQueue();
      setupSocket();
    }
    return () => {
      const socket = getSocket();
      socket?.off('queue_updated');
    };
  }, [serviceId]);

  async function loadQueue() {
    try {
      const data = await fetcher(`/queue/get?serviceId=${serviceId}`);
      setQueue(data.queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function setupSocket() {
    // Ensure socket is initialized via API bridge
    fetch('/api/socket/io').then(() => {
      const socket = getSocket();
      
      socket.emit('join_service', serviceId);
      
      socket.on('queue_updated', (payload) => {
        console.log('🔄 Queue updated via socket:', payload);
        if (payload.serviceId === serviceId) {
          loadQueue(); // Simple strategy: reload data on update
        }
      });
    });
  }

  async function handleAction(action: 'next' | 'complete' | 'skip') {
    try {
      await poster(`/queue/${action}`, { serviceId });
      // The socket event will trigger a reload, but we can optimistic update or manually reload
      loadQueue();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div></div>;
  if (!queue) return <div>Queue not found</div>;

  const waiting = queue.customers.filter((c: any) => c.status === 'waiting');
  const called = queue.customers.filter((c: any) => c.status === 'called');
  const completed = queue.customers.filter((c: any) => c.status === 'completed' || c.status === 'skipped' || c.status === 'transferred').slice(-5).reverse();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Queue Control</h2>
          <p className="text-gray-500">Manage customers for this service in real-time.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-green-200 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Waiting List */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-700 flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-400" />
              Waiting ({waiting.length})
            </h3>
          </div>
          <div className="space-y-3">
            {waiting.map((customer: any) => (
              <div key={customer._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-400">Position #{customer.position}</p>
                </div>
                <div className="text-xs text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(customer.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {waiting.length === 0 && (
              <div className="py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                No one waiting
              </div>
            )}
          </div>
        </div>

        {/* Current / Actions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 text-center border-b border-gray-100">
              <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-2">Now Serving</p>
              {called.length > 0 ? (
                <div className="animate-in zoom-in duration-300">
                  <h4 className="text-5xl font-black text-gray-900">{called[0].name}</h4>
                  <p className="text-gray-400 mt-2">Position #{called[0].position}</p>
                </div>
              ) : (
                <div className="py-4">
                  <h4 className="text-4xl font-bold text-gray-200 italic">No one called</h4>
                  <p className="text-gray-400 mt-2">Call the next person to begin</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 grid grid-cols-3 gap-4">
              <button 
                onClick={() => handleAction('next')}
                disabled={waiting.length === 0 || called.length > 0}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Play className="w-8 h-8 mb-2 text-sky-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase">Call Next</span>
              </button>
              
              <button 
                onClick={() => handleAction('complete')}
                disabled={called.length === 0}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <CheckCircle2 className="w-8 h-8 mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase">Complete</span>
              </button>

              <button 
                onClick={() => handleAction('skip')}
                disabled={called.length === 0}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <UserX className="w-8 h-8 mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase">Skip</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center px-2">
              <CheckCircle2 className="w-5 h-5 mr-2 text-gray-400" />
              Recently Handled
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {completed.map((customer: any) => (
                <div key={customer._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      customer.status === 'completed' ? "bg-green-400" : "bg-gray-300"
                    )}></div>
                    <span className="font-medium text-gray-900">{customer.name}</span>
                  </div>
                  <span className="text-xs font-medium uppercase px-2 py-1 bg-gray-100 text-gray-500 rounded">
                    {customer.status}
                  </span>
                </div>
              ))}
              {completed.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  History is empty
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
