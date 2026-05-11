'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Stethoscope,
  Ticket
} from 'lucide-react';

export default function PublicJoinPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const [service, setService] = useState<any>(null);
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // SSE connection reference so we can close it on cleanup
  const eventSourceRef = useRef<EventSource | null>(null);

  // ─── On mount: restore ticket from localStorage ───────────────────────────
  useEffect(() => {
    const savedTicket = localStorage.getItem(`flowq_ticket_${serviceId}`);
    if (savedTicket) {
      try {
        const parsed = JSON.parse(savedTicket);
        setTicket(parsed);
        setJoined(true);
      } catch {
        localStorage.removeItem(`flowq_ticket_${serviceId}`);
      }
    }
    if (serviceId) fetchService();
  }, [serviceId]);

  // ─── Start SSE stream once the user is joined ─────────────────────────────
  useEffect(() => {
    if (!joined || !ticket) return;

    const ticketId = ticket._id || ticket.id;
    if (!ticketId) return;

    // Close any existing connection first
    eventSourceRef.current?.close();

    const url = `/api/queue/stream?serviceId=${serviceId}&customerId=${ticketId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          // Ticket not found — clear and reset
          if (data.error === 'customer_not_found') {
            localStorage.removeItem(`flowq_ticket_${serviceId}`);
            setJoined(false);
            setTicket(null);
          }
          return;
        }

        // Update ticket state with fresh data from server
        setTicket((prev: any) => {
          const updated = { ...prev, status: data.status, position: data.position };
          localStorage.setItem(`flowq_ticket_${serviceId}`, JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      // EventSource auto-reconnects — we just mark as disconnected visually
    };

    // Cleanup on unmount or when ticket/joined changes
    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [joined, ticket?._id, ticket?.id, serviceId]);

  // ─── Fetch public service info ────────────────────────────────────────────
  async function fetchService() {
    try {
      const res = await fetch(`/api/service/get-public?serviceId=${serviceId}`);
      const data = await res.json();
      if (data.success) setService(data.service);
      else setError('Service not found');
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Join the queue ───────────────────────────────────────────────────────
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, name, orgId: service.orgId }),
      });
      const data = await res.json();
      if (data.success) {
        const newTicket = data.customer;
        setTicket(newTicket);
        setJoined(true);
        localStorage.setItem(`flowq_ticket_${serviceId}`, JSON.stringify(newTicket));
      } else {
        alert(data.error || 'Failed to join');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Loading / Error states ───────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-red-600 font-bold">
      {error}
    </div>
  );

  if (loading && !joined) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
  );

  // ─── Ticket screen ────────────────────────────────────────────────────────
  if (joined && ticket) {
    const isFinished = ticket.status !== 'waiting' && ticket.status !== 'called';
    const waitMins = Math.max(0, (ticket.position - 1)) * (service?.estimatedTime || 15);

    return (
      <div className="min-h-screen bg-sky-600 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-gray-900 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-500 ${isConnected ? 'bg-sky-500' : 'bg-yellow-400 animate-pulse'}`}></div>

          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full transition-all duration-500 ${isFinished ? 'bg-gray-100 text-gray-400' : ticket.status === 'called' ? 'bg-sky-100 text-sky-600' : 'bg-green-100 text-green-600'}`}>
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-center mb-1">
            {isFinished ? 'Session Ended' : ticket.status === 'called' ? 'Your Turn Now! 🎉' : "You're in Line!"}
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            {isFinished ? 'Thank you for visiting.' : ticket.status === 'called' ? 'Please proceed immediately.' : 'We will update you automatically.'}
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              {isFinished ? 'Status' : 'Your Position'}
            </p>
            <p className={`text-6xl font-black transition-all duration-500 ${isFinished ? 'text-gray-300' : 'text-sky-600'}`}>
              {isFinished ? '✓' : `#${ticket.position}`}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-2" /> Est. Wait</span>
              <span className="font-bold">{isFinished ? '—' : `~${waitMins} min`}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center"><Stethoscope className="w-4 h-4 mr-2" /> Service</span>
              <span className="font-bold truncate max-w-[150px]">{service?.name}</span>
            </div>
          </div>

          {isFinished ? (
            <button
              onClick={() => {
                eventSourceRef.current?.close();
                localStorage.removeItem(`flowq_ticket_${serviceId}`);
                setJoined(false);
                setTicket(null);
                setName('');
              }}
              className="mt-8 w-full py-3 px-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95"
            >
              Join Queue Again
            </button>
          ) : (
            <div className={`mt-8 flex items-center justify-center space-x-2 py-2 rounded-full transition-colors ${isConnected ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                {isConnected ? 'Live Sync Active' : 'Reconnecting...'}
              </span>
            </div>
          )}
        </div>
        <p className="mt-8 text-sky-100 text-sm font-medium">FlowQ · Universal Queue Management</p>
      </div>
    );
  }

  // ─── Join form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-sky-600 rounded-2xl text-white shadow-xl shadow-sky-100 mb-4">
            <Ticket className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{service?.name}</h1>
          <p className="text-gray-500 mt-2">Enter your name to take a virtual token</p>
        </div>

        <form onSubmit={handleJoin} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Your Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Hammad Rafi"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all text-lg font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-sky-200 flex items-center justify-center group transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Joining...' : 'Get My Ticket'}
            <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-center space-x-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center"><Users className="w-4 h-4 mr-1" /> No App Needed</div>
            <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Real-time</div>
          </div>
        </form>
      </div>
    </div>
  );
}
