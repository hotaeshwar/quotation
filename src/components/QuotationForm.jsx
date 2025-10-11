import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit3, Plus, Trash2, Calendar, X, Save, FolderOpen, MapPin, Phone, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Copy, Scissors, AlignJustify, List, ListOrdered, ArrowUp, ArrowDown } from 'lucide-react';

import bidLogo from '../assets/images/bid2.png';
import signatureImage from '../assets/images/signature1.png';

const QuotationForm = () => {
  const [subscriptionItems, setSubscriptionItems] = useState([
    { id: 1, serialNumber: '', subscription: '' }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [showTextEditor, setShowTextEditor] = useState({ id: null, field: null });
  const [exchangeRates, setExchangeRates] = useState({});
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [showSavedQuotations, setShowSavedQuotations] = useState(false);
  const [currentQuotationId, setCurrentQuotationId] = useState(null);
  
  const [editorState, setEditorState] = useState({
    content: '',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'left',
    isBold: false,
    isItalic: false,
    isUnderline: false
  });
  
  const [formData, setFormData] = useState({
    clientName: '',
    address: '',
    contactPerson: '',
    phone: '',
    amount: '',
    baseCurrency: 'INR',
    displayCurrency: 'INR',
    baseAmount: '',
    bankName: 'Karnataka Bank (Zirakpur)',
    accountNumber: '0899202400002001',
    accountName: 'Building India Digital',
    ifscCode: 'KARB0000899',
    isRevised: false,
    revisionNumber: 0
  });
  const [quotationInfo, setQuotationInfo] = useState({
    number: '',
    date: '',
    referenceNumber: 0
  });

  const editorRef = useRef(null);
  const calendarRef = useRef(null);

  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'SAR': '﷼',
    'CAD': 'C$',
    'AUD': 'A$'
  };

  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' }
  ];

  const fontSizes = [
    { name: 'Small', value: '14px' },
    { name: 'Normal', value: '16px' },
    { name: 'Large', value: '18px' },
    { name: 'X-Large', value: '20px' },
    { name: 'XX-Large', value: '24px' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('bid_quotations');
    if (saved) {
      setSavedQuotations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (savedQuotations.length > 0) {
      localStorage.setItem('bid_quotations', JSON.stringify(savedQuotations));
    }
  }, [savedQuotations]);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
        AED: 0.044,
        SAR: 0.045,
        CAD: 0.017,
        AUD: 0.019
      });
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (!amount || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      return '';
    }
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount)) return '';
    
    const inINR = numAmount / exchangeRates[fromCurrency];
    const converted = inINR * exchangeRates[toCurrency];
    
    return converted.toFixed(2);
  };

  const formatNumber = (num) => {
    if (!num) return '';
    return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generateQuotationInfo = (selectedDate = new Date()) => {
    const date = selectedDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const referenceNumber = quotationInfo.referenceNumber || 0;
    const baseNumber = `${year}${month}${day}`;
    const revisionSuffix = formData.isRevised ? `/R${formData.revisionNumber}` : '';
    const quotationNumber = `${baseNumber}/${referenceNumber}${revisionSuffix}`;
    
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    setQuotationInfo({
      number: quotationNumber,
      date: formattedDate,
      referenceNumber: referenceNumber
    });
  };

  useEffect(() => {
    generateQuotationInfo();
  }, []);

  useEffect(() => {
    generateQuotationInfo();
  }, [formData.isRevised, formData.revisionNumber]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  const addSubscriptionItem = () => {
    const newId = subscriptionItems.length > 0 
      ? Math.max(...subscriptionItems.map(item => item.id)) + 1 
      : 1;
    setSubscriptionItems([...subscriptionItems, { 
      id: newId, 
      serialNumber: '', 
      subscription: ''
    }]);
  };

  const removeSubscriptionItem = (id) => {
    if (subscriptionItems.length > 1) {
      setSubscriptionItems(subscriptionItems.filter(item => item.id !== id));
    }
  };

  const updateSubscriptionItem = (id, field, value) => {
    setSubscriptionItems(subscriptionItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (newCurrency) => {
    if (formData.baseAmount) {
      const converted = convertAmount(formData.baseAmount, formData.baseCurrency, newCurrency);
      setFormData(prev => ({
        ...prev,
        displayCurrency: newCurrency,
        amount: formatNumber(converted)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        displayCurrency: newCurrency
      }));
    }
  };

  const handleAmountChange = (value) => {
    const cleanValue = value.replace(/,/g, '');
    setFormData(prev => ({
      ...prev,
      amount: value,
      baseAmount: cleanValue,
      baseCurrency: prev.displayCurrency
    }));
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

    if (currentQuotationId) {
      setSavedQuotations(prev => 
        prev.map(q => q.id === currentQuotationId ? quotationData : q)
      );
    } else {
      setSavedQuotations(prev => [...prev, quotationData]);
      setCurrentQuotationId(quotationData.id);
    }

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
    if (!currentQuotationId) {
      alert('Please save the quotation first before marking as revised!');
      return;
    }

    const baseQuotation = savedQuotations.find(q => q.id === currentQuotationId);
    if (!baseQuotation) {
      alert('Original quotation not found!');
      return;
    }

    const baseNumber = baseQuotation.baseQuotationNumber;
    const relatedQuotations = savedQuotations.filter(q => 
      q.baseQuotationNumber === baseNumber
    );
    const maxRevision = Math.max(
      0,
      ...relatedQuotations.map(q => q.formData.revisionNumber || 0)
    );
    const nextRevision = maxRevision + 1;

    setFormData(prev => ({
      ...prev,
      isRevised: true,
      revisionNumber: nextRevision
    }));

    setCurrentQuotationId(null);

    alert(`Quotation marked as Revision ${nextRevision}. Please make your changes and save.`);
  };

  const generateNewQuotation = () => {
    setQuotationInfo(prev => ({
      ...prev,
      referenceNumber: (prev.referenceNumber || 0) + 1
    }));
    setFormData({
      clientName: '',
      address: '',
      contactPerson: '',
      phone: '',
      amount: '',
      baseCurrency: 'INR',
      displayCurrency: 'INR',
      baseAmount: '',
      bankName: 'Karnataka Bank (Zirakpur)',
      accountNumber: '0899202400002001',
      accountName: 'Building India Digital',
      ifscCode: 'KARB0000899',
      isRevised: false,
      revisionNumber: 0
    });
    setSubscriptionItems([{ id: 1, serialNumber: '', subscription: '' }]);
    setCurrentQuotationId(null);
  };

  const handleDateSelect = (date) => {
    generateQuotationInfo(date);
    setShowDatePicker(false);
  };

  const toggleEditMode = () => setIsEditing(!isEditing);

  const openTextEditor = (id, field) => {
    if (!isEditing) return;
    
    const item = subscriptionItems.find(i => i.id === id);
    if (item) {
      setEditorState({
        content: item[field] || '',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'left',
        isBold: false,
        isItalic: false,
        isUnderline: false
      });
      setShowTextEditor({ id, field });
    }
  };

  const closeTextEditor = () => {
    if (showTextEditor.id) {
      updateSubscriptionItem(showTextEditor.id, showTextEditor.field, editorState.content);
    }
    setShowTextEditor({ id: null, field: null });
  };

  const updateEditorContent = (newContent) => {
    setEditorState(prev => ({ ...prev, content: newContent }));
  };

  const updateEditorStyle = (field, value) => {
    setEditorState(prev => ({ ...prev, [field]: value }));
  };

  const toggleTextStyle = (style) => {
    setEditorState(prev => ({ ...prev, [style]: !prev[style] }));
  };

  // FIXED: Working text movement functions
  const moveTextUp = () => {
    const lines = editorState.content.split('\n');
    if (lines.length > 1) {
      const newLines = [...lines];
      for (let i = 1; i < newLines.length; i++) {
        [newLines[i-1], newLines[i]] = [newLines[i], newLines[i-1]];
      }
      updateEditorContent(newLines.join('\n'));
    }
  };

  const moveTextDown = () => {
    const lines = editorState.content.split('\n');
    if (lines.length > 1) {
      const newLines = [...lines];
      for (let i = newLines.length - 2; i >= 0; i--) {
        [newLines[i], newLines[i+1]] = [newLines[i+1], newLines[i]];
      }
      updateEditorContent(newLines.join('\n'));
    }
  };

  const addBulletList = () => {
    const currentText = editorState.content;
    const lines = currentText.split('\n').filter(line => line.trim() !== '');
    const bulletList = lines.map(line => `• ${line}`).join('\n');
    updateEditorContent(bulletList);
  };

  const addNumberedList = () => {
    const currentText = editorState.content;
    const lines = currentText.split('\n').filter(line => line.trim() !== '');
    const numberedList = lines.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
    updateEditorContent(numberedList);
  };

  const handleCopy = () => {
    if (editorRef.current) {
      editorRef.current.select();
      document.execCommand('copy');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      updateEditorContent(editorState.content + text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleCut = () => {
    if (editorRef.current) {
      editorRef.current.select();
      document.execCommand('cut');
    }
  };

  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      console.log('Starting PDF generation...');
      
      const page1 = document.querySelector('.page-1');
      const page2 = document.querySelector('.page-2');
      
      if (!page1 || !page2) {
        alert('Error: Could not find page elements.');
        return;
      }

      console.log('Hiding no-print elements...');
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.style.display = 'none');

      const inputs = document.querySelectorAll('.page-1 input, .page-1 textarea');
      const originalPlaceholders = [];
      inputs.forEach(input => {
        originalPlaceholders.push(input.placeholder);
        input.placeholder = '';
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      console.log('Capturing Page 1...');
      const canvas1 = await html2canvas(page1, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
      const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight1, pdfHeight));

      pdf.addPage();

      console.log('Capturing Page 2...');
      const canvas2 = await html2canvas(page2, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
      const imgHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight2, pdfHeight));

      inputs.forEach((input, idx) => {
        input.placeholder = originalPlaceholders[idx];
      });
      noPrintElements.forEach(el => el.style.display = '');

      const filename = `quotation-${quotationInfo.number.replace(/\//g, '-')}.pdf`;
      pdf.save(filename);
      
      alert('✅ PDF generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error: ' + error.message);
      
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.style.display = '');
    }
  };

  const deleteQuotation = (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      setSavedQuotations(prev => prev.filter(q => q.id !== id));
      if (currentQuotationId === id) {
        setCurrentQuotationId(null);
      }
    }
  };

  const CalendarComponent = ({ onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handleDateClick = (day) => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(newDate);
      onDateSelect(newDate);
    };

    const changeMonth = (inc) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + inc, 1));
    const changeYear = (inc) => setCurrentDate(new Date(currentDate.getFullYear() + inc, currentDate.getMonth(), 1));

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{width:'32px',height:'32px'}}></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() && 
        selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            width:'32px',
            height:'32px',
            borderRadius:'50%',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'14px',
            border: isToday ? '1px solid #3b82f6' : 'none',
            background: isSelected ? '#3b82f6' : isToday ? '#dbeafe' : 'transparent',
            color: isSelected ? '#fff' : isToday ? '#3b82f6' : '#374151',
            cursor:'pointer'
          }}
        >
          {day}
        </button>
      );
    }

    return (
      <div style={{background:'#fff',border:'1px solid #d1d5db',borderRadius:'8px',boxShadow:'0 10px 15px rgba(0,0,0,0.1)',padding:'16px',width:'256px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{display:'flex',gap:'4px'}}>
            <button onClick={() => changeYear(-1)} style={{padding:'4px',cursor:'pointer',border:'none',background:'transparent'}}>‹‹</button>
            <button onClick={() => changeMonth(-1)} style={{padding:'4px',cursor:'pointer',border:'none',background:'transparent'}}>‹</button>
          </div>
          <div style={{fontWeight:'600',fontSize:'14px'}}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{display:'flex',gap:'4px'}}>
            <button onClick={() => changeMonth(1)} style={{padding:'4px',cursor:'pointer',border:'none',background:'transparent'}}>›</button>
            <button onClick={() => changeYear(1)} style={{padding:'4px',cursor:'pointer',border:'none',background:'transparent'}}>››</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',textAlign:'center',fontSize:'12px',color:'#6b7280',marginBottom:'8px'}}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{fontWeight:'500'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px'}}>{days}</div>
        <div style={{marginTop:'16px',display:'flex',justifyContent:'space-between'}}>
          <button onClick={() => {
            const today = new Date();
            setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(today);
            onDateSelect(today);
          }} style={{padding:'4px 12px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'4px',fontSize:'14px',cursor:'pointer'}}>
            Today
          </button>
          <button onClick={() => setShowDatePicker(false)} style={{padding:'4px 12px',background:'#6b7280',color:'#fff',border:'none',borderRadius:'4px',fontSize:'14px',cursor:'pointer'}}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const CustomTextEditor = () => {
    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'16px'}} className="no-print">
        <div style={{background:'#fff',borderRadius:'8px',padding:'24px',width:'100%',maxWidth:'900px',maxHeight:'90vh',overflow:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <h3 style={{fontSize:'20px',fontWeight:'bold',margin:0}}>Rich Text Editor</h3>
            <button onClick={closeTextEditor} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280'}}>
              <X size={24} />
            </button>
          </div>
          
          {/* Toolbar */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px',padding:'12px',background:'#f8f9fa',borderRadius:'6px',border:'1px solid #e9ecef'}}>
            {/* Font Family */}
            <select 
              value={editorState.fontFamily}
              onChange={(e) => updateEditorStyle('fontFamily', e.target.value)}
              style={{padding:'6px 12px',border:'1px solid #d1d5db',borderRadius:'4px',background:'#fff',cursor:'pointer'}}
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>

            {/* Font Size */}
            <select 
              value={editorState.fontSize}
              onChange={(e) => updateEditorStyle('fontSize', e.target.value)}
              style={{padding:'6px 12px',border:'1px solid #d1d5db',borderRadius:'4px',background:'#fff',cursor:'pointer'}}
            >
              {fontSizes.map(size => (
                <option key={size.value} value={size.value}>{size.name}</option>
              ))}
            </select>

            {/* Text Alignment */}
            <div style={{display:'flex',gap:'2px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',overflow:'hidden'}}>
              <button 
                onClick={() => updateEditorStyle('textAlign', 'left')}
                style={{padding:'6px 10px',border:'none',background:editorState.textAlign === 'left' ? '#3b82f6' : '#fff',color:editorState.textAlign === 'left' ? '#fff' : '#374151',cursor:'pointer'}}
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button 
                onClick={() => updateEditorStyle('textAlign', 'center')}
                style={{padding:'6px 10px',border:'none',background:editorState.textAlign === 'center' ? '#3b82f6' : '#fff',color:editorState.textAlign === 'center' ? '#fff' : '#374151',cursor:'pointer'}}
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button 
                onClick={() => updateEditorStyle('textAlign', 'right')}
                style={{padding:'6px 10px',border:'none',background:editorState.textAlign === 'right' ? '#3b82f6' : '#fff',color:editorState.textAlign === 'right' ? '#fff' : '#374151',cursor:'pointer'}}
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
              <button 
                onClick={() => updateEditorStyle('textAlign', 'justify')}
                style={{padding:'6px 10px',border:'none',background:editorState.textAlign === 'justify' ? '#3b82f6' : '#fff',color:editorState.textAlign === 'justify' ? '#fff' : '#374151',cursor:'pointer'}}
                title="Justify"
              >
                <AlignJustify size={16} />
              </button>
            </div>

            {/* Text Styles */}
            <div style={{display:'flex',gap:'2px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',overflow:'hidden'}}>
              <button 
                onClick={() => toggleTextStyle('isBold')}
                style={{padding:'6px 10px',border:'none',background:editorState.isBold ? '#3b82f6' : '#fff',color:editorState.isBold ? '#fff' : '#374151',cursor:'pointer'}}
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button 
                onClick={() => toggleTextStyle('isItalic')}
                style={{padding:'6px 10px',border:'none',background:editorState.isItalic ? '#3b82f6' : '#fff',color:editorState.isItalic ? '#fff' : '#374151',cursor:'pointer'}}
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button 
                onClick={() => toggleTextStyle('isUnderline')}
                style={{padding:'6px 10px',border:'none',background:editorState.isUnderline ? '#3b82f6' : '#fff',color:editorState.isUnderline ? '#fff' : '#374151',cursor:'pointer'}}
                title="Underline"
              >
                <Underline size={16} />
              </button>
            </div>

            {/* Lists */}
            <div style={{display:'flex',gap:'2px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',overflow:'hidden'}}>
              <button 
                onClick={addBulletList}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button 
                onClick={addNumberedList}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
            </div>

            {/* Text Movement */}
            <div style={{display:'flex',gap:'2px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',overflow:'hidden'}}>
              <button 
                onClick={moveTextUp}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Move Text Up"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                onClick={moveTextDown}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Move Text Down"
              >
                <ArrowDown size={16} />
              </button>
            </div>

            {/* Copy/Paste/Cut */}
            <div style={{display:'flex',gap:'2px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',overflow:'hidden'}}>
              <button 
                onClick={handleCopy}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Copy"
              >
                <Copy size={16} />
              </button>
              <button 
                onClick={handlePaste}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Paste"
              >
                <Type size={16} />
              </button>
              <button 
                onClick={handleCut}
                style={{padding:'6px 10px',border:'none',background:'#fff',color:'#374151',cursor:'pointer'}}
                title="Cut"
              >
                <Scissors size={16} />
              </button>
            </div>
          </div>

          <textarea
            ref={editorRef}
            value={editorState.content}
            onChange={(e) => updateEditorContent(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '16px',
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              fontSize: editorState.fontSize,
              fontFamily: editorState.fontFamily,
              textAlign: editorState.textAlign,
              fontWeight: editorState.isBold ? 'bold' : 'normal',
              fontStyle: editorState.isItalic ? 'italic' : 'normal',
              textDecoration: editorState.isUnderline ? 'underline' : 'none',
              resize: 'vertical',
              lineHeight: '1.6',
              outline: 'none'
            }}
            placeholder="Type your text here..."
          />

          {/* Preview */}
          <div style={{marginTop:'16px'}}>
            <h4 style={{fontSize:'16px',fontWeight:'bold',marginBottom:'8px'}}>Preview:</h4>
            <div 
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: '#f9fafb',
                minHeight: '120px',
                fontSize: editorState.fontSize,
                fontFamily: editorState.fontFamily,
                textAlign: editorState.textAlign,
                fontWeight: editorState.isBold ? 'bold' : 'normal',
                fontStyle: editorState.isItalic ? 'italic' : 'normal',
                textDecoration: editorState.isUnderline ? 'underline' : 'none',
                whiteSpace: 'pre-wrap'
              }}
            >
              {editorState.content || 'Preview will appear here...'}
            </div>
          </div>
          
          <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'20px'}}>
            <button 
              onClick={closeTextEditor} 
              style={{padding:'10px 20px',background:'#6b7280',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'500',fontSize:'14px'}}
            >
              Cancel
            </button>
            <button 
              onClick={closeTextEditor} 
              style={{padding:'10px 20px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'500',fontSize:'14px'}}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',padding:'16px'}} className="print-container">
      {/* Control Panel */}
      <div style={{maxWidth:'1280px',margin:'0 auto 24px'}} className="no-print">
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'16px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'16px',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <h2 style={{fontSize:'22px',fontWeight:'bold',color:'#1f2937',margin:0}}>Quotation Generator</h2>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={generateNewQuotation} style={{padding:'10px 18px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}>
                  Generate New Quotation
                </button>
                <button onClick={saveQuotation} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}>
                  <Save size={18} /> Save Quotation
                </button>
                <button onClick={() => setShowSavedQuotations(!showSavedQuotations)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'#f59e0b',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}>
                  <FolderOpen size={18} /> Saved ({savedQuotations.length})
                </button>
                <button onClick={markAsRevised} style={{padding:'10px 18px',background:'#ef4444',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}>
                  Mark as Revised
                </button>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexDirection:'column',alignItems:'flex-end'}}>
              {/* Calendar Selection */}
              <div style={{position:'relative'}}>
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}
                >
                  <Calendar size={18} /> Select Date
                </button>
                {showDatePicker && (
                  <div ref={calendarRef} style={{position:'absolute',top:'100%',right:0,zIndex:40,marginTop:'8px'}}>
                    <CalendarComponent onDateSelect={handleDateSelect} />
                  </div>
                )}
              </div>
              
              {/* Amount and Currency Controls */}
              <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f8fafc',padding:'8px 12px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                  <span style={{fontSize:'14px',fontWeight:'500',color:'#374151'}}>Amount:</span>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '120px',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                
                <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f8fafc',padding:'8px 12px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                  <span style={{fontSize:'14px',fontWeight:'500',color:'#374151'}}>Currency:</span>
                  <select
                    value={formData.displayCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.keys(currencySymbols).map(currency => (
                      <option key={currency} value={currency}>
                        {currency} ({currencySymbols[currency]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button onClick={downloadPDF} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'15px'}}>
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>

          {showSavedQuotations && (
            <div style={{marginTop:'16px',maxHeight:'400px',overflowY:'auto',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'16px',background:'#f9fafb'}}>
              <h3 style={{fontSize:'18px',fontWeight:'bold',marginBottom:'12px',color:'#1f2937'}}>Saved Quotations</h3>
              {savedQuotations.length === 0 ? (
                <p style={{color:'#6b7280',fontSize:'15px'}}>No saved quotations yet.</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {savedQuotations.map((quot) => (
                    <div key={quot.id} style={{background:'#fff',padding:'12px',borderRadius:'6px',border:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'600',color:'#1f2937',fontSize:'15px'}}>
                          {quot.quotationInfo.number}
                          {quot.formData.isRevised && (
                            <span style={{marginLeft:'8px',padding:'2px 8px',background:'#fed7aa',color:'#c2410c',borderRadius:'4px',fontSize:'12px'}}>
                              R{quot.formData.revisionNumber}
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:'13px',color:'#6b7280',marginTop:'4px'}}>
                          Client: {quot.formData.clientName || 'N/A'} | Amount: {quot.formData.amount || 'N/A'}
                        </div>
                        <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'2px'}}>
                          Saved: {new Date(quot.savedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={() => loadQuotation(quot)} style={{padding:'6px 12px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>
                          Load
                        </button>
                        <button onClick={() => deleteQuotation(quot.id)} style={{padding:'6px 12px',background:'#ef4444',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>
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

      {/* Quotation Form */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <div id="quotation-form" style={{
          background:'#fff',
          boxShadow:'0 4px 6px rgba(0,0,0,0.1)',
          width:'210mm',
          minHeight:'297mm',
          margin:'0 auto'
        }} className="quotation-content">
          
          {showTextEditor.id && <CustomTextEditor />}

          {/* PAGE 1 - MAIN QUOTATION */}
          <div className="page page-1" style={{
            width:'210mm',
            minHeight:'297mm',
            background:'#fff',
            padding:'0',
            pageBreakAfter:'always',
            fontFamily:'Arial, sans-serif',
            position: 'relative'
          }}>
            
            {/* Header */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr',
              padding:'15mm 15mm 8mm 15mm',
              borderBottom:'2px solid #000',
              gap:'15mm',
              alignItems:'start'
            }}>
              <div style={{fontSize:'11pt',lineHeight:'1.4',fontWeight:'600'}}>
                <div style={{display:'flex',alignItems:'start',gap:'4px',marginBottom:'2px'}}>
                  <MapPin size={14} style={{marginTop:'2px',flexShrink:0}} />
                  <div>
                    <div>#246, Devaji vip Plaza, VIP Road</div>
                    <div style={{marginLeft:'18px'}}>Zirakpur, Punjab Pin : 140603</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                  <Phone size={14} />
                  <div>+91 90414-99964/73</div>
                </div>
              </div>

              <div style={{textAlign:'center',fontSize:'11pt',fontWeight:'bold'}}>
                <div style={{marginBottom:'4px'}}>No. {quotationInfo.number}</div>
                <div>Dated: {quotationInfo.date}</div>
              </div>

              <div style={{textAlign:'right'}}>
                <div style={{display:'inline-flex',alignItems:'center',justifyContent:'flex-end',gap:'8px'}}>
                  <img src={bidLogo} alt="BID Logo" style={{height:'30mm',objectFit:'contain'}} />
                  <div style={{fontSize:'16pt',fontWeight:'bold',lineHeight:'1.1',textAlign:'right'}}>
                    <div>BUILDING</div>
                    <div>INDIA</div>
                    <div>DIGITAL</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              padding:'6mm 15mm 4mm 15mm',
              borderBottom:'1px solid #000',
              gap:'20mm'
            }}>
              <div>
                <div style={{marginBottom:'4mm'}}>
                  <div style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>Client Name</div>
                  <div style={{
                    width:'100%',
                    padding:'2mm',
                    fontSize:'11pt',
                    border:'1px solid #000',
                    minHeight:'6mm',
                    background:'#fff'
                  }}>
                    {formData.clientName || 'Enter client name'}
                  </div>
                </div>
                <div style={{marginBottom:'4mm'}}>
                  <div style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>Contact Person</div>
                  <div style={{
                    width:'100%',
                    padding:'2mm',
                    fontSize:'11pt',
                    border:'1px solid #000',
                    minHeight:'6mm',
                    background:'#fff'
                  }}>
                    {formData.contactPerson || 'Enter contact person'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{marginBottom:'4mm'}}>
                  <div style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>Address</div>
                  <div style={{
                    width:'100%',
                    padding:'2mm',
                    fontSize:'11pt',
                    border:'1px solid #000',
                    minHeight:'12mm',
                    background:'#fff'
                  }}>
                    {formData.address || 'Enter client address'}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>Phone/Mobile</div>
                  <div style={{
                    width:'100%',
                    padding:'2mm',
                    fontSize:'11pt',
                    border:'1px solid #000',
                    minHeight:'6mm',
                    background:'#fff'
                  }}>
                    {formData.phone || 'Enter phone number'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Table */}
            <div style={{padding:'4mm 15mm 4mm 15mm',borderBottom:'1px solid #000',flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'3mm'}}>
                <h3 style={{fontSize:'12pt',fontWeight:'bold',margin:0}}>SUBSCRIPTION DETAILS</h3>
                <div style={{display:'flex',gap:'2mm'}} className="no-print">
                  <button onClick={addSubscriptionItem} style={{
                    display:'flex',alignItems:'center',gap:'1mm',padding:'1mm 2mm',background:'#10b981',color:'#fff',border:'none',borderRadius:'2mm',cursor:'pointer',fontSize:'9pt'
                  }}>
                    <Plus size={12} /> Add Item
                  </button>
                  <button onClick={toggleEditMode} style={{
                    display:'flex',alignItems:'center',gap:'1mm',padding:'1mm 2mm',background:isEditing?'#3b82f6':'#6b7280',color:'#fff',border:'none',borderRadius:'2mm',cursor:'pointer',fontSize:'9pt'
                  }}>
                    <Edit3 size={12} /> {isEditing ? 'Editing' : 'Edit'}
                  </button>
                </div>
              </div>
              
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid #000',fontSize:'10pt'}}>
                <thead>
                  <tr style={{background:'#f0f0f0'}}>
                    <th style={{border:'1px solid #000',padding:'2mm',textAlign:'center',fontWeight:'bold',fontSize:'11pt',width:'20%'}}>S. No.</th>
                    <th style={{border:'1px solid #000',padding:'2mm',textAlign:'center',fontWeight:'bold',fontSize:'11pt'}}>SUBSCRIPTION</th>
                    <th style={{border:'1px solid #000',padding:'2mm',textAlign:'center',fontWeight:'bold',fontSize:'11pt',width:'15mm'}} className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{border:'1px solid #000',padding:'2mm',verticalAlign:'top',background:'#fff'}}>
                        <div
                          onClick={() => isEditing && openTextEditor(item.id, 'serialNumber')}
                          style={{
                            minHeight:'12mm',
                            padding:'1mm',
                            cursor:isEditing?'pointer':'default',
                            border:isEditing?'1px dashed #60a5fa':'none',
                            background:isEditing?'#eff6ff':'transparent',
                            fontSize:'10pt',
                            whiteSpace:'pre-wrap'
                          }}
                        >
                          {item.serialNumber || (isEditing && 'Click to add text...')}
                        </div>
                      </td>
                      <td style={{border:'1px solid #000',padding:'2mm',verticalAlign:'top',background:'#fff'}}>
                        <div
                          onClick={() => isEditing && openTextEditor(item.id, 'subscription')}
                          style={{
                            minHeight:'12mm',
                            padding:'1mm',
                            cursor:isEditing?'pointer':'default',
                            border:isEditing?'1px dashed #60a5fa':'none',
                            background:isEditing?'#eff6ff':'transparent',
                            fontSize:'10pt',
                            whiteSpace:'pre-wrap'
                          }}
                        >
                          {item.subscription || (isEditing && 'Click to add text...')}
                        </div>
                      </td>
                      <td style={{border:'1px solid #000',padding:'2mm',textAlign:'center',verticalAlign:'middle',background:'#fff'}} className="no-print">
                        <button 
                          onClick={() => removeSubscriptionItem(item.id)} 
                          disabled={subscriptionItems.length === 1} 
                          style={{
                            padding:'1mm 2mm',
                            background:subscriptionItems.length === 1 ? '#e5e7eb' : '#fee2e2',
                            color:subscriptionItems.length === 1 ? '#9ca3af' : '#dc2626',
                            border:'none',
                            borderRadius:'1mm',
                            cursor:subscriptionItems.length === 1 ? 'not-allowed' : 'pointer',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap:'0.5mm',
                            margin:'0 auto',
                            fontSize:'8pt'
                          }} 
                        >
                          <Trash2 size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Amount Section */}
            <div style={{padding:'4mm 15mm 4mm 15mm',borderBottom:'1px solid #000'}}>
              <h3 style={{fontSize:'12pt',fontWeight:'bold',marginBottom:'2mm',margin:0}}>AMOUNT</h3>
              
              <div style={{display:'flex',gap:'3mm',alignItems:'center',marginTop:'2mm',flexWrap:'wrap'}}>
                <div style={{
                  padding:'1mm 2mm',
                  fontSize:'11pt',
                  fontWeight:'bold',
                  border:'1px solid #000',
                  borderRadius:'1mm',
                  background:'#fff',
                  minWidth:'25mm'
                }}>
                  {formData.displayCurrency} ({currencySymbols[formData.displayCurrency]})
                </div>
                
                <div style={{
                  flex:1,
                  padding:'1mm 2mm',
                  fontSize:'11pt',
                  fontWeight:'bold',
                  border:'1px solid #000',
                  borderRadius:'1mm',
                  minWidth:'30mm',
                  background:'#fff'
                }}>
                  {formData.amount || 'Enter amount'}
                </div>
              </div>
              
              <div style={{marginTop:'2mm',fontSize:'11pt'}}>
                <span style={{fontWeight:'600',fontSize:'11pt'}}>
                  {currencySymbols[formData.displayCurrency]} {formData.amount || '0'}
                </span>
                <span style={{marginLeft:'3mm',fontWeight:'500',fontSize:'10pt'}}>
                  (GST EXTRA)
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{padding:'4mm 15mm 4mm 15mm',borderBottom:'1px solid #000'}}>
              <h3 style={{fontSize:'12pt',fontWeight:'bold',marginBottom:'2mm',margin:'0 0 2mm 0'}}>PAYMENT DETAILS</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2mm',fontSize:'10pt'}}>
                <div>
                  <div style={{fontWeight:'bold',marginBottom:'1mm'}}>Bank Name</div>
                  <div>{formData.bankName}</div>
                </div>
                <div>
                  <div style={{fontWeight:'bold',marginBottom:'1mm'}}>Account Number</div>
                  <div>{formData.accountNumber}</div>
                </div>
                <div>
                  <div style={{fontWeight:'bold',marginBottom:'1mm'}}>Account Name</div>
                  <div>{formData.accountName}</div>
                </div>
                <div>
                  <div style={{fontWeight:'bold',marginBottom:'1mm'}}>IFSC Code</div>
                  <div>{formData.ifscCode}</div>
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div style={{
              padding:'3mm 15mm 3mm 15mm',
              borderBottom:'1px solid #000',
              background:'#fff',
              fontSize:'8pt',
              lineHeight:'1.2'
            }}>
              <p style={{textAlign:'center',fontWeight:'bold',margin:'0 0 1mm 0',fontSize:'9pt'}}>
                This is an application for Promotional services to BUILDING INDIA DIGITAL.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'0.5mm'}}>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• All information including text & picture to be provide by the client who should also be the legal copyright owner for the same.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• BUILDING INDIA DIGITAL shall not be liable for any claims/damages arising out of content Posted on your charges.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• Work on service shall commence only after clearances of cheques/pay order.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• We are not responsible for any changes in future if business navigation page already made by client and they don't have any access to the page and own/claim this business option is not there.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• BUILDING INDIA DIGITAL will take 60 days to complete the services/work written in the application.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• After the work starts there will be No Claim & No Refund.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• Payment to us is covered under 'Advertising Contract' u/s 194C. TDS, if applicable, will be @2%.</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• Pursuant to the signing of this performa invoice, I hereby allow BUILDING INDIA DIGITAL to make, commercial calls to my mobile number(s) and organization contact number(s).</p>
                <p style={{margin:'0',padding:'0',fontSize:'8pt'}}>• This declaration will hold valid even if choose to get my numbers registered for NONC at any future date.</p>
              </div>
            </div>

            {/* Signatures - NO BORDERS */}
            <div style={{padding:'4mm 15mm 4mm 15mm'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8mm'}}>
                <div style={{textAlign:'center'}}>
                  <h3 style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>CLIENT SIGNATURE</h3>
                  <div style={{
                    padding:'2mm',
                    height:'20mm',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    background:'#fff'
                  }}>
                    <div style={{textAlign:'center',fontSize:'9pt'}}>
                      <div>Signature Space</div>
                      <div style={{marginTop:'0.5mm'}}>(Client will sign here)</div>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:'center'}}>
                  <h3 style={{fontSize:'11pt',fontWeight:'bold',marginBottom:'2mm'}}>ORGANISATION SIGNATURE</h3>
                  <div style={{
                    padding:'0',
                    height:'20mm',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    background:'#fff',
                    overflow:'hidden'
                  }}>
                    <img 
                      src={signatureImage} 
                      alt="Organisation Signature" 
                      style={{
                        width:'100%',
                        height:'300%',
                        objectFit:'contain',
                        opacity:'1'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 2 - TERMS & CONDITIONS */}
          <div className="page page-2" style={{
            width:'210mm',
            minHeight:'297mm',
            background:'#fff',
            padding:'15mm 15mm 15mm 15mm',
            fontSize:'9pt',
            lineHeight:'1.3',
            pageBreakBefore:'always'
          }}>
            <h3 style={{
              fontSize:'14pt',
              fontWeight:'bold',
              marginBottom:'4mm',
              textAlign:'center',
              borderBottom:'2px solid #000',
              paddingBottom:'2mm'
            }}>TERMS & CONDITIONS OF SERVICES</h3>
            
            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>1. GENERAL</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>1.1 The terms & conditions contained herein shall constitute and form an entire Agreement (hereinafter referred to as Agreement between BUILDING INDIA DIGITAL and the Customer.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>1.2. Any clause of the Terms and conditions if deemed invalid, void or for any reason becomes unenforceable, shall be deemed severable and shall not affect the validity and enforce ability of the remaining clauses of the conditions of this agreement.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>2. SERVICES.EXCLUSIONS & PERFORMANCE</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>2.1 In the event the advertisement requirements requested by the Customer fell within the restricted category of face book & you tube or are not supported by face book & you tube are one against the policy of face book & youtube.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>2.2. BUILDING INDIA DIGITAL reserves the right to refuse or cancel any advertising requirement at its sole discretion, with or without cause, at any time, Balanced advertising budget will not be refunded to the Customer.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>3. CONSIDERATION</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>3.1 The considerations means the cost of the package, purchased by the Customer from BUILDING INDIA DIGITAL.</p>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>3.2 BUILDING INDIA DIGITAL reserves the right to charge for any additional work executed by BUILDING INDIA DIGITAL:</p>
              <p style={{margin:'0',fontSize:'9pt'}}>3.3 In the vent the Customer agree to pay the consideration for the services via ECS mode, than the same cannot be cancelled by the Customer amidst the terms of the agreement, unless the Agreement is earlier terminated by BUILDING INDIA DIGITAL at its sole discretion or by mutual consent of BUILDING INDIA DIGITAL and the customer.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>4. INDEMNITY</h4>
              <p style={{margin:'0',fontSize:'9pt'}}>4.1 Customer shall indemnify and hold BUILDING INDIA DIGITAL harmless from all claims, costs, proceedings, damages and expenses (including legal professional fees and expenses), awarded against or paid by BUILDING INDIA DIGITAL as a result of or in connection with any alleged or actual infringement of any third party's. Intellectual property right (including copyright) or other rights arising out of the use or supply of the information by soon behalf of the Customer to BUILDING INDIA DIGITAL.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>5. TERMINATION</h4>
              <p style={{margin:'0',fontSize:'9pt'}}>5.1 If the contract is terminated by the customer before services under this Agreement are to begin executions or are in the process of completion that in such an event, under no circumstances, of the consideration paid or agreed to be the Customer, shall not be refundable and the same shall not be forfeited in full.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>6. MISCELIANEOUS</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>6.1 BUILDING INDIA DIGITAL shall be permitted to identify customer, as BUILDING INDIA DIGITAL client and may use customer's name in connection with BUILDING INDIA DIGITAL marketing invitative.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>6.2 Customer agrees and permits BUILDING INDIA DIGITAL to make calls and messages on his mobile and office contact numbers subsequent to the signing of this agreement.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>7. DISCLAIMER</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>7.1 BUILDING INDIA DIGITAL makes no representation, warranties or guarantees of any kind as to the level of sales, purchase, click, sales leads or other performance that customer can expect from advertising campaign through BUILDING INDIA DIGITAL any estimated provided by BUILDING INDIA DIGITAL to the customer are not intended to create any binding obligation or to be relied upon by the customer and the same are mere estimates.</p>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>7.2 BUILDING INDIA DIGITAL will not be liable for any loss of profit, loss of contract, loss of use, or any direct and/or indirect and/or any consequential loss damage and expensesustained incurred by the customer as a result of any acts or omission or information or advise given in any form by or on behalf of BUILDING INDIA DIGITAL to the customer and the customer is advised to make its own inquiries and use its own judgement and/or intellect before taking any decision regarding the same.</p>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>7.3 In addition to the above it is further agreed that the customer shall be solely liable for any loss or damage, withtermonetary or other suffered by it as a result of any change effected by it on its own in the website by using CMS and BUILDING INDIA DIGITAL shall not be held liable any account whatsoever.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>7.4 Customer would be provided access to reporting interface by BUILDING INDIA DIGITAL showcasing all the critical performance parametershowever BUILDING INDIA DIGITAL accept no liability based on performance.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>8. FORCE MAJEURE</h4>
              <p style={{margin:'0',fontSize:'9pt'}}>8.1 Neither party will be liable to the other, for any delay or failure to fulfill obligations set for till in this agreement caused by force major reasons or circumstances beyond their control.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>9. COMMUNICATION</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>9.1 Any notice send by the customer with respect to this agreement has be in writing and has to be sent registered post at the following address. F-140, 4th Floor, Phase-8B, Mohali, Punjab.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>9.2 In case of any query the Customer can contact the Manager of BUILDING INDIA DIGITAL between 10Am to 6 PM between Monday to Friday on the phone number given on the face of the present invoice.</p>
            </div>

            <div style={{marginBottom:'3mm'}}>
              <h4 style={{fontWeight:'bold',marginBottom:'1mm',fontSize:'10pt'}}>10. GOVERNING LAWAND JURISDICTION</h4>
              <p style={{margin:'0 0 1mm 0',fontSize:'9pt'}}>10.1 The agreement, its validity, construction, interpretation, effect, performance and termination shall be governed by the laws (both substantive and procedural) as applicable in India From time to time.</p>
              <p style={{margin:'0',fontSize:'9pt'}}>10.2 Any dispute or difference arising out of or in connection with this agreement including its interpretation there of between BUILDING INDIA DIGITAL customer shall be subject to the exclusive jurisdiction to the courts of Mohali (Punjab) only.</p>
            </div>

            <div style={{textAlign:'center',fontWeight:'bold',marginTop:'4mm',paddingTop:'2mm',borderTop:'2px solid #000',fontSize:'10pt'}}>
              <p style={{margin:'0'}}>11. ABOVE PACKAGE IS FOR 1 ID ONLY</p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body, html {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-family: Arial, sans-serif;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          
          .quotation-content {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          
          .page {
            width: 210mm;
            min-height: 297mm !important;
            height: auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .page-1 {
            page-break-after: always !important;
          }
          
          .page-2 {
            page-break-before: always !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          th, td {
            border: 1px solid #000 !important;
          }
          
          body {
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }
        }
        
        @media screen {
          .quotation-content {
            font-size: 14px;
            margin: 0 auto;
          }
          
          .page {
            background: white;
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
        
        @media (max-width: 768px) {
          .quotation-content {
            transform: scale(0.95);
            transform-origin: top center;
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
        }
        
        th, td {
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

export default QuotationForm;