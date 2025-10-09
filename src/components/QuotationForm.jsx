import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit3, Printer, Plus, Trash2, Calendar, X, Bold, Italic, Underline, Type, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import your local images
import bidLogo from '../assets/images/bid.png';
import signatureImage from '../assets/images/signature1.png';

const QuotationForm = () => {
  const [subscriptionItems, setSubscriptionItems] = useState([
    { id: 1, serialNumber: '', subscription: '' }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [showTextEditor, setShowTextEditor] = useState({ id: null, field: null });
  const [formData, setFormData] = useState({
    clientName: '',
    address: '',
    contactPerson: '',
    phone: '',
    amount: '',
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

  const textEditorRef = useRef(null);
  const calendarRef = useRef(null);

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
      bankName: 'Karnataka Bank (Zirakpur)',
      accountNumber: '0899202400002001',
      accountName: 'Building India Digital',
      ifscCode: 'KARB0000899',
      isRevised: formData.isRevised,
      revisionNumber: formData.revisionNumber
    });
    setSubscriptionItems([{ id: 1, serialNumber: '', subscription: '' }]);
  };

  const handleDateSelect = (date) => {
    generateQuotationInfo(date);
    setShowDatePicker(false);
  };

  const toggleEditMode = () => setIsEditing(!isEditing);

  const toggleRevised = () => {
    setFormData(prev => ({
      ...prev,
      isRevised: !prev.isRevised,
      revisionNumber: !prev.isRevised ? 1 : 0
    }));
  };

  const updateRevisionNumber = (increment) => {
    setFormData(prev => ({
      ...prev,
      revisionNumber: Math.max(0, prev.revisionNumber + increment)
    }));
  };

  const openTextEditor = (id, field, content) => {
    if (!isEditing) return;
    setShowTextEditor({ id, field });
    setTimeout(() => {
      if (textEditorRef.current) {
        textEditorRef.current.innerHTML = content || '';
        textEditorRef.current.focus();
      }
    }, 100);
  };

  const closeTextEditor = () => {
    if (showTextEditor.id && textEditorRef.current) {
      const content = textEditorRef.current.innerHTML;
      updateSubscriptionItem(showTextEditor.id, showTextEditor.field, content);
    }
    setShowTextEditor({ id: null, field: null });
  };

  const toggleTextStyle = (command) => {
    if (textEditorRef.current) {
      textEditorRef.current.focus();
      document.execCommand(command, false, null);
    }
  };

  const changeFontSize = (increase) => {
    if (textEditorRef.current) {
      textEditorRef.current.focus();
      document.execCommand('fontSize', false, increase ? '5' : '3');
    }
  };

  const changeTextColor = (color) => {
    if (textEditorRef.current) {
      textEditorRef.current.focus();
      document.execCommand('foreColor', false, color);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('quotation-form');
    if (!element) return;

    // Create temporary container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;font-family:Arial,sans-serif;';
    document.body.appendChild(container);

    // Clone and clean element
    const clone = element.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    
    // Force all styles inline with proper text rendering
    clone.querySelectorAll('*').forEach(el => {
      el.removeAttribute('class');
      const tag = el.tagName.toLowerCase();
      
      if (tag === 'input' || tag === 'textarea') {
        const value = el.value || el.placeholder || '';
        el.outerHTML = `<div style="font-size:14px;color:#000;padding:6px 0;border-bottom:1px solid #e5e7eb;min-height:24px;">${value}</div>`;
      } else if (tag === 'table') {
        el.style.cssText = 'border-collapse:collapse;width:100%;border:1px solid #000;background:#fff;';
      } else if (tag === 'th') {
        el.style.cssText = 'background:#e5e7eb;color:#000;border:1px solid #000;padding:12px;text-align:left;font-weight:bold;font-size:14px;';
      } else if (tag === 'td') {
        el.style.cssText = 'background:#fff;color:#000;border:1px solid #000;padding:12px;vertical-align:top;font-size:14px;';
      } else if (tag === 'h3') {
        el.style.cssText = 'font-size:18px;font-weight:bold;color:#000;margin:0 0 12px 0;';
      } else if (tag === 'h4') {
        el.style.cssText = 'font-size:11px;font-weight:bold;color:#000;margin:4px 0 2px 0;';
      } else if (tag === 'p') {
        el.style.cssText = 'font-size:11px;color:#000;margin:0 0 3px 0;line-height:1.5;';
      } else if (tag === 'div') {
        if (!el.style.fontSize) el.style.fontSize = '14px';
        if (!el.style.color) el.style.color = '#000';
      } else {
        el.style.color = '#000';
        el.style.backgroundColor = 'transparent';
      }
    });

    container.appendChild(clone);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: container.scrollHeight,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;
      
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`BID-Quotation-${quotationInfo.number.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error generating PDF: ' + error.message);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handlePrint = () => window.print();

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

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',padding:'16px'}} className="print-container">
      {/* Control Panel */}
      <div style={{maxWidth:'1280px',margin:'0 auto 24px'}} className="no-print">
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'16px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'16px',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <h2 style={{fontSize:'20px',fontWeight:'bold',color:'#1f2937',margin:0}}>Quotation Generator</h2>
              <button onClick={generateNewQuotation} style={{padding:'8px 16px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px'}}>
                Generate New Quotation
              </button>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={downloadPDF} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px'}}>
                <Download size={16} /> Download PDF
              </button>
              <button onClick={handlePrint} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',background:'#8b5cf6',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px'}}>
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Form */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <div id="quotation-form" style={{background:'#fff',boxShadow:'0 10px 15px rgba(0,0,0,0.1)',borderRadius:'8px',overflow:'hidden',maxWidth:'1024px',width:'100%',minHeight:'297mm'}} className="quotation-content">
          
          {/* Text Editor Modal */}
          {showTextEditor.id && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'16px'}} className="no-print">
              <div style={{background:'#fff',borderRadius:'8px',padding:'24px',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflow:'auto'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <h3 style={{fontSize:'18px',fontWeight:'bold',margin:0}}>Text Editor</h3>
                  <button onClick={closeTextEditor} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280'}}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px',padding:'8px',border:'1px solid #d1d5db',borderRadius:'4px'}}>
                  <button onClick={() => toggleTextStyle('bold')} style={{padding:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background:'transparent'}} title="Bold"><Bold size={16} /></button>
                  <button onClick={() => toggleTextStyle('italic')} style={{padding:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background:'transparent'}} title="Italic"><Italic size={16} /></button>
                  <button onClick={() => toggleTextStyle('underline')} style={{padding:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background:'transparent'}} title="Underline"><Underline size={16} /></button>
                  <button onClick={() => changeFontSize(true)} style={{padding:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background:'transparent'}} title="Increase"><Type size={16} />+</button>
                  <button onClick={() => changeFontSize(false)} style={{padding:'8px',border:'none',borderRadius:'4px',cursor:'pointer',background:'transparent'}} title="Decrease"><Type size={12} />-</button>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <Palette size={16} />
                    <input type="color" onChange={(e) => changeTextColor(e.target.value)} style={{width:'32px',height:'32px',cursor:'pointer'}} />
                  </div>
                </div>
                <div ref={textEditorRef} contentEditable style={{width:'100%',height:'160px',border:'1px solid #d1d5db',borderRadius:'4px',padding:'8px',overflow:'auto'}} />
                <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'16px'}}>
                  <button onClick={closeTextEditor} style={{padding:'8px 16px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}>
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{padding:'24px',borderBottom:'2px solid #1f2937'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',flexWrap:'wrap',gap:'16px'}}>
              <div style={{fontSize:'14px',color:'#000'}}>
                <div style={{fontWeight:'600',marginBottom:'4px'}}>#246, Devaji vip Plaza, VIP Road</div>
                <div style={{fontWeight:'600',marginBottom:'4px'}}>Zirakpur, Punjab Pin : 140603</div>
                <div style={{fontWeight:'600'}}>90414-99964/73</div>
              </div>
              <div style={{textAlign:'center',position:'relative'}}>
                <div style={{fontSize:'14px',color:'#000',marginBottom:'4px'}}>No. {quotationInfo.number}</div>
                <div style={{fontSize:'14px',color:'#000'}}>Dated: {quotationInfo.date}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'8px'}} className="no-print">
                  <button onClick={() => setShowDatePicker(!showDatePicker)} style={{padding:'8px',background:'transparent',border:'none',color:'#3b82f6',cursor:'pointer'}}>
                    <Calendar size={18} />
                  </button>
                  <button onClick={toggleRevised} style={{padding:'4px 12px',fontSize:'14px',borderRadius:'4px',border:'1px solid',background:formData.isRevised?'#fed7aa':'#f3f4f6',color:formData.isRevised?'#c2410c':'#4b5563',borderColor:formData.isRevised?'#fdba74':'#d1d5db',cursor:'pointer'}}>
                    {formData.isRevised ? 'Revised' : 'Mark Revised'}
                  </button>
                  {formData.isRevised && (
                    <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <button onClick={() => updateRevisionNumber(-1)} style={{width:'24px',height:'24px',background:'#e5e7eb',border:'none',borderRadius:'4px',cursor:'pointer'}}>-</button>
                      <span style={{fontSize:'12px',fontWeight:'500'}}>R{formData.revisionNumber}</span>
                      <button onClick={() => updateRevisionNumber(1)} style={{width:'24px',height:'24px',background:'#e5e7eb',border:'none',borderRadius:'4px',cursor:'pointer'}}>+</button>
                    </div>
                  )}
                </div>
                {showDatePicker && (
                  <div ref={calendarRef} style={{position:'absolute',zIndex:40,top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:'8px'}} className="no-print">
                    <CalendarComponent onDateSelect={handleDateSelect} />
                  </div>
                )}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',marginBottom:'8px'}}>
                  <img src={bidLogo} alt="BID Logo" style={{height:'64px',marginRight:'8px',objectFit:'contain'}} />
                  <div>
                    <div style={{fontSize:'20px',fontWeight:'bold',color:'#000',lineHeight:'1.2'}}>Building<br />India Digital</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div style={{padding:'24px',borderBottom:'1px solid #1f2937'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              <div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontWeight:'bold',fontSize:'14px',color:'#000',marginBottom:'4px'}}>Client Name</div>
                  <input type="text" value={formData.clientName} onChange={(e) => handleFormChange('clientName', e.target.value)} placeholder="Enter client name" style={{width:'100%',padding:'8px 0',fontSize:'14px',border:'none',borderBottom:'1px solid #e5e7eb',outline:'none',color:'#000',background:'transparent'}} />
                </div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontWeight:'bold',fontSize:'14px',color:'#000',marginBottom:'4px'}}>Contact Person</div>
                  <input type="text" value={formData.contactPerson} onChange={(e) => handleFormChange('contactPerson', e.target.value)} placeholder="Enter contact person" style={{width:'100%',padding:'8px 0',fontSize:'14px',border:'none',borderBottom:'1px solid #e5e7eb',outline:'none',color:'#000',background:'transparent'}} />
                </div>
              </div>
              <div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontWeight:'bold',fontSize:'14px',color:'#000',marginBottom:'4px'}}>Address</div>
                  <textarea value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} placeholder="Enter client address" rows="3" style={{width:'100%',padding:'8px 0',fontSize:'14px',border:'none',borderBottom:'1px solid #e5e7eb',outline:'none',resize:'none',color:'#000',background:'transparent'}} />
                </div>
                <div>
                  <div style={{fontWeight:'bold',fontSize:'14px',color:'#000',marginBottom:'4px'}}>Phone/Mobile</div>
                  <input type="text" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} placeholder="Enter phone number" style={{width:'100%',padding:'8px 0',fontSize:'14px',border:'none',borderBottom:'1px solid #e5e7eb',outline:'none',color:'#000',background:'transparent'}} />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div style={{padding:'24px',borderBottom:'1px solid #1f2937'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
              <h3 style={{fontSize:'18px',fontWeight:'bold',color:'#000',margin:0}}>SUBSCRIPTION DETAILS</h3>
              <div style={{display:'flex',gap:'8px'}} className="no-print">
                <button onClick={addSubscriptionItem} style={{display:'flex',alignItems:'center',gap:'4px',padding:'8px 12px',background:'#10b981',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px'}}>
                  <Plus size={16} /> Add Item
                </button>
                <button onClick={toggleEditMode} style={{display:'flex',alignItems:'center',gap:'4px',padding:'8px 12px',background:isEditing?'#3b82f6':'#6b7280',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'14px'}}>
                  <Edit3 size={16} /> {isEditing ? 'Editing' : 'Edit'}
                </button>
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid #1f2937'}}>
                <thead>
                  <tr style={{background:'#e5e7eb'}}>
                    <th style={{border:'1px solid #1f2937',padding:'12px',textAlign:'left',color:'#000',fontWeight:'bold',fontSize:'14px',width:'25%'}}>S. No.</th>
                    <th style={{border:'1px solid #1f2937',padding:'12px',textAlign:'left',color:'#000',fontWeight:'bold',fontSize:'14px'}}>SUBSCRIPTION</th>
                    {isEditing && <th style={{border:'1px solid #1f2937',padding:'12px',textAlign:'left',color:'#000',fontWeight:'bold',fontSize:'14px',width:'100px'}} className="no-print">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {subscriptionItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{border:'1px solid #1f2937',padding:'12px',verticalAlign:'top',background:'#fff'}}>
                        <div
                          onClick={() => isEditing && openTextEditor(item.id, 'serialNumber', item.serialNumber)}
                          style={{
                            minHeight:'80px',
                            padding:'8px',
                            cursor:isEditing?'pointer':'default',
                            border:isEditing?'1px dashed #60a5fa':'none',
                            background:isEditing?'#eff6ff':'transparent',
                            color:item.serialNumber?'#000':'#9ca3af',
                            fontStyle:!item.serialNumber?'italic':'normal',
                            fontSize:'14px'
                          }}
                        >
                          {item.serialNumber ? <div dangerouslySetInnerHTML={{ __html: item.serialNumber }} /> : (isEditing && 'Click to add text...')}
                        </div>
                      </td>
                      <td style={{border:'1px solid #1f2937',padding:'12px',verticalAlign:'top',background:'#fff'}}>
                        <div
                          onClick={() => isEditing && openTextEditor(item.id, 'subscription', item.subscription)}
                          style={{
                            minHeight:'80px',
                            padding:'8px',
                            cursor:isEditing?'pointer':'default',
                            border:isEditing?'1px dashed #60a5fa':'none',
                            background:isEditing?'#eff6ff':'transparent',
                            color:item.subscription?'#000':'#9ca3af',
                            fontStyle:!item.subscription?'italic':'normal',
                            fontSize:'14px'
                          }}
                        >
                          {item.subscription ? <div dangerouslySetInnerHTML={{ __html: item.subscription }} /> : (isEditing && 'Click to add text...')}
                        </div>
                      </td>
                      {isEditing && (
                        <td style={{border:'1px solid #1f2937',padding:'12px',textAlign:'center',verticalAlign:'top',background:'#fff'}} className="no-print">
                          <button onClick={() => removeSubscriptionItem(item.id)} style={{padding:'6px',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'4px',cursor:'pointer'}} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount & Payment Details Combined Page */}
          <div style={{padding:'12px 24px',borderBottom:'1px solid #1f2937'}}>
            <h3 style={{fontSize:'16px',fontWeight:'bold',color:'#000',marginBottom:'6px',margin:0}}>AMOUNT</h3>
            <input type="text" value={formData.amount} onChange={(e) => handleFormChange('amount', e.target.value)} placeholder="Enter amount (e.g., 17,500/-)" style={{width:'100%',padding:'6px 12px',fontSize:'22px',fontWeight:'bold',color:'#000',border:'1px solid #d1d5db',borderRadius:'6px',marginTop:'6px'}} />
            <div style={{fontSize:'13px',color:'#000',marginTop:'3px'}}>(GST EXTRA)</div>
          </div>

          {/* Payment Details */}
          <div style={{padding:'12px 24px',borderBottom:'1px solid #1f2937',pageBreakAfter:'avoid'}}>
            <h3 style={{fontSize:'16px',fontWeight:'bold',color:'#000',marginBottom:'6px',margin:'0 0 6px 0'}}>PAYMENT DETAILS</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div>
                <div style={{fontWeight:'bold',fontSize:'13px',color:'#000',marginBottom:'1px'}}>Bank Name</div>
                <div style={{fontSize:'13px',color:'#000',padding:'4px 0'}}>{formData.bankName}</div>
              </div>
              <div>
                <div style={{fontWeight:'bold',fontSize:'13px',color:'#000',marginBottom:'1px'}}>Account Number</div>
                <div style={{fontSize:'13px',color:'#000',padding:'4px 0'}}>{formData.accountNumber}</div>
              </div>
              <div>
                <div style={{fontWeight:'bold',fontSize:'13px',color:'#000',marginBottom:'1px'}}>Account Name</div>
                <div style={{fontSize:'13px',color:'#000',padding:'4px 0'}}>{formData.accountName}</div>
              </div>
              <div>
                <div style={{fontWeight:'bold',fontSize:'13px',color:'#000',marginBottom:'1px'}}>IFSC Code</div>
                <div style={{fontSize:'13px',color:'#000',padding:'4px 0'}}>{formData.ifscCode}</div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div style={{padding:'8px 24px',borderBottom:'1px solid #1f2937',background:'#fff',pageBreakAfter:'avoid',pageBreakInside:'avoid'}}>
            <div style={{fontSize:'9px',color:'#000',lineHeight:'1.3'}}>
              <p style={{textAlign:'center',fontWeight:'bold',margin:'0 0 4px 0',fontSize:'10px'}}>
                This is an application for Promotional services to BUILDING INDIA DIGITAL.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                <p style={{margin:'0',padding:'0'}}>• All information including text & picture to be provide by the client who should also be the legal copyright owner for the same.</p>
                <p style={{margin:'0',padding:'0'}}>• BUILDING INDIA DIGITAL shall not be liable for any claims/damages arising out of content Posted on your charges.</p>
                <p style={{margin:'0',padding:'0'}}>• Work on service shall commence only after clearances of cheques/pay order.</p>
                <p style={{margin:'0',padding:'0'}}>• We are not responsible for any changes in future if business navigation page already made by client and they don't have any access to the page and own/claim this business option is not there.</p>
                <p style={{margin:'0',padding:'0'}}>• BUILDING INDIA DIGITAL will take 60 days to complete the services/work written in the application.</p>
                <p style={{margin:'0',padding:'0'}}>• After the work starts there will be No Claim & No Refund.</p>
                <p style={{margin:'0',padding:'0'}}>• Payment to us is covered under 'Advertising Contract' u/s 194C. TDS, if applicable, will be @2%.</p>
                <p style={{margin:'0',padding:'0'}}>• Pursuant to the signing of this performa invoice, I hereby allow BUILDING INDIA DIGITAL to make, commercial calls to my mobile number(s) and organization contact number(s).</p>
                <p style={{margin:'0',padding:'0'}}>• This declaration will hold valid even if choose to get my numbers registered for NONC at any future date.</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{padding:'24px',borderBottom:'1px solid #1f2937'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:'24px'}}>
              <div style={{textAlign:'center'}}>
                <h3 style={{fontSize:'16px',fontWeight:'bold',color:'#000',marginBottom:'12px'}}>CLIENT SIGNATURE</h3>
                <div style={{border:'2px solid #1f2937',padding:'16px',height:'160px',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff'}}>
                  <div style={{textAlign:'center',color:'#000'}}>
                    <div style={{fontSize:'24px',marginBottom:'8px'}}>✎</div>
                    <div style={{fontSize:'14px'}}>Signature Space</div>
                    <div style={{fontSize:'12px',marginTop:'4px'}}>(Client will sign here)</div>
                  </div>
                </div>
              </div>
              <div style={{textAlign:'center'}}>
                <h3 style={{fontSize:'16px',fontWeight:'bold',color:'#000',marginBottom:'12px'}}>ORGANISATION SIGNATURE</h3>
                <div style={{border:'2px solid #1f2937',padding:'12px',height:'160px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <img 
                    src={signatureImage} 
                    alt="Organisation Signature" 
                    style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',opacity:'0.9'}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div style={{padding:'24px',background:'#fff'}} className="terms-section">
            <h3 style={{fontSize:'16px',fontWeight:'bold',color:'#000',marginBottom:'12px'}}>TERMS & CONDITIONS OF SERVICES</h3>
            <div style={{fontSize:'10px',color:'#000',lineHeight:'1.4'}}>
              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>1. GENERAL</h4>
                <p style={{margin:'0 0 2px 0'}}>1.1 The terms & conditions contained herein shall constitute and form an entire Agreement between BUILDING INDIA DIGITAL and the Customer.</p>
                <p style={{margin:'0'}}>1.2 Any clause of the Terms and conditions if deemed invalid, void or for any reason becomes unenforceable, shall be deemed severable and shall not affect the validity and enforce ability of the remaining clauses of the conditions of this agreement.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>2. TERM</h4>
                <p style={{margin:'0 0 2px 0'}}>2.1 The term of this agreement shall be for a period of 12 months from the date of execution of this agreement.</p>
                <p style={{margin:'0'}}>2.2 This agreement shall be automatically renewed for successive terms of 12 months each unless either party gives written notice of termination at least 30 days prior to the end of the then current term.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>3. PAYMENT TERMS</h4>
                <p style={{margin:'0 0 2px 0'}}>3.1 The Customer agrees to pay BUILDING INDIA DIGITAL the fees as specified in the subscription details.</p>
                <p style={{margin:'0 0 2px 0'}}>3.2 All payments shall be made in advance unless otherwise agreed in writing.</p>
                <p style={{margin:'0'}}>3.3 Late payments shall attract interest at the rate of 1.5% per month.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>4. INTELLECTUAL PROPERTY</h4>
                <p style={{margin:'0 0 2px 0'}}>4.1 All intellectual property rights in the services provided shall remain the property of BUILDING INDIA DIGITAL.</p>
                <p style={{margin:'0'}}>4.2 The Customer shall not reproduce, distribute, or create derivative works based on the services without prior written consent.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>5. CONFIDENTIALITY</h4>
                <p style={{margin:'0 0 2px 0'}}>5.1 Both parties agree to maintain the confidentiality of any proprietary information received from the other party.</p>
                <p style={{margin:'0'}}>5.2 This obligation shall survive the termination of this agreement.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>6. LIMITATION OF LIABILITY</h4>
                <p style={{margin:'0 0 2px 0'}}>6.1 BUILDING INDIA DIGITAL's total liability under this agreement shall not exceed the total fees paid by the Customer.</p>
                <p style={{margin:'0'}}>6.2 In no event shall BUILDING INDIA DIGITAL be liable for any indirect, special, or consequential damages.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>7. TERMINATION</h4>
                <p style={{margin:'0 0 2px 0'}}>7.1 Either party may terminate this agreement for material breach by the other party upon 30 days written notice.</p>
                <p style={{margin:'0'}}>7.2 Upon termination, all fees due to BUILDING INDIA DIGITAL shall become immediately payable.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>8. GOVERNING LAW</h4>
                <p style={{margin:'0 0 2px 0'}}>8.1 This agreement shall be governed by and construed in accordance with the laws of India.</p>
                <p style={{margin:'0'}}>8.2 Any disputes arising out of this agreement shall be subject to the exclusive jurisdiction of the courts in Zirakpur, Punjab.</p>
              </div>

              <div style={{marginBottom:'8px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>9. FORCE MAJEURE</h4>
                <p style={{margin:'0'}}>9.1 Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control.</p>
              </div>

              <div style={{marginBottom:'12px'}}>
                <h4 style={{fontWeight:'bold',color:'#000',marginBottom:'2px',fontSize:'11px'}}>10. ENTIRE AGREEMENT</h4>
                <p style={{margin:'0'}}>10.1 This agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, and representations.</p>
              </div>

              <div style={{textAlign:'center',fontWeight:'bold',marginTop:'16px',paddingTop:'12px',borderTop:'1px solid #1f2937'}}>
                <p style={{margin:'0'}}>ABOVE PACKAGE IS FOR 1 ID ONLY</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: A4; 
          }
          .no-print { 
            display: none !important; 
          }
          .print-container { 
            background: #fff !important; 
            padding: 0 !important; 
          }
          .quotation-content { 
            box-shadow: none !important; 
            border-radius: 0 !important; 
          }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            color: #000 !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          .terms-section { 
            page-break-before: always !important; 
            page-break-inside: avoid !important; 
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        @media (max-width: 768px) {
          #quotation-form { 
            font-size: 12px; 
          }
        }
      `}</style>
    </div>
  );
};

export default QuotationForm;