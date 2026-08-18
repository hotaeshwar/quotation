import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function convertSingleColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  const trimmed = colorStr.trim();
  const lower = trimmed.toLowerCase();

  // Check for white/light lightness hints in oklch/lab
  if (
    lower.includes('1 0 0') ||
    lower.includes('100%') ||
    lower.includes('0.99') ||
    lower.includes('0.98') ||
    lower.includes('0.95') ||
    lower.includes('0.9')
  ) {
    return '#ffffff';
  }

  // Try 2D Canvas conversion
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillStyle = trimmed;
      const res = ctx.fillStyle;
      if (res && !res.includes('lab') && !res.includes('oklch')) {
        return res;
      }
    }
  } catch (e) {}

  // Fallback to computed style conversion via offscreen div
  try {
    const div = document.createElement('div');
    div.style.color = trimmed;
    document.body.appendChild(div);
    const comp = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    if (comp && !comp.includes('lab') && !comp.includes('oklch')) {
      return comp;
    }
  } catch (e) {}

  if (lower.includes('0.1') || lower.includes('0.2') || lower.includes('10%') || lower.includes('20%')) {
    return '#111827';
  }
  return '#374151';
}

function replaceAllModernColors(cssText) {
  if (!cssText || typeof cssText !== 'string') return cssText;
  if (!cssText.includes('lab(') && !cssText.includes('oklch(') && !cssText.includes('color(') && !cssText.includes('color-mix(')) {
    return cssText;
  }

  const colorFuncNames = ['lab', 'oklch', 'color-mix', 'color'];
  let result = cssText;

  for (const name of colorFuncNames) {
    let searchIdx = 0;
    while (true) {
      const startIdx = result.toLowerCase().indexOf(name + '(', searchIdx);
      if (startIdx === -1) break;

      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx + name.length; i < result.length; i++) {
        if (result[i] === '(') depth++;
        else if (result[i] === ')') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }

      if (endIdx !== -1) {
        const fullColorFunc = result.substring(startIdx, endIdx + 1);
        const converted = convertSingleColor(fullColorFunc);
        result = result.substring(0, startIdx) + converted + result.substring(endIdx + 1);
        searchIdx = startIdx + converted.length;
      } else {
        result = result.substring(0, startIdx) + '#111827' + result.substring(startIdx + name.length + 1);
        searchIdx = startIdx + 7;
      }
    }
  }

  // Preserve white/light colors first before dark fallback
  result = result.replace(/oklch\(\s*1\s+[^)]*\)/gi, '#ffffff');
  result = result.replace(/oklch\(\s*0\.9[^)]*\)/gi, '#ffffff');
  result = result.replace(/lab\(\s*100%[^)]*\)/gi, '#ffffff');
  result = result.replace(/lab\(\s*9[^)]*\)/gi, '#ffffff');

  // Final sanity check to guarantee no lab/oklch remains
  result = result.replace(/lab\([^)]*\)/gi, '#111827');
  result = result.replace(/oklch\([^)]*\)/gi, '#111827');
  result = result.replace(/color-mix\([^)]*\)/gi, '#111827');
  result = result.replace(/color\([^)]*\)/gi, '#111827');

  return result;
}

function getCleanCssText() {
  let cssText = '';
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          Array.from(rules).forEach(rule => {
            cssText += rule.cssText + '\n';
          });
        }
      } catch (e) {
        // Ignore cross-origin sheet errors
      }
    });
  } catch (e) {}

  if (!cssText) {
    Array.from(document.querySelectorAll('style')).forEach(s => {
      cssText += (s.textContent || '') + '\n';
    });
  }

  return replaceAllModernColors(cssText);
}

export async function generateQuotationPDF(formData, companySettings) {
  const container = document.getElementById('quotation-pdf-preview');
  const pageNodes = container ? Array.from(container.querySelectorAll('div[id^="pdf-page-"]')) : [];

  if (pageNodes.length === 0) {
    alert('Preview elements not found for PDF generation');
    return;
  }

  // Create isolated offscreen iframe to strip modern lab/oklch colors from CSS declarations
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0px';
  iframe.style.width = '210mm';
  iframe.style.height = 'auto';
  iframe.style.border = 'none';
  iframe.style.visibility = 'visible';
  iframe.style.opacity = '1';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head></head><body></body></html>`);
    iframeDoc.close();

    // Insert sanitized CSS rules into iframe
    const styleEl = iframeDoc.createElement('style');
    styleEl.textContent = getCleanCssText() + `
      ul { list-style-type: disc !important; list-style-position: outside !important; padding-left: 1.25rem !important; margin: 0.25rem 0 !important; }
      ol { list-style-type: decimal !important; list-style-position: outside !important; padding-left: 1.25rem !important; margin: 0.25rem 0 !important; }
      li { display: list-item !important; margin: 0.1rem 0 !important; }
      ul li { list-style-type: disc !important; }
      ol li { list-style-type: decimal !important; }
      [style*="text-align: center"], [style*="text-align:center"] { text-align: center !important; }
      [style*="text-align: right"], [style*="text-align:right"] { text-align: right !important; }
      [style*="text-align: justify"], [style*="text-align:justify"] { text-align: justify !important; }
      [style*="text-align: left"], [style*="text-align:left"] { text-align: left !important; }
    `;
    iframeDoc.head.appendChild(styleEl);

    // Clone all pages into iframe
    const clones = pageNodes.map(pageNode => {
      const clone = pageNode.cloneNode(true);
      clone.style.boxShadow = 'none';
      clone.classList.remove('shadow-xl', 'shadow-2xl', 'shadow');
      clone.style.height = 'auto';
      clone.style.minHeight = '297mm';
      clone.style.overflow = 'visible';
      iframeDoc.body.appendChild(clone);
      return clone;
    });

    // Sanitize inline styles on cloned nodes
    const allNodes = iframeDoc.querySelectorAll('*');
    allNodes.forEach(node => {
      if (node.hasAttribute('style')) {
        const inlineStyle = node.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('lab(') || inlineStyle.includes('oklch(') || inlineStyle.includes('color('))) {
          node.setAttribute('style', replaceAllModernColors(inlineStyle));
        }
      }
    });

    // Wait for images inside iframe to load
    const images = Array.from(iframeDoc.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    await new Promise(r => setTimeout(r, 100));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

    // Export each page into PDF
    for (let i = 0; i < clones.length; i++) {
      const clone = clones[i];
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        window: iframe.contentWindow,
        document: iframeDoc,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    const fileName = `${formData.quotationNumber || 'Quotation'}_${formData.clientName || 'Client'}.pdf`
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}
