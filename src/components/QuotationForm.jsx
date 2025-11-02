import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit3, Plus, Trash2, Calendar, X, Save, FolderOpen, Menu } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import signatureImage from '../assets/images/signature1.png';
// NOTE: To make signature blue, you need to edit the signature1.png image file itself
// PDF renderers cannot change image colors via CSS. Use image editing software to change
// the signature from black to blue (#0000FF) and save as signature1.png
import companyLogo from '../assets/images/LOGO c.png';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Constants
const CURRENCY_SYMBOLS = {
  'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
  'AED': 'د.إ', 'SAR': '﷼', 'CAD': 'C$', 'AUD': 'A$'
};

const CURRENCY_SYMBOLS_PDF = {
  'INR': 'Rs.', 'USD': '$', 'EUR': '€', 'GBP': '£',
  'AED': 'AED', 'SAR': 'SAR', 'CAD': 'C$', 'AUD': 'A$'
};

const BANK_DETAILS = {
  bankName: 'Karnataka Bank (Zirakpur)',
  accountNumber: '0899202400002001',
  accountName: 'Building India Digital',
  ifscCode: 'KARB0000899'
};

const INITIAL_FORM_DATA = {
  clientName: '', address: '', contactPerson: '', phone: '',
  amount: '', baseCurrency: 'INR', displayCurrency: 'INR',
  baseAmount: '', isRevised: false, revisionNumber: 0,
  ...BANK_DETAILS
};

const INITIAL_QUOTATION_INFO = {
  number: '', date: '', referenceNumber: 0
};

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  boldText: {
    fontSize: 10,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
  },
  clientInfoText: {
    fontSize: 10,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
  },
  sectionHeader: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    marginTop: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
  },
  tableCol: {
    width: '85%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  tableCell: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    padding: 6,
    textAlign: 'left',
    lineHeight: 1.3,
    fontFamily: 'Helvetica-Bold',
  },
  tableCellBold: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  amountSection: {
    marginBottom: 0.5,
    marginTop: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 4,
    backgroundColor: '#f9f9f9',
  },
  amountText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    minHeight: 50,
  },
  signatureBox: {
    width: '48%',
  },
  signatureImage: {
    width: 180,
    height: 100,
    objectFit: 'contain',
    marginTop: -20,
  },
  signatureLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  declarationText: {
    fontSize: 7,
    marginBottom: 0.6,
    lineHeight: 1.05,
  },
  declarationItem: {
    fontSize: 7,
    marginBottom: 0.3,
    lineHeight: 1.05,
    paddingLeft: 8,
  },
  termsText: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  termsBoldText: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
    fontFamily: 'Helvetica-Bold',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 0.5,
  },
  paymentItem: {
    width: '50%',
    marginBottom: 0.5,
  },
  paymentLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 0.5,
  },
  paymentValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  addressSection: {
    flex: 1,
  },
  logoSection: {
    width: 280,
    height: 140,
  },
  termsSection: {
    marginTop: 10,
  },
});

// Helper function to strip HTML and preserve line breaks
const stripHtmlAndPreserveBreaks = (html) => {
  if (!html) return '';
  let text = html.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<div>/gi, '');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—');
  return text.trim();
};

// PDF Document Component
const QuotationPDF = ({ formData, quotationInfo, subscriptionItems }) => {
  // Dynamically calculate items per page based on content length
  const getItemsPerPage = () => {
    // Fit 1 item per page to prevent overflow
    return 1;
  };

  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.ceil(subscriptionItems.length / itemsPerPage);

  return (
    <Document>
      {/* Main Content Pages */}
      {Array.from({ length: totalPages }, (_, pageIndex) => {
        const startIndex = pageIndex * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = subscriptionItems.slice(startIndex, endIndex);
        const isLastPage = pageIndex === totalPages - 1;

        return (
          <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
            {/* Header with Logo - Only on first page */}
            {pageIndex === 0 && (
              <View style={styles.pageHeader}>
                <View style={styles.addressSection}>
                  <Text style={styles.boldText}>#246, Devaji vip Plaza, VIP Road</Text>
                  <Text style={styles.boldText}>Zirakpur, Punjab Pin : 140603</Text>
                  <Text style={styles.boldText}>No. {quotationInfo.number}</Text>
                  <Text style={styles.boldText}>Dated: {quotationInfo.date}</Text>
                </View>
                <View style={styles.logoSection}>
                  <Image src={companyLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </View>
              </View>
            )}

            {/* Client Info - Only on first page */}
            {pageIndex === 0 && (
              <View style={{ marginBottom: 10, paddingBottom: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ width: '48%' }}>
                    <Text style={styles.clientInfoText}>Client Name: {formData.clientName}</Text>
                    <Text style={styles.clientInfoText}>Contact Person: {formData.contactPerson}</Text>
                    <Text style={styles.clientInfoText}>Phone: {formData.phone}</Text>
                  </View>
                  <View style={{ width: '48%' }}>
                    <Text style={styles.clientInfoText}>Address: {formData.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Subscription Table */}
            <View style={{ flex: 1, justifyContent: pageIndex !== 0 && !isLastPage ? 'center' : 'flex-start', paddingTop: pageIndex !== 0 && !isLastPage ? 40 : 0, paddingBottom: pageIndex !== 0 && !isLastPage ? 40 : 0 }}>
              <View style={[styles.table, { width: '100%' }]}>
                <View style={styles.tableRow}>
                  <View style={[styles.tableColHeader, { width: '15%' }]}>
                    <Text style={styles.tableCellBold}>S. No.</Text>
                  </View>
                  <View style={[styles.tableCol, { borderRightWidth: 1, width: '85%' }]}>
                    <Text style={styles.tableCellBold}>SUBSCRIPTION</Text>
                  </View>
                </View>
                {currentItems.map((item, index) => (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={[styles.tableColHeader, { width: '15%' }, index === currentItems.length - 1 && { borderBottomWidth: 1 }]}>
                      <Text style={[styles.tableCell, { textAlign: 'center' }]}>{stripHtmlAndPreserveBreaks(item.serialNumber)}</Text>
                    </View>
                    <View style={[styles.tableCol, { borderRightWidth: 1, width: '85%' }, index === currentItems.length - 1 && { borderBottomWidth: 1 }]}>
                      <Text style={styles.tableCell}>{stripHtmlAndPreserveBreaks(item.subscription)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer Section - Only on last page */}
            {isLastPage && (
              <View style={{ marginTop: 0 }}>
                {/* Amount Section */}
                <View style={styles.amountSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Text style={[styles.amountText, { fontSize: 14 }]}>AMOUNT</Text>
                    <Text style={[styles.amountText, { fontSize: 14 }]}>
                      {formData.displayCurrency} ({CURRENCY_SYMBOLS_PDF[formData.displayCurrency]})
                    </Text>
                    {formData.amount && <Text style={[styles.amountText, { fontSize: 14, color: '#FF8C00', fontFamily: 'Helvetica-Bold' }]}>
                      {formData.amount}
                    </Text>}
                  </View>
                  <Text style={[styles.text, { textAlign: 'center', marginTop: 1, fontFamily: 'Helvetica-Bold', marginBottom: 0 }]}>(GST EXTRA)</Text>
                </View>

                {/* Payment Details */}
                <View style={{ marginBottom: 0.5, marginTop: 1 }}>
                  <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0.2 }]}>PAYMENT DETAILS</Text>
                  <View style={styles.paymentGrid}>
                    <View style={styles.paymentItem}>
                      <Text style={styles.paymentLabel}>Bank Name</Text>
                      <Text style={styles.paymentValue}>{formData.bankName}</Text>
                    </View>
                    <View style={styles.paymentItem}>
                      <Text style={styles.paymentLabel}>Account Number</Text>
                      <Text style={styles.paymentValue}>{formData.accountNumber}</Text>
                    </View>
                    <View style={styles.paymentItem}>
                      <Text style={styles.paymentLabel}>Account Name</Text>
                      <Text style={styles.paymentValue}>{formData.accountName}</Text>
                    </View>
                    <View style={styles.paymentItem}>
                      <Text style={styles.paymentLabel}>IFSC Code</Text>
                      <Text style={styles.paymentValue}>{formData.ifscCode}</Text>
                    </View>
                  </View>
                </View>

                {/* Declaration */}
                <View style={{ marginBottom: 1, marginTop: 0.5 }}>
                  <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0.5 }]}>DECLARATION</Text>
                  <Text style={[styles.declarationText, { marginBottom: 0.5 }]}>
                    This is an application for Promotional services to BUILDING INDIA DIGITAL.
                  </Text>
                  {[
                    "All information including text & picture to be provided by the client.",
                    "BUILDING INDIA DIGITAL shall not be liable for any claims/damages.",
                    "Work shall commence only after clearance of cheques/pay order.",
                    "We are not responsible for future changes if business page already made by client.",
                    "BUILDING INDIA DIGITAL will take 60 days to complete the services/work.",
                    "After work starts there will be No Claim & No Refund.",
                    "Payment covered under 'Advertising Contract' u/s 194C. TDS @2% if applicable.",
                    "I allow BUILDING INDIA DIGITAL to make commercial calls to my mobile number(s).",
                    "This declaration holds valid even if numbers registered for NDNC."
                  ].map((item, index) => (
                    <Text key={index} style={styles.declarationItem}>• {item}</Text>
                  ))}
                </View>

                {/* Signatures */}
                <View style={[styles.signatureSection, { marginTop: 0, minHeight: 50 }]}>
                  <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>CLIENT SIGNATURE</Text>
                    <View style={{ height: 20, justifyContent: 'flex-end', alignItems: 'flex-start', marginTop: 0 }}>
                      <Text style={styles.text}></Text>
                    </View>
                  </View>
                  <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>ORGANISATION SIGNATURE</Text>
                    <View style={{ marginTop: -12, alignItems: 'flex-start' }}>
                      <Image src={signatureImage} style={styles.signatureImage} />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Page>
        );
      })}

      {/* Terms & Conditions Page - Full page */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          <Text style={[styles.header, { textAlign: 'center', marginBottom: 15, fontSize: 16 }]}>TERMS & CONDITIONS OF SERVICES</Text>

          <View style={styles.termsSection}>
            <Text style={styles.termsBoldText}>1. GENERAL</Text>
            <Text style={styles.termsText}>1.1 The terms & conditions herein shall constitute an entire Agreement between BUILDING INDIA DIGITAL and Customer. 1.2 Any invalid clause shall be deemed severable and not affect remaining clauses.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>2. SERVICES, EXCLUSIONS & PERFORMANCE</Text>
            <Text style={styles.termsText}>2.1 If requirements fall within restricted categories of Facebook/YouTube, BUILDING INDIA DIGITAL shall not be liable. 2.2 BUILDING INDIA DIGITAL reserves right to refuse/cancel any requirement. Budget will not be refunded. 2.3 Not responsible for delay due to Act of God, war, riot, strike, fire, flood, or any cause beyond control.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>3. PAYMENT TERMS</Text>
            <Text style={styles.termsText}>3.1 Customer shall pay fees as specified in quotation/invoice. 3.2 All payments in advance unless agreed in writing. 3.3 Late payments attract 2% monthly interest.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>4. INTELLECTUAL PROPERTY</Text>
            <Text style={styles.termsText}>4.1 All IP rights in deliverables remain with BUILDING INDIA DIGITAL. 4.2 Customer warrants materials don't infringe third-party IP rights.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>5. CONFIDENTIALITY</Text>
            <Text style={styles.termsText}>5.1 Both parties agree to keep confidential all marked information. 5.2 Obligation survives termination.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>6. LIMITATION OF LIABILITY</Text>
            <Text style={styles.termsText}>6.1 Total liability shall not exceed total fees paid. 6.2 Not liable for indirect, special, or consequential damages.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>7. TERMINATION</Text>
            <Text style={styles.termsText}>7.1 Either party may terminate with 30 days notice. 7.2 May terminate immediately if Customer breaches material term.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>8. GOVERNING LAW</Text>
            <Text style={styles.termsText}>8.1 Governed by laws of India. 8.2 Disputes subject to courts in Zirakpur, Punjab.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>9. FORCE MAJEURE</Text>
            <Text style={styles.termsText}>9.1 Neither party liable for failure due to circumstances beyond control.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>10. ENTIRE AGREEMENT</Text>
            <Text style={styles.termsText}>10.1 This constitutes entire understanding and supersedes all prior agreements.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 8 }]}>11. PACKAGE VALIDITY</Text>
            <Text style={styles.termsBoldText}>11.1 ABOVE PACKAGE IS FOR 1 ID ONLY</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// TinyMCE Editor Component  
const TinyMCEEditor = ({ content, onClose, onSave }) => {
  const editorRef = useRef(null);

  const handleSave = () => {
    if (editorRef.current) {
      const editorContent = editorRef.current.getContent();
      onSave(editorContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Rich Text Editor</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>
        <Editor
          apiKey="g1kgvpz3sdqd2dq5uhk0i206p7ejh2ttx7drt78gh6tzah7g"
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={content}
          init={{
            height: 400,
            menubar: true,
            plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'textcolor', 'colorpicker', 'textpattern', 'paste', 'highlight'],
            toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | forecolor backcolor | fontfamily fontsize | link image media | removeformat | help',
            content_style: 'body { font-family:Arial,sans-serif; font-size:14px }'
          }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Calendar Component
const CalendarComponent = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth();

    days.push(
      <button
        key={day}
        onClick={() => {
          const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          setSelectedDate(newDate);
          onDateSelect(newDate);
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isSelected ? 'bg-blue-500 text-white' : isToday ? 'border border-blue-500 bg-blue-100 text-blue-500' : 'hover:bg-gray-100'
          }`}
      >
        {day}
      </button>
    );
  }

  const changeMonth = (inc) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + inc, 1));
  const changeYear = (inc) => setCurrentDate(new Date(currentDate.getFullYear() + inc, currentDate.getMonth(), 1));

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1">
          <button onClick={() => changeYear(-1)} className="p-1 hover:bg-gray-100 rounded">‹‹</button>
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded">‹</button>
        </div>
        <div className="font-medium text-sm">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded">›</button>
          <button onClick={() => changeYear(1)} className="p-1 hover:bg-gray-100 rounded">››</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      <div className="mt-4">
        <button
          onClick={() => {
            const today = new Date();
            setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(today);
            onDateSelect(today);
          }}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Today
        </button>
      </div>
    </div>
  );
};

// Custom Hooks
const useExchangeRates = () => {
  const [rates] = useState({ INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044, SAR: 0.045, CAD: 0.017, AUD: 0.019 });
  return rates;
};

const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callback();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, callback]);
};

// Main QuotationForm Component
const QuotationForm = () => {
  const [subscriptionItems, setSubscriptionItems] = useState([{ id: 1, serialNumber: '', subscription: '' }]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState({ id: null, field: null });
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [showSavedQuotations, setShowSavedQuotations] = useState(false);
  const [currentQuotationId, setCurrentQuotationId] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [quotationInfo, setQuotationInfo] = useState(INITIAL_QUOTATION_INFO);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const editorRef = useRef(null);
  const calendarRef = useRef(null);
  const exchangeRates = useExchangeRates();
  useClickOutside(calendarRef, () => setShowDatePicker(false));

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (!amount || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return '';
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount)) return '';
    const inINR = numAmount / exchangeRates[fromCurrency];
    return (inINR * exchangeRates[toCurrency]).toFixed(2);
  };

  const formatNumber = (num) => num ? parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  const generateQuotationInfo = (selectedDate = new Date()) => {
    const date = selectedDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const referenceNumber = quotationInfo.referenceNumber || 0;
    const baseNumber = `${year}${month}${day}`;
    const revisionSuffix = formData.isRevised ? `/R${formData.revisionNumber}` : '';

    setQuotationInfo({
      number: `${baseNumber}/${referenceNumber}${revisionSuffix}`,
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      referenceNumber
    });
  };

  const downloadPDF = async () => {
    try {
      const blob = await pdf(<QuotationPDF
        formData={formData}
        quotationInfo={quotationInfo}
        subscriptionItems={subscriptionItems}
      />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationInfo.number.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  useEffect(() => { generateQuotationInfo(); }, []);
  useEffect(() => { generateQuotationInfo(); }, [formData.isRevised, formData.revisionNumber]);

  const addSubscriptionItem = () => {
    const newId = Math.max(...subscriptionItems.map(item => item.id), 0) + 1;
    setSubscriptionItems([...subscriptionItems, { id: newId, serialNumber: '', subscription: '' }]);
  };

  const removeSubscriptionItem = (id) => {
    if (subscriptionItems.length > 1) setSubscriptionItems(subscriptionItems.filter(item => item.id !== id));
  };

  const updateSubscriptionItem = (id, field, value) => {
    setSubscriptionItems(subscriptionItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCurrencyChange = (newCurrency) => {
    setFormData(prev => ({
      ...prev,
      displayCurrency: newCurrency,
      ...(prev.baseAmount && { amount: formatNumber(convertAmount(prev.baseAmount, prev.baseCurrency, newCurrency)) })
    }));
  };

  const handleAmountChange = (value) => {
    const cleanValue = value.replace(/,/g, '');
    setFormData(prev => ({ ...prev, amount: value, baseAmount: cleanValue, baseCurrency: prev.displayCurrency }));
  };

  const saveQuotation = () => {
    const quotationData = {
      id: currentQuotationId || Date.now(),
      formData: { ...formData },
      subscriptionItems: [...subscriptionItems],
      quotationInfo: { ...quotationInfo },
      savedAt: new Date().toISOString(),
      baseQuotationNumber: quotationInfo.number.split('/R')[0]
    };

    setSavedQuotations(prev => currentQuotationId ? prev.map(q => q.id === currentQuotationId ? quotationData : q) : [...prev, quotationData]);
    setCurrentQuotationId(quotationData.id);
    alert('Quotation saved successfully!');
  };

  const loadQuotation = (quotation) => {
    setFormData(quotation.formData);
    setSubscriptionItems(quotation.subscriptionItems);
    setQuotationInfo(quotation.quotationInfo);
    setCurrentQuotationId(quotation.id);
    setShowSavedQuotations(false);
  };

  const markAsRevised = () => {
    if (!currentQuotationId) return alert('Please save the quotation first!');

    const baseQuotation = savedQuotations.find(q => q.id === currentQuotationId);
    if (!baseQuotation) return alert('Original quotation not found!');

    const baseNumber = baseQuotation.baseQuotationNumber;
    const relatedQuotations = savedQuotations.filter(q => q.baseQuotationNumber === baseNumber);
    const nextRevision = Math.max(0, ...relatedQuotations.map(q => q.formData.revisionNumber || 0)) + 1;

    setFormData(prev => ({ ...prev, isRevised: true, revisionNumber: nextRevision }));
    setCurrentQuotationId(null);
    alert(`Quotation marked as Revision ${nextRevision}. Please make changes and save.`);
  };

  const generateNewQuotation = () => {
    setQuotationInfo(prev => ({ ...prev, referenceNumber: (prev.referenceNumber || 0) + 1 }));
    setFormData(INITIAL_FORM_DATA);
    setSubscriptionItems([{ id: 1, serialNumber: '', subscription: '' }]);
    setCurrentQuotationId(null);
    setIsEditing(false);
  };

  const handleDateSelect = (date) => {
    generateQuotationInfo(date);
    setShowDatePicker(false);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (isEditing) setShowTextEditor({ id: null, field: null });
  };

  const openTextEditor = (id, field) => {
    if (!isEditing) return;
    const item = subscriptionItems.find(i => i.id === id);
    if (item) {
      setEditorContent(item[field] || '');
      setShowTextEditor({ id, field });
    }
  };

  const closeTextEditor = () => {
    setShowTextEditor({ id: null, field: null });
  };

  const deleteQuotation = (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      setSavedQuotations(prev => prev.filter(q => q.id !== id));
      if (currentQuotationId === id) setCurrentQuotationId(null);
    }
  };

  const renderSubscriptionContent = (item, field) => {
    const content = item[field];
    if (!content && isEditing) return <div className="text-gray-500 italic min-h-8 p-1 cursor-pointer">Click to add {field === 'serialNumber' ? 'serial number' : 'details'}...</div>;
    if (!content && !isEditing) return <div className="min-h-8 p-1">&nbsp;</div>;
    return <div dangerouslySetInnerHTML={{ __html: content }} className="min-h-8 p-1 whitespace-pre-wrap break-words leading-relaxed" />;
  };

  const FormField = ({ label, value, onChange, type = 'text', rows = 1 }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white shadow-lg transition-all duration-300 overflow-hidden print:hidden flex-shrink-0`}>
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Controls</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={generateNewQuotation}
              className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 flex items-center gap-2 justify-center"
            >
              <Plus size={16} /> New Quotation
            </button>

            <button
              onClick={saveQuotation}
              className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 flex items-center gap-2 justify-center"
            >
              <Save size={16} /> Save
            </button>

            <button
              onClick={() => setShowSavedQuotations(!showSavedQuotations)}
              className="w-full px-3 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 flex items-center gap-2 justify-center"
            >
              <FolderOpen size={16} /> Saved ({savedQuotations.length})
            </button>

            <button
              onClick={markAsRevised}
              className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 text-sm"
            >
              Mark as Revised
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 flex items-center gap-2 justify-center"
              >
                <Calendar size={16} /> Select Date
              </button>
              {showDatePicker && (
                <div ref={calendarRef} className="absolute top-full left-0 mt-2 z-10">
                  <CalendarComponent onDateSelect={handleDateSelect} />
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.displayCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(CURRENCY_SYMBOLS).map(currency => (
                  <option key={currency} value={currency}>{currency} ({CURRENCY_SYMBOLS[currency]})</option>
                ))}
              </select>
            </div>

            <button
              onClick={downloadPDF}
              className="w-full px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 flex items-center gap-2 justify-center"
            >
              <Download size={16} /> Download PDF
            </button>

            <div className="border-t pt-3">
              <button
                onClick={toggleEditMode}
                className={`w-full px-3 py-2 rounded-md flex items-center gap-2 justify-center text-sm ${isEditing ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
              >
                <Edit3 size={16} /> {isEditing ? 'Editing ON' : 'Editing OFF'}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                {isEditing ? 'Click table cells to edit' : 'Enable to modify content'}
              </p>
            </div>

            {showSavedQuotations && (
              <div className="border-t pt-3">
                <h3 className="text-sm font-semibold mb-2">Saved Quotations</h3>
                {savedQuotations.length === 0 ? (
                  <p className="text-xs text-gray-500">No saved quotations</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedQuotations.map(quot => (
                      <div key={quot.id} className="p-2 bg-gray-50 rounded border text-xs">
                        <div className="font-medium flex items-center gap-2 mb-1">
                          {quot.quotationInfo.number}
                          {quot.formData.isRevised && (
                            <span className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded">
                              R{quot.formData.revisionNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {quot.formData.clientName || 'N/A'}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => loadQuotation(quot)}
                            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteQuotation(quot.id)}
                            className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-10 p-2 bg-white shadow-lg rounded-md hover:bg-gray-100 print:hidden"
          >
            <Menu size={24} />
          </button>
        )}

        <div className="p-4">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto print:shadow-none print:max-w-none">
            {showTextEditor.id && (
              <TinyMCEEditor
                content={editorContent}
                onClose={closeTextEditor}
                onSave={(content) => {
                  updateSubscriptionItem(showTextEditor.id, showTextEditor.field, content);
                  closeTextEditor();
                }}
              />
            )}

            <div className="p-8 print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 text-sm font-bold">
                  <div>#246, Devaji vip Plaza, VIP Road</div>
                  <div>Zirakpur, Punjab Pin : 140603</div>
                  <div className="mt-3">No. {quotationInfo.number}</div>
                  <div>Dated: {quotationInfo.date}</div>
                </div>
                <div className="text-right">
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    className="object-contain"
                    style={{ width: '280px', height: '140px' }}
                  />
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <FormField label="Client Name" value={formData.clientName} onChange={(value) => handleFormChange('clientName', value)} />
                  <FormField label="Contact Person" value={formData.contactPerson} onChange={(value) => handleFormChange('contactPerson', value)} />
                  <FormField label="Phone/Mobile" value={formData.phone} onChange={(value) => handleFormChange('phone', value)} />
                </div>
                <div>
                  <FormField label="Address" value={formData.address} onChange={(value) => handleFormChange('address', value)} type="textarea" rows={4} />
                </div>
              </div>

              {/* Subscription Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold">SUBSCRIPTION DETAILS</h3>
                  <button
                    onClick={addSubscriptionItem}
                    className="print:hidden px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <table className="w-full text-sm" style={{ border: '1px solid black', tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left w-1/5" style={{ border: '1px solid black' }}>S. No.</th>
                      <th className="p-2 text-left w-3/4" style={{ border: '1px solid black' }}>SUBSCRIPTION</th>
                      <th className="print:hidden p-2 text-left w-1/12" style={{ border: '1px solid black' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionItems.map((item) => (
                      <tr key={item.id}>
                        <td
                          onClick={() => openTextEditor(item.id, 'serialNumber')}
                          className={`p-2 align-top ${isEditing ? 'cursor-pointer border-dashed border-blue-400 bg-blue-50' : ''
                            }`}
                          style={{ border: '1px solid black', width: '20%' }}
                        >
                          {renderSubscriptionContent(item, 'serialNumber')}
                        </td>
                        <td
                          onClick={() => openTextEditor(item.id, 'subscription')}
                          className={`p-2 align-top ${isEditing ? 'cursor-pointer border-dashed border-blue-400 bg-blue-50' : ''
                            }`}
                          style={{ border: '1px solid black', width: '70%' }}
                        >
                          {renderSubscriptionContent(item, 'subscription')}
                        </td>
                        <td className="print:hidden p-2 text-center" style={{ border: '1px solid black', width: '10%' }}>
                          <button
                            onClick={() => removeSubscriptionItem(item.id)}
                            disabled={subscriptionItems.length === 1}
                            className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Section */}
              <div className="mt-8">
                {/* Amount */}
                <div className="mb-6 border-2 border-black p-4 bg-gray-50">
                  <div className="flex items-center justify-center gap-6">
                    <h3 className="text-2xl font-bold">AMOUNT</h3>
                    <span className="text-2xl font-bold">{formData.displayCurrency} ({CURRENCY_SYMBOLS[formData.displayCurrency]})</span>
                    {formData.amount && <span className="text-2xl font-bold">{formData.amount}</span>}
                  </div>
                  <div className="text-center text-sm font-semibold mt-2">(GST EXTRA)</div>
                </div>

                {/* Payment Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">PAYMENT DETAILS</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="mb-2">
                      <div className="text-sm font-bold text-gray-700">Bank Name</div>
                      <div className="text-sm font-semibold text-gray-900">{formData.bankName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-bold text-gray-700">Account Number</div>
                      <div className="text-sm font-semibold text-gray-900">{formData.accountNumber}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-bold text-gray-700">Account Name</div>
                      <div className="text-sm font-semibold text-gray-900">{formData.accountName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-bold text-gray-700">IFSC Code</div>
                      <div className="text-sm font-semibold text-gray-900">{formData.ifscCode}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-3">DECLARATION</h3>
                  <div className="space-y-2 text-sm leading-relaxed font-medium">
                    <p className="font-semibold">This is an application for Promotional services to BUILDING INDIA DIGITAL.</p>
                    {[
                      "All information including text & picture to be provided by the client who should also be the legal copyright owner.",
                      "BUILDING INDIA DIGITAL shall not be liable for any claims/damages arising out of content posted.",
                      "Work shall commence only after clearance of cheques/pay order.",
                      "We are not responsible for future changes if business page already made by client.",
                      "BUILDING INDIA DIGITAL will take 60 days to complete the services/work.",
                      "After work starts there will be No Claim & No Refund.",
                      "Payment covered under 'Advertising Contract' u/s 194C. TDS @2% if applicable.",
                      "I allow BUILDING INDIA DIGITAL to make commercial calls to my mobile number(s).",
                      "This declaration holds valid even if numbers registered for NDNC."
                    ].map((term, index) => (
                      <p key={index} className="flex items-start font-medium">
                        <span className="mr-2 font-bold">•</span>
                        <span>{term}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-left">
                    <h3 className="font-bold text-base mb-3">CLIENT SIGNATURE</h3>
                    <div className="h-20 flex items-end justify-start">
                      <div className="w-full border-t border-gray-300 pt-2">
                        <div className="text-xs text-gray-500"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-base mb-0 pb-0 leading-tight">ORGANISATION SIGNATURE</h3>
                    <img
                      src={signatureImage}
                      alt="Organization Signature"
                      className="mt-[-18px]"
                      style={{
                        width: '200px',
                        height: '140px',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border-t pt-4 page-break-before">
                <h3 className="text-lg font-bold text-center mb-4">TERMS & CONDITIONS OF SERVICES</h3>
                <div className="space-y-3 text-sm leading-relaxed font-medium">
                  <div>
                    <h4 className="font-bold mb-1">1. GENERAL</h4>
                    <p className="mb-1">1.1 The terms & conditions herein shall constitute an entire Agreement between BUILDING INDIA DIGITAL and Customer. 1.2 Any invalid clause shall be deemed severable and not affect remaining clauses.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">2. SERVICES, EXCLUSIONS & PERFORMANCE</h4>
                    <p className="mb-1">2.1 If requirements fall within restricted categories of Facebook/YouTube, BUILDING INDIA DIGITAL shall not be liable. 2.2 BUILDING INDIA DIGITAL reserves right to refuse/cancel any requirement. Budget will not be refunded. 2.3 Not responsible for delay due to Act of God, war, riot, strike, fire, flood, or any cause beyond control.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">3. PAYMENT TERMS</h4>
                    <p className="mb-1">3.1 Customer shall pay fees as specified in quotation/invoice. 3.2 All payments in advance unless agreed in writing. 3.3 Late payments attract 2% monthly interest.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">4. INTELLECTUAL PROPERTY</h4>
                    <p className="mb-1">4.1 All IP rights in deliverables remain with BUILDING INDIA DIGITAL. 4.2 Customer warrants materials don't infringe third-party IP rights.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">5. CONFIDENTIALITY</h4>
                    <p className="mb-1">5.1 Both parties agree to keep confidential all marked information. 5.2 Obligation survives termination.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">6. LIMITATION OF LIABILITY</h4>
                    <p className="mb-1">6.1 Total liability shall not exceed total fees paid. 6.2 Not liable for indirect, special, or consequential damages.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">7. TERMINATION</h4>
                    <p className="mb-1">7.1 Either party may terminate with 30 days notice. 7.2 May terminate immediately if Customer breaches material term.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">8. GOVERNING LAW</h4>
                    <p className="mb-1">8.1 Governed by laws of India. 8.2 Disputes subject to courts in Zirakpur, Punjab.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">9. FORCE MAJEURE</h4>
                    <p>9.1 Neither party liable for failure due to circumstances beyond control.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">10. ENTIRE AGREEMENT</h4>
                    <p>10.1 This constitutes entire understanding and supersedes all prior agreements.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">11. PACKAGE VALIDITY</h4>
                    <p className="font-bold">11.1 ABOVE PACKAGE IS FOR 1 ID ONLY</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;