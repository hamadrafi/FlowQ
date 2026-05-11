'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Stethoscope, Clock, ChevronRight } from 'lucide-react';
import { fetcher, poster } from '@/lib/api-client';
import Link from 'next/link';

export default function ServicesPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', estimatedTime: 15 });

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadServices(selectedOrgId);
    }
  }, [selectedOrgId]);

  async function loadOrganizations() {
    try {
      const data = await fetcher('/organization/list');
      setOrganizations(data.organizations);
      if (data.organizations.length > 0) {
        setSelectedOrgId(data.organizations[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadServices(orgId: string) {
    setServicesLoading(true);
    setServices([]);
    try {
      const data = await fetcher(`/service/list?orgId=${orgId}`);
      setServices(data.services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setServicesLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await poster('/service/create', { ...formData, orgId: selectedOrgId });
      if (res.success) {
        setFormData({ name: '', description: '', estimatedTime: 15 });
        setShowForm(false);
        loadServices(selectedOrgId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="text-gray-500">Define the types of queues available at your organization.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedOrgId}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Service</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-200">
        <label className="text-sm font-medium text-gray-700">Select Organization:</label>
        <select 
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 outline-none"
        >
          {organizations.map(org => (
            <option key={org._id} value={org._id}>{org.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Create New Service</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Service Name (e.g. General Checkup)"
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Est. Time (min)"
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
            />
            <textarea
              placeholder="Description"
              className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save Service
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <div key={service._id} className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between hover:border-sky-200 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{service.name}</h4>
                <p className="text-sm text-gray-500">{service.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                <span>{service.estimatedTime || 15} min</span>
              </div>
              <Link 
                href={`/dashboard/queue/${service._id}`}
                className="flex items-center space-x-1 text-sky-600 font-medium hover:text-sky-700"
              >
                <span>Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/join/${service._id}`;
                  navigator.clipboard.writeText(url);
                  alert('Public Join Link copied to clipboard!');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                Copy Public Link
              </button>
            </div>
          </div>
        ))}
        {servicesLoading && (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        )}
        {!servicesLoading && services.length === 0 && selectedOrgId && (
          <div className="py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No services found. Create your first service above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
