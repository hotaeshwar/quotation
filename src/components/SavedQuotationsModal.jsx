'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Trash2, ExternalLink, Copy, Calendar, User } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SavedQuotationsModal({
  isOpen,
  onClose,
  onSelectQuotation,
  onRequoteQuotation
}) {
  const [quotations, setQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuotations();
    }
  }, [isOpen]);

  const fetchQuotations = async () => {
    setLoading(true);
    let list = [];

    // 1. Fetch from Firestore
    try {
      const querySnapshot = await getDocs(collection(db, 'quotations'));
      querySnapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
    } catch (err) {
      console.warn('Firebase fetch quotations warning:', err);
    }

    // 2. LocalStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('bid_saved_quotations');
        if (localData) {
          const parsed = JSON.parse(localData);
          // Merge local quotations if not already in list
          parsed.forEach((item) => {
            if (!list.some((q) => q.id === item.id)) {
              list.push(item);
            }
          });
        }
      } catch (e) {
        console.error('Error reading local quotations:', e);
      }
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setQuotations(list);
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;

    try {
      await deleteDoc(doc(db, 'quotations', id));
    } catch (err) {
      console.warn('Firebase delete warning:', err);
    }

    // Remove from local storage
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem('bid_saved_quotations');
      if (localData) {
        const parsed = JSON.parse(localData);
        const filtered = parsed.filter((q) => q.id !== id);
        localStorage.setItem('bid_saved_quotations', JSON.stringify(filtered));
      }
    }

    setQuotations((prev) => prev.filter((q) => q.id !== id));
  };

  if (!isOpen) return null;

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
      (q.clientName && q.clientName.toLowerCase().includes(term)) ||
      (q.contactPerson && q.contactPerson.toLowerCase().includes(term)) ||
      (q.quotationName && q.quotationName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Saved Quotations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage, load, or re-quote from saved records.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Quotation No, Client Name, Contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Quotations List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading saved quotations...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No saved quotations found.</p>
            </div>
          ) : (
            filteredQuotations.map((q) => (
              <div
                key={q.id}
                className="py-4 hover:bg-blue-50/50 rounded-lg px-3 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1 cursor-pointer flex-1" onClick={() => onSelectQuotation(q)}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {q.quotationNumber || 'No Number'}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {q.clientName || q.quotationName || 'Unnamed Quotation'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" /> {q.contactPerson || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> {q.date || 'N/A'}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {q.currency || '₹'} {q.amount || '0'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRequoteQuotation(q)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md text-xs font-semibold transition"
                    title="Create a new Quotation from this data with a fresh Quotation Number"
                  >
                    <Copy className="w-3.5 h-3.5" /> Requote
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectQuotation(q)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Load
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(q.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Delete Quotation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <span>Showing {filteredQuotations.length} saved records</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
