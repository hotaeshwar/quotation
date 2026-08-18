'use client';

import React from 'react';

const getTodayFormatted = () => {
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${today.getFullYear()}`;
};

const isHtmlEmpty = (str) => {
  if (!str) return true;
  const stripped = str.replace(/<[^>]*>/g, '').trim();
  return stripped === '';
};

export default function QuotationPreview({ formData, companySettings, containerRef }) {
  const company = companySettings?.company || {};
  const payment = formData.paymentDetails || companySettings?.payment || {};

  const items = formData.items || [];

  // Helper to chunk items dynamically (max 2 items, or 1 item if description has 5+ bullets/long text)
  const chunkArray = (arr) => {
    if (!arr || arr.length === 0) return [[]];
    const chunks = [];
    let currentChunk = [];
    let currentWeight = 0;

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const desc = item.description || '';
      const listCount = (desc.match(/<li/g) || []).length;
      const isHeavy = desc.length > 300 || listCount >= 5;
      const weight = isHeavy ? 2 : 1;

      if (currentChunk.length > 0 && (currentChunk.length >= 2 || currentWeight + weight > 2)) {
        chunks.push(currentChunk);
        currentChunk = [item];
        currentWeight = weight;
      } else {
        currentChunk.push(item);
        currentWeight += weight;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    return chunks;
  };

  const itemChunks = chunkArray(items);
  const totalPages = itemChunks.length + 2; // Fixed: 1 page for Declaration & Payment, 1 page for Terms & Conditions

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start pb-1 gap-4">
      <div className="space-y-2 max-w-lg">
        {/* Address with MapPin Icon */}
        <div className="flex items-start gap-2.5">
          <svg className="w-4.5 h-4.5 text-black shrink-0 mt-0.5" fill="none" stroke="#000000" viewBox="0 0 24 24" style={{ color: '#000000', stroke: '#000000' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <div className="font-extrabold text-sm sm:text-base whitespace-pre-line leading-snug" style={{ color: '#000000' }}>
            {company.address || '#246, Devaji vip Plaza, VIP Road\nZirakpur, Punjab Pin : 140603'}
          </div>
        </div>

        {/* Phone Line */}
        <div className="flex items-center gap-2.5 pt-0.5" style={{ color: '#000000' }}>
          <svg className="w-4.5 h-4.5 text-black shrink-0" fill="none" stroke="#000000" viewBox="0 0 24 24" style={{ color: '#000000', stroke: '#000000' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <span className="font-extrabold text-sm sm:text-base tracking-tight" style={{ color: '#000000', fontWeight: 800 }}>{company.phone || '90414-99964/73'}</span>
        </div>

        {/* Quotation Number */}
        <div className="pt-0.5 text-sm font-bold flex items-center gap-3" style={{ color: '#000000' }}>
          <span>No. <span className="font-mono font-extrabold">{formData.quotationNumber || 'BID-2026/08/11/01'}</span></span>
        </div>
      </div>

      {/* Logo on Right Side */}
      <div className="flex flex-col items-end pt-1">
        <img
          src={company.logo || '/images/LOGO c.png'}
          alt="Company Logo"
          className="h-20 sm:h-24 w-auto object-contain max-w-[280px]"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );

  const declarationPageNum = itemChunks.length + 1;

  return (
    <div className="bg-gray-200 p-4 sm:p-6 overflow-x-auto overflow-y-auto max-h-[calc(100vh-80px)] flex flex-col items-center gap-6 select-none w-full">
      <div id="quotation-pdf-preview" ref={containerRef} className="flex flex-col gap-6 w-[210mm] min-w-[210mm] shrink-0">
        
        {/* SUBSCRIPTION PAGES (1 to N) */}
        {itemChunks.map((chunk, chunkIndex) => {
          const isFirstPage = chunkIndex === 0;
          const isLastSubscriptionPage = chunkIndex === itemChunks.length - 1;
          const pageNum = chunkIndex + 1;

          // Calculate start item index for overall indexing across chunks
          let startIndex = 1;
          for (let c = 0; c < chunkIndex; c++) {
            startIndex += itemChunks[c].length;
          }

          return (
            <React.Fragment key={chunkIndex}>
              {chunkIndex > 0 && (
                <div className="text-xs font-bold uppercase tracking-widest my-1 text-center" style={{ color: '#4b5563' }}>
                  — Page {pageNum}: Project Description (Continuation) —
                </div>
              )}

              <div
                id={`pdf-page-${pageNum}`}
                className="bg-white text-gray-900 shadow-xl border border-gray-300 w-[210mm] min-w-[210mm] min-h-[297mm] h-[297mm] p-6 sm:p-7 font-sans text-sm flex flex-col justify-between overflow-hidden shrink-0"
                style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }}
              >
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* REVAMPED HEADER SECTION (ONLY ON PAGE 1) */}
                    {isFirstPage && renderHeader()}

                    {/* CUSTOMER / CONTACT INFORMATION FORMAT (RENDERED ONLY ON PAGE 1) */}
                    {isFirstPage && (
                      <div className="space-y-2 mt-3 text-sm font-sans" style={{ color: '#000000' }}>
                        {/* Dated Line (Top Right) */}
                        <div className="flex justify-end mb-1">
                          <div className="flex items-baseline gap-2 border-b-2 border-black min-w-[220px] justify-between pb-0.5" style={{ borderColor: '#000000' }}>
                            <span className="font-extrabold text-sm" style={{ color: '#000000' }}>Dated</span>
                            <span className="font-bold text-sm" style={{ color: '#000000' }}>{formData.date || getTodayFormatted()}</span>
                          </div>
                        </div>

                        {/* Business Name */}
                        <div className="border-b-2 border-black pb-1 flex items-baseline gap-3" style={{ borderColor: '#000000' }}>
                          <span className="font-extrabold text-sm whitespace-nowrap min-w-[130px]" style={{ color: '#000000' }}>Business Name</span>
                          <span className="font-bold text-sm flex-1 uppercase tracking-wide min-h-[1.2rem]" style={{ color: '#000000' }}>{formData.clientName || ''}</span>
                        </div>

                        {/* Address */}
                        <div className="border-b-2 border-black pb-1 flex items-baseline gap-3" style={{ borderColor: '#000000' }}>
                          <span className="font-extrabold text-sm whitespace-nowrap min-w-[130px]" style={{ color: '#000000' }}>Address</span>
                          <span className="font-bold text-sm flex-1 whitespace-pre-line leading-tight min-h-[1.2rem]" style={{ color: '#000000' }}>{formData.address || ''}</span>
                        </div>

                        {/* Contact Person & Phone/Mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="border-b-2 border-black pb-1 flex items-baseline gap-3" style={{ borderColor: '#000000' }}>
                            <span className="font-extrabold text-sm whitespace-nowrap" style={{ color: '#000000' }}>Contact Person</span>
                            <span className="font-bold text-sm flex-1 uppercase tracking-wide min-h-[1.2rem]" style={{ color: '#000000' }}>{formData.contactPerson || ''}</span>
                          </div>
                          <div className="border-b-2 border-black pb-1 flex items-baseline gap-3" style={{ borderColor: '#000000' }}>
                            <span className="font-extrabold text-sm whitespace-nowrap" style={{ color: '#000000' }}>Phone/Mobile</span>
                            <span className="font-bold text-sm flex-1 uppercase tracking-wide min-h-[1.2rem]" style={{ color: '#000000' }}>{formData.phone || ''}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROJECT DESCRIPTION TABLE (ACQUIRES FULL PAGE HEIGHT) */}
                  <div className="flex-1 flex flex-col my-1">
                    <div className="flex-1 border-2 border-black rounded-sm overflow-hidden flex flex-col" style={{ borderColor: '#000000', borderWidth: '2px', borderStyle: 'solid' }}>
                      <table className="w-full text-left border-collapse flex-1 h-full" style={{ borderCollapse: 'collapse', width: '100%', height: '100%' }}>
                        <thead>
                          <tr className="text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#000000', borderBottom: '2px solid #000000' }}>
                            <th className="py-2 px-3 w-20 text-center" style={{ borderRight: '2px solid #000000' }}>S. NO.</th>
                            <th className="py-2 px-4">PROJECT DESCRIPTION</th>
                          </tr>
                        </thead>
                        <tbody className="h-full">
                          {chunk.length > 0 ? (
                            chunk.map((item, idx) => {
                              const overallIndex = startIndex + idx;
                              const rawSNo = item.sNo;
                              const hasCustomSNo = rawSNo !== undefined && rawSNo !== null && !isHtmlEmpty(rawSNo);
                              const displaySNo = hasCustomSNo ? rawSNo : String(overallIndex);
                              const vAlign = item.vAlign || 'middle';
                              return (
                                <tr key={idx} style={{ borderBottom: idx === chunk.length - 1 ? 'none' : '2px solid #000000', verticalAlign: vAlign }}>
                                  <td className="py-2.5 px-3 text-center font-bold text-xs whitespace-normal break-words" style={{ borderRight: '2px solid #000000', color: '#000000', width: '90px', verticalAlign: vAlign }}>
                                    <div
                                      className="pdf-prose-content prose max-w-none text-xs leading-tight font-bold [&_ul]:list-disc [&_ul]:pl-3 [&_ol]:list-decimal [&_ol]:pl-3 [&_li]:list-item [&_*]:my-0 [&_*]:py-0 [&_p]:mb-0.5 [&_p]:text-center [&_li]:my-0.5 [&_li]:leading-tight text-center"
                                      style={{ color: '#000000', fontWeight: 700 }}
                                      dangerouslySetInnerHTML={{
                                        __html: typeof displaySNo === 'string' && displaySNo.includes('<') && displaySNo.includes('>')
                                          ? displaySNo
                                          : `<p>${displaySNo}</p>`
                                      }}
                                    />
                                  </td>
                                  <td className="py-2 px-3.5" style={{ color: '#000000', verticalAlign: vAlign }}>
                                    <div
                                      className="pdf-prose-content prose max-w-none text-xs leading-tight font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:list-item [&_*]:my-0 [&_*]:py-0 [&_p]:mb-0.5 [&_li]:my-0.5 [&_li]:leading-tight"
                                      style={{ color: '#000000', fontWeight: 700 }}
                                      dangerouslySetInnerHTML={{ __html: item.description || '' }}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-4 text-center italic text-xs font-bold" style={{ color: '#6b7280' }}>No details added.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AMOUNT BOX (RENDERED ONLY ON THE LAST SUBSCRIPTION PAGE) */}
                  {isLastSubscriptionPage && (
                    <div className="pt-1">
                      <div className="border-2 border-black p-2.5 text-center rounded-sm" style={{ backgroundColor: '#f9fafb', borderColor: '#000000', borderWidth: '2px', borderStyle: 'solid' }}>
                        <div className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: '#000000' }}>
                          AMOUNT {formData.currency || 'INR (₹)'} {formData.amount ? Number(formData.amount).toLocaleString('en-IN') : '0'}
                        </div>
                        <div className="text-xs font-bold tracking-wider mt-0.5" style={{ color: '#000000' }}>(GST EXTRA)</div>
                      </div>
                    </div>
                  )}

                </div>

                {/* UNIFORM FOOTER SECTION */}
                <div className="text-center text-[10px] font-bold pt-2 border-t" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                  Page {pageNum} of {totalPages}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* VISUAL DIVIDER BEFORE DECLARATION & PAYMENT DETAILS PAGE */}
        <div className="text-xs font-bold uppercase tracking-widest my-1 text-center" style={{ color: '#4b5563' }}>
          — Page {declarationPageNum}: Declaration & Payment Details —
        </div>

        {/* PAGE (M+1): DECLARATION, PAYMENT DETAILS & SIGNATURES */}
        <div
          id={`pdf-page-${declarationPageNum}`}
          className="bg-white text-gray-900 shadow-xl border border-gray-300 w-[210mm] min-w-[210mm] min-h-[297mm] h-[297mm] p-7 sm:p-8 font-sans text-xs flex flex-col justify-between overflow-hidden shrink-0"
          style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }}
        >
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {/* TOP HALF: PAYMENT DETAILS & DECLARATION */}
            <div className="space-y-6">
              {/* PAYMENT DETAILS SECTION */}
              <div className="space-y-3">
                <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b-2 pb-1.5" style={{ color: '#000000', borderColor: '#111827' }}>
                  Payment Details
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-lg border-2 border-gray-300" style={{ backgroundColor: '#f9fafb', borderColor: '#9ca3af', color: '#000000' }}>
                  <div>
                    <span className="font-bold block text-xs uppercase tracking-wide" style={{ color: '#4b5563' }}>Bank Name</span>
                    <span className="font-extrabold text-sm sm:text-base" style={{ color: '#000000' }}>{payment.bankName || 'Karnataka Bank (Zirakpur)'}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-xs uppercase tracking-wide" style={{ color: '#4b5563' }}>Account Number</span>
                    <span className="font-extrabold text-sm sm:text-base font-mono" style={{ color: '#000000' }}>{payment.accountNumber || '0899202400002001'}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-xs uppercase tracking-wide" style={{ color: '#4b5563' }}>Account Name</span>
                    <span className="font-extrabold text-sm sm:text-base" style={{ color: '#000000' }}>{payment.accountName || 'Building India Digital'}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-xs uppercase tracking-wide" style={{ color: '#4b5563' }}>IFSC Code</span>
                    <span className="font-extrabold text-sm sm:text-base font-mono" style={{ color: '#000000' }}>{payment.ifscCode || 'KARB0000899'}</span>
                  </div>
                </div>

                {/* CHEQUE INSTRUCTION */}
                <div className="text-center font-extrabold text-xs sm:text-sm tracking-wide pt-1" style={{ color: '#dc2626' }}>
                  {payment.chequeInstruction || '* Cheques should be drawn in favour of Devine sTudio'}
                </div>
              </div>

              {/* DECLARATION SECTION */}
              <div className="space-y-3 pt-2">
                <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b-2 pb-1.5" style={{ color: '#000000', borderColor: '#111827' }}>
                  Declaration
                </div>
                <div
                  className="pdf-prose-content prose max-w-none text-xs sm:text-[12.5px] leading-relaxed font-bold pt-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>p]:mb-2 [&>p]:font-bold [&>li]:font-bold [&>li]:my-1 [&>li]:leading-normal"
                  style={{ color: '#000000', fontWeight: 700 }}
                  dangerouslySetInnerHTML={{ __html: formData.declaration || '' }}
                />
              </div>
            </div>

            {/* BOTTOM HALF: SIGNATURES SECTION */}
            <div className="flex justify-between items-end pt-6 pb-2 min-h-[110px]">
              <div className="space-y-1 text-center flex flex-col items-center">
                <div className="h-20 w-52"></div>
                <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider border-t-2 pt-1.5 w-52 text-center" style={{ borderColor: '#000000', color: '#000000' }}>
                  Client Signature
                </div>
              </div>

              <div className="space-y-1 text-center flex flex-col items-center">
                <div className="h-20 w-56 flex items-end justify-center overflow-visible">
                  <img
                    src={company.signature || '/images/signature1.png'}
                    alt="Organisation Signature"
                    className="h-20 w-auto max-w-full object-contain mx-auto transform scale-[2.5] translate-y-10 origin-bottom"
                    style={{ filter: 'contrast(240%) brightness(85%)', mixBlendMode: 'multiply' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider border-t-2 pt-1.5 w-52 text-center relative z-10" style={{ borderColor: '#000000', color: '#000000' }}>
                  Organisation Signature
                </div>
              </div>
            </div>
          </div>

          {/* UNIFORM FOOTER SECTION */}
          <div className="text-center text-[10px] font-bold pt-2 border-t" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            Page {declarationPageNum} of {totalPages}
          </div>
        </div>

        {/* VISUAL DIVIDER BEFORE TERMS & CONDITIONS PAGE */}
        <div className="text-xs font-bold uppercase tracking-widest my-1 text-center" style={{ color: '#4b5563' }}>
          — Page {totalPages}: Terms &amp; Conditions —
        </div>

        {/* PAGE (M+2): TERMS & CONDITIONS (FIXED 1 SINGLE PAGE - SINGLE COLUMN STACKED) */}
        <div
          id={`pdf-page-${totalPages}`}
          className="bg-white text-gray-900 shadow-xl border border-gray-300 w-[210mm] min-w-[210mm] min-h-[297mm] h-[297mm] p-5 sm:p-5.5 font-sans text-xs flex flex-col justify-between overflow-hidden shrink-0"
          style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className="pdf-prose-content prose max-w-none text-[10px] sm:text-[10.5px] leading-[1.28] font-bold [&>p]:mb-[2.5px] [&>p:first-child]:mb-3 [&>strong]:text-black [&>strong]:font-extrabold [&>p]:text-black [&>p]:font-bold"
              style={{ color: '#000000', fontWeight: 700 }}
              dangerouslySetInnerHTML={{ __html: formData.termsAndConditions || '' }}
            />
          </div>

          {/* UNIFORM FOOTER SECTION */}
          <div className="text-center text-[10px] font-bold pt-1.5 border-t" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            Page {totalPages} of {totalPages}
          </div>
        </div>

      </div>
    </div>
  );
}
