'use client';

import React, { useState } from 'react';
import { X, Save, RotateCcw, Building, CreditCard, FileCheck, FileText } from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import {
  DEFAULT_COMPANY_DETAILS,
  DEFAULT_PAYMENT_DETAILS,
  DEFAULT_DECLARATION,
  DEFAULT_TERMS_AND_CONDITIONS
} from '../constants/defaults';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SettingsModal({ isOpen, onClose, companySettings, onSaveSettings }) {
  const [activeTab, setActiveTab] = useState('company');
  
  const [company, setCompany] = useState(companySettings?.company || DEFAULT_COMPANY_DETAILS);
  const [payment, setPayment] = useState(companySettings?.payment || DEFAULT_PAYMENT_DETAILS);
  const [declaration, setDeclaration] = useState(companySettings?.declaration || DEFAULT_DECLARATION);
  const [terms, setTerms] = useState(companySettings?.terms || DEFAULT_TERMS_AND_CONDITIONS);
  
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    const updatedSettings = {
      company,
      payment,
      declaration,
      terms,
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to Firebase Firestore
      await setDoc(doc(db, 'settings', 'default'), updatedSettings);
    } catch (err) {
      console.warn('Firebase save settings warning (using local persistence):', err);
    }

    // Save to LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bid_quotation_settings', JSON.stringify(updatedSettings));
    }

    onSaveSettings(updatedSettings);
    setSaving(false);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all company settings to factory defaults?')) {
      setCompany(DEFAULT_COMPANY_DETAILS);
      setPayment(DEFAULT_PAYMENT_DETAILS);
      setDeclaration(DEFAULT_DECLARATION);
      setTerms(DEFAULT_TERMS_AND_CONDITIONS);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Company Default Settings</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configure default data that automatically pre-fills every new quotation.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="w-4 h-4" /> Company Details
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'payment'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payment Details
          </button>
          <button
            onClick={() => setActiveTab('declaration')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'declaration'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Default Declaration
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Default Terms & Conditions
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: COMPANY DETAILS */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Company Name</label>
                  <input
                    type="text"
                    value={company.companyName}
                    onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Address</label>
                <textarea
                  rows={3}
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Website</label>
                  <input
                    type="text"
                    value={company.website}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT DETAILS */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={payment.bankName}
                    onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Account Name</label>
                  <input
                    type="text"
                    value={payment.accountName}
                    onChange={(e) => setPayment({ ...payment, accountName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Account Number</label>
                  <input
                    type="text"
                    value={payment.accountNumber}
                    onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={payment.ifscCode}
                    onChange={(e) => setPayment({ ...payment, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Cheque / Payment Instruction</label>
                <input
                  type="text"
                  value={payment.chequeInstruction}
                  onChange={(e) => setPayment({ ...payment, chequeInstruction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-medium text-red-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DEFAULT DECLARATION */}
          {activeTab === 'declaration' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Default Declaration Content (TipTap Rich Text)</label>
              <TipTapEditor
                value={declaration}
                onChange={setDeclaration}
                placeholder="Enter default declaration text..."
              />
            </div>
          )}

          {/* TAB 4: DEFAULT TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Default Terms & Conditions Content (TipTap Rich Text)</label>
              <TipTapEditor
                value={terms}
                onChange={setTerms}
                placeholder="Enter default terms & conditions..."
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Default Settings'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
