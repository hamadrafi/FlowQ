'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Tag } from 'lucide-react';
import { fetcher, poster } from '@/lib/api-client';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: '', location: '' });

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      const data = await fetcher('/organization/list');
      setOrganizations(data.organizations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await poster('/organization/create', formData);
      if (res.success) {
        setFormData({ name: '', type: '', location: '' });
        setShowForm(false);
        loadOrganizations();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
          <p className="text-gray-500">Manage your business locations and branches.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">Create New Organization</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name (e.g. City Hospital)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="" disabled>Select Type</option>
              <option value="hospital">Hospital</option>
              <option value="govt">Government</option>
              <option value="bank">Bank</option>
              <option value="salon">Salon</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Location (e.g. Downtown)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <div className="md:col-span-3 flex justify-end space-x-2">
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
                Save Organization
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div key={org._id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-sky-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-sky-50 rounded-lg text-sky-600 group-hover:bg-sky-100 transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <h4 className="text-lg font-bold mt-4 text-gray-900">{org.name}</h4>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Tag className="w-4 h-4 mr-2" />
                  <span>{org.type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{org.location || 'No location set'}</span>
                </div>
              </div>
            </div>
          ))}
          {organizations.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No organizations found. Create your first one to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
