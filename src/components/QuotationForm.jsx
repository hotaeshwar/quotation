'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Save, Download, FolderOpen, Settings, Copy, RotateCcw,
  Building, User, CreditCard, FileCheck, FileText, Layout, Eye, RefreshCw, Calendar
} from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import SettingsModal from './SettingsModal';
import SavedQuotationsModal from './SavedQuotationsModal';
import QuotationPreview from './QuotationPreview';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import {
  DEFAULT_COMPANY_DETAILS,
  DEFAULT_PAYMENT_DETAILS,
  DEFAULT_DECLARATION,
  DEFAULT_TERMS_AND_CONDITIONS,
  INITIAL_SAMPLE_SUBSCRIPTION,
  CURRENCIES
} from '../constants/defaults';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to generate BID-YYYY-MM-DD-SLNO quotation number
const generateQuotationNumber = (seq = 1) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const slNo = String(seq).padStart(2, '0');
  return `BID-${year}-${month}-${day}-${slNo}`;
};

// Helper for formatted date
const getTodayFormatted = () => {
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${today.getFullYear()}`;
};

export default function QuotationForm() {
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'editor', 'preview'

  // Settings State
  const [companySettings, setCompanySettings] = useState({
    company: DEFAULT_COMPANY_DETAILS,
    payment: DEFAULT_PAYMENT_DETAILS,
    declaration: DEFAULT_DECLARATION,
    terms: DEFAULT_TERMS_AND_CONDITIONS
  });

  // Quotation Form State
  const [formData, setFormData] = useState({
    id: '',
    quotationName: '',
    quotationNumber: generateQuotationNumber(1),
    date: getTodayFormatted(),
    clientName: '',
    contactPerson: '',
    phone: '',
    address: '',
    currency: 'INR (₹)',
    amount: '',
    items: [
      { id: Date.now(), sNo: '1', description: INITIAL_SAMPLE_SUBSCRIPTION, vAlign: 'middle' }
    ],
    paymentDetails: DEFAULT_PAYMENT_DETAILS,
    declaration: DEFAULT_DECLARATION,
    termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
    createdAt: new Date().toISOString()
  });

  const [saving, setSaving] = useState(false);
  const previewRef = useRef(null);

  // Load saved default settings from Firestore / LocalStorage on mount
  useEffect(() => {
    loadDefaultSettings();
  }, []);

  const loadDefaultSettings = async () => {
    let settings = null;

    // Try Firestore
    try {
      const docRef = doc(db, 'settings', 'default');
      const snap = await getDocs(collection(db, 'settings'));
      snap.forEach((d) => {
        if (d.id === 'default') {
          settings = d.data();
        }
      });
    } catch (e) {
      console.warn('Firebase settings load notice:', e);
    }

    // Try LocalStorage fallback
    if (!settings && typeof window !== 'undefined') {
      const local = localStorage.getItem('bid_quotation_settings');
      if (local) {
        try {
          settings = JSON.parse(local);
        } catch (e) {}
      }
    }

    if (settings) {
      const merged = {
        company: settings.company || DEFAULT_COMPANY_DETAILS,
        payment: settings.payment || DEFAULT_PAYMENT_DETAILS,
        declaration: settings.declaration || DEFAULT_DECLARATION,
        terms: settings.terms || DEFAULT_TERMS_AND_CONDITIONS
      };
      setCompanySettings(merged);

      // Pre-fill initial formData from loaded settings
      setFormData((prev) => ({
        ...prev,
        paymentDetails: merged.payment,
        declaration: merged.declaration,
        termsAndConditions: merged.terms
      }));
    }
  };

  // Add new Subscription / Project Row
  const handleAddItem = () => {
    setFormData((prev) => {
      const nextNo = String(prev.items.length + 1);
      return {
        ...prev,
        items: [...prev.items, { id: Date.now(), sNo: nextNo, description: '', vAlign: 'middle' }]
      };
    });
  };

  // Update Item Vertical Alignment (top, middle/center, bottom)
  const handleItemVAlignChange = (index, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], vAlign: value };
      return { ...prev, items: newItems };
    });
  };

  // Remove Subscription Row
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('A quotation must have at least one item.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Update Item S. No. (Manual text or number)
  const handleItemSNoChange = (index, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], sNo: value };
      return { ...prev, items: newItems };
    });
  };

  // Update Subscription Row Description
  const handleItemChange = (index, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], description: value };
      return { ...prev, items: newItems };
    });
  };

  // Reset to New Blank Quotation with default settings
  const handleNewQuotation = () => {
    setFormData({
      id: '',
      quotationName: '',
      quotationNumber: generateQuotationNumber(Math.floor(Math.random() * 90) + 10),
      date: getTodayFormatted(),
      clientName: '',
      contactPerson: '',
      phone: '',
      address: '',
      currency: 'INR (₹)',
      amount: '',
      items: [{ id: Date.now(), sNo: '1', description: INITIAL_SAMPLE_SUBSCRIPTION, vAlign: 'middle' }],
      paymentDetails: companySettings.payment || DEFAULT_PAYMENT_DETAILS,
      declaration: companySettings.declaration || DEFAULT_DECLARATION,
      termsAndConditions: companySettings.terms || DEFAULT_TERMS_AND_CONDITIONS,
      createdAt: new Date().toISOString()
    });
  };

  // Requote from selected quotation
  const handleRequote = (quotationToRequote) => {
    const newSeq = Math.floor(Math.random() * 90) + 10;
    setFormData({
      ...quotationToRequote,
      id: '',
      quotationNumber: generateQuotationNumber(newSeq),
      date: getTodayFormatted(),
      createdAt: new Date().toISOString()
    });
    setIsSavedModalOpen(false);
  };

  // Restore Default Declaration
  const handleRestoreDefaultDeclaration = () => {
    setFormData((prev) => ({
      ...prev,
      declaration: companySettings.declaration || DEFAULT_DECLARATION
    }));
  };

  // Restore Default Terms & Conditions
  const handleRestoreDefaultTerms = () => {
    setFormData((prev) => ({
      ...prev,
      termsAndConditions: companySettings.terms || DEFAULT_TERMS_AND_CONDITIONS
    }));
  };

  // Save Quotation to Firebase Firestore
  const handleSaveQuotation = async () => {
    setSaving(true);
    const quotationId = formData.id || `quotation_${Date.now()}`;
    const payload = {
      ...formData,
      id: quotationId,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'quotations', quotationId), payload);
    } catch (err) {
      console.warn('Firebase save warning:', err);
    }

    // Save to LocalStorage as well
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('bid_saved_quotations');
        let list = local ? JSON.parse(local) : [];
        const index = list.findIndex((q) => q.id === quotationId);
        if (index >= 0) {
          list[index] = payload;
        } else {
          list.push(payload);
        }
        localStorage.setItem('bid_saved_quotations', JSON.stringify(list));
      } catch (e) {}
    }

    setFormData(payload);
    setSaving(false);
    setIsSavedModalOpen(true);
  };

  // Load Quotation from Saved Quotations
  const handleSelectQuotation = (selected) => {
    setFormData(selected);
    setIsSavedModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* TOP NAVBAR */}
      <header className="bg-gray-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/images/bid.png"
            alt="BiD Logo"
            className="h-10 w-auto object-contain rounded-lg bg-white/10 p-1 border border-white/20 shadow-xs"
          />
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">Quotation Studio</h1>
            <p className="text-[11px] text-gray-400">BUILDING INDIA DIGITAL</p>
          </div>
        </div>

        {/* Quotation Identifier Input */}
        <div className="flex-1 max-w-xs mx-2">
          <input
            type="text"
            placeholder="Quotation Identifier Name..."
            value={formData.quotationName}
            onChange={(e) => setFormData({ ...formData, quotationName: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Quotations */}
          <button
            type="button"
            onClick={() => setIsSavedModalOpen(true)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Saved
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>

          {/* New Quotation */}
          <button
            type="button"
            onClick={handleNewQuotation}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>

          {/* View Toggles (Mobile/Desktop) */}
          <div className="hidden lg:flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Editor Only
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Preview Only
            </button>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveQuotation}
            disabled={saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={() => generateQuotationPDF(formData, companySettings)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </header>

      {/* MAIN MAIN CONTENT CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">

        {/* LEFT COLUMN: FORM EDITOR */}
        <div className={`p-4 sm:p-6 overflow-y-auto space-y-6 bg-white border-r border-gray-200 ${
          viewMode === 'preview' ? 'hidden' : viewMode === 'editor' ? 'lg:col-span-12' : 'lg:col-span-6'
        }`}>

          {/* QUOTATION NUMBER & DATE ROW */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                Quotation Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.quotationNumber}
                  onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quotationNumber: generateQuotationNumber(Math.floor(Math.random() * 90) + 10) })}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                  title="Generate Fresh Quotation Number"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                Quotation Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="Auto-adopted today's date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, date: getTodayFormatted() })}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 border border-gray-300 transition shrink-0"
                  title="Auto Adopt Today's Date"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CUSTOMER DETAILS FORM */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <textarea
                  rows={2}
                  placeholder="Customer Address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* MAIN EDITABLE PROJECT DESCRIPTION TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-600" /> Project Description &amp; Specifications
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project Row
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, idx) => (
                <div key={item.id || idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Item / Project Row #{idx + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Vertical Alignment Selector */}
                      <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-0.5 text-xs shadow-sm">
                        <span className="text-[11px] font-bold text-gray-500 px-1.5 uppercase tracking-tight">Vertical Align:</span>
                        <button
                          type="button"
                          onClick={() => handleItemVAlignChange(idx, 'top')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${(item.vAlign || 'middle') === 'top' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="Align content to top of PDF table cell"
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemVAlignChange(idx, 'middle')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${(item.vAlign || 'middle') === 'middle' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="Center content vertically in PDF table cell"
                        >
                          Center
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemVAlignChange(idx, 'bottom')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${(item.vAlign || 'middle') === 'bottom' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="Align content to bottom of PDF table cell"
                        >
                          Bottom
                        </button>
                      </div>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 hover:bg-red-50 rounded transition border border-red-200"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Row
                        </button>
                      )}
                    </div>
                  </div>

                  {/* S. No. / Ref Rich Text Editor */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      S. No. / Serial Ref (Rich Text Editor)
                    </label>
                    <TipTapEditor
                      value={item.sNo !== undefined && item.sNo !== null ? item.sNo : String(idx + 1)}
                      onChange={(val) => handleItemSNoChange(idx, val)}
                      placeholder="Type S. No. / Ref (e.g. 1, 01, Phase 1, Item A)..."
                      minHeight="min-h-[55px]"
                    />
                  </div>

                  {/* Project Description Rich Text Editor */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Project Description (Rich Text Editor)
                    </label>
                    <TipTapEditor
                      value={item.description}
                      onChange={(val) => handleItemChange(idx, val)}
                      placeholder="Write project description, specifications, scope of work, features..."
                      minHeight="min-h-[140px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AMOUNT & CURRENCY SECTION */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Total Amount</label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* PRE-FILLED PAYMENT DETAILS SECTION */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Payment Details
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium">Pre-filled default content</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.paymentDetails?.bankName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentDetails: { ...formData.paymentDetails, bankName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.paymentDetails?.accountNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentDetails: { ...formData.paymentDetails, accountNumber: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.paymentDetails?.accountName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentDetails: { ...formData.paymentDetails, accountName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.paymentDetails?.ifscCode || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentDetails: { ...formData.paymentDetails, ifscCode: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* PRE-FILLED DECLARATION SECTION */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" /> Declaration
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium">Pre-filled default content</span>
              </div>
              <button
                type="button"
                onClick={handleRestoreDefaultDeclaration}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default Declaration
              </button>
            </div>

            <TipTapEditor
              value={formData.declaration}
              onChange={(val) => setFormData({ ...formData, declaration: val })}
            />
          </div>

          {/* PRE-FILLED TERMS & CONDITIONS SECTION */}
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Terms & Conditions of Services
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium">Pre-filled default content</span>
              </div>
              <button
                type="button"
                onClick={handleRestoreDefaultTerms}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default Terms & Conditions
              </button>
            </div>

            <TipTapEditor
              value={formData.termsAndConditions}
              onChange={(val) => setFormData({ ...formData, termsAndConditions: val })}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE A4 PREVIEW */}
        <div className={`${
          viewMode === 'editor' ? 'hidden' : viewMode === 'preview' ? 'lg:col-span-12' : 'lg:col-span-6'
        }`}>
          <QuotationPreview
            formData={formData}
            companySettings={companySettings}
            containerRef={previewRef}
          />
        </div>

      </div>

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        companySettings={companySettings}
        onSaveSettings={(updated) => setCompanySettings(updated)}
      />

      {/* SAVED QUOTATIONS MODAL */}
      <SavedQuotationsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onSelectQuotation={handleSelectQuotation}
        onRequoteQuotation={handleRequote}
      />

    </div>
  );
}
