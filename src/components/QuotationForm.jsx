"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit3, Plus, Trash2, Calendar, X, Save, FolderOpen, Menu, FileText, MapPin, Phone } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Font, Svg, Path } from '@react-pdf/renderer';
import { Buffer } from 'buffer';

Font.registerHyphenationCallback(word => [word]);
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

const signatureImage = "/images/signature1.png";
const companyLogo = "/images/LOGO%20c.png";

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
  quotationName: '',
  clientName: '', address: '', contactPerson: '', phone: '',
  amount: '', amountCustomText: '', verticalAlignment: 'top', baseCurrency: 'INR', displayCurrency: 'INR',
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
    padding: 11,
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
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'solid',
    width: '100%',
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeaderColLeft: {
    width: '20%',
    borderRightWidth: 2,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderColRight: {
    width: '80%',
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderCellText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tableBodyColLeft: {
    width: '20%',
    borderRightWidth: 2,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    padding: 4,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tableBodyColRight: {
    width: '80%',
    padding: 4,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  tableCell: {
    marginTop: 2,
    marginBottom: 2,
    fontSize: 11,
    padding: 4,
    textAlign: 'left',
    lineHeight: 1.3,
    fontFamily: 'Helvetica',
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
    marginTop: 15,
    minHeight: 40,
  },
  signatureBox: {
    width: '48%',
  },
  signatureImage: {
    width: 120,
    height: 55,
  },
  signatureLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  declarationText: {
    fontSize: 9.5,
    marginBottom: 4,
    lineHeight: 1.25,
    fontFamily: 'Helvetica-Bold',
  },
  declarationItem: {
    fontSize: 9.0,
    marginBottom: 2,
    lineHeight: 1.25,
    paddingLeft: 8,
    fontFamily: 'Helvetica-Bold',
  },
  termsText: {
    fontSize: 8.5,
    marginBottom: 2.5,
    lineHeight: 1.15,
  },
  termsBoldText: {
    fontSize: 9.0,
    marginBottom: 2,
    lineHeight: 1.15,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  paymentItem: {
    width: '50%',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  addressSection: {
    flex: 1,
  },
  logoSection: {
    width: 200,
    height: 70,
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
  return text.trim();
};

const numberToWords = (num) => {
  if (!num) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (num) => {
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str;
  }

  let cleanNum = String(num).replace(/,/g, '');
  let parts = cleanNum.split('.');
  let wholePart = parseInt(parts[0], 10);
  if (isNaN(wholePart) || wholePart === 0) return 'Zero Only';
  let result = (inWords(wholePart) || '').trim();
  if (result && !result.endsWith('Only')) {
    result += ' Only';
  }
  return result;
};

const formatAmountWithCommas = (amount) => {
  if (!amount) return '';
  const clean = String(amount).replace(/,/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return amount;
  return clean.includes('.')
    ? num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const HtmlToPdf = ({ html, customStyle, verticalAlignment = 'top', isCompact = false, isExtraCompact = false }) => {
  const htmlString = typeof html === 'string' ? html : (html ? String(html) : '');
  if (!htmlString.trim()) return <Text style={customStyle}>{""}</Text>;
  if (typeof window === 'undefined') return <Text style={customStyle}>{""}</Text>;

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Process inline nodes (returns text string or <Text> node with inline formatting)
  const processInlineNode = (node, keyPrefix, inheritedStyle = {}) => {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
      if (!text) return '';
      if (Object.keys(inheritedStyle).length > 0) {
        return <Text key={keyPrefix} style={inheritedStyle}>{text}</Text>;
      }
      return text;
    }
    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') return '\n';
      let style = { ...inheritedStyle };

      const styleAttr = node.getAttribute && node.getAttribute('style');
      if (styleAttr) {
        styleAttr.split(';').forEach(item => {
          const parts = item.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts[1].trim();
            if (key === 'color') style.color = val;
            else if (key === 'font-weight' && (val === 'bold' || parseInt(val) >= 700)) style.fontFamily = 'Helvetica-Bold';
            else if (key === 'font-style' && val === 'italic') style.fontFamily = style.fontFamily === 'Helvetica-Bold' ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique';
            else if (key === 'text-decoration' && val.includes('underline')) style.textDecoration = 'underline';
          }
        });
      }

      if (tag === 'strong' || tag === 'b') style.fontFamily = 'Helvetica-Bold';
      if (tag === 'em' || tag === 'i') style.fontFamily = style.fontFamily === 'Helvetica-Bold' ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique';
      if (tag === 'u') style.textDecoration = 'underline';

      const children = Array.from(node.childNodes)
        .map((child, idx) => processInlineNode(child, `${keyPrefix}-${idx}`, style))
        .filter(Boolean);

      return children;
    }
    return '';
  };

  const blockMargin = isExtraCompact ? 1.0 : (isCompact ? 1.5 : 3.0);
  const listMargin = isExtraCompact ? 1.5 : (isCompact ? 2.5 : 4.0);
  const listItemMargin = isExtraCompact ? 0.5 : (isCompact ? 1.0 : 2.0);
  const fallbackMargin = isExtraCompact ? 0.5 : (isCompact ? 1.0 : 2.0);

  // Process block node (returns <View> containing <Text>)
  const renderBlockNode = (node, keyIndex) => {
    if (node.nodeType === 3) {
      const text = node.textContent.trim();
      if (!text) return null;
      return (
        <View key={`blk-${keyIndex}`} style={{ marginBottom: fallbackMargin, width: '100%' }}>
          <Text style={{ ...customStyle, textAlign: customStyle?.textAlign || 'left' }}>{text}</Text>
        </View>
      );
    }

    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') {
        return <View key={`blk-${keyIndex}`} style={{ height: isExtraCompact ? 3 : 6 }} />;
      }
      let blockStyle = { ...customStyle };
      let textAlign = customStyle?.textAlign || 'left';

      const styleAttr = node.getAttribute && node.getAttribute('style');
      if (styleAttr) {
        styleAttr.split(';').forEach(item => {
          const parts = item.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts[1].trim();
            if (key === 'text-align') textAlign = val;
            else if (key === 'color') blockStyle.color = val;
            else if (key === 'font-weight' && (val === 'bold' || parseInt(val) >= 700)) blockStyle.fontFamily = 'Helvetica-Bold';
          }
        });
      }
      if (node.getAttribute && node.getAttribute('align')) {
        textAlign = node.getAttribute('align');
      }

      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tag)) {
        const inlineContent = Array.from(node.childNodes)
          .map((child, idx) => processInlineNode(child, `inl-${keyIndex}-${idx}`, {}))
          .filter(Boolean);

        if (inlineContent.length === 0) {
          return <View key={`blk-${keyIndex}`} style={{ height: isExtraCompact ? 2 : 4 }} />;
        }
        return (
          <View key={`blk-${keyIndex}`} style={{ marginBottom: blockMargin, width: '100%' }}>
            <Text style={{ ...blockStyle, width: '100%', textAlign }}>{inlineContent}</Text>
          </View>
        );
      }

      if (tag === 'ul' || tag === 'ol') {
        const listItems = Array.from(node.childNodes).filter(child => child.nodeType === 1 && child.tagName.toLowerCase() === 'li');
        if (listItems.length === 0) return null;
        return (
          <View key={`blk-${keyIndex}`} style={{ marginBottom: listMargin, paddingLeft: isExtraCompact ? 6 : 10, width: '100%' }}>
            {listItems.map((liNode, liIdx) => {
              const inlineContent = Array.from(liNode.childNodes)
                .map((child, idx) => processInlineNode(child, `li-${keyIndex}-${liIdx}-${idx}`, {}))
                .filter(Boolean);
              return (
                <View key={`li-row-${keyIndex}-${liIdx}`} style={{ flexDirection: 'row', marginBottom: listItemMargin, width: '100%', alignItems: 'flex-start' }}>
                  <Text style={{ ...blockStyle, width: 'auto', marginRight: isExtraCompact ? 4 : 6 }}>{tag === 'ol' ? `${liIdx + 1}.` : '•'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...blockStyle, textAlign }}>{inlineContent}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      const inlineContent = Array.from(node.childNodes)
        .map((child, idx) => processInlineNode(child, `fallback-${keyIndex}-${idx}`, {}))
        .filter(Boolean);

      if (inlineContent.length === 0) return null;
      return (
        <View key={`blk-${keyIndex}`} style={{ marginBottom: fallbackMargin, width: '100%' }}>
          <Text style={{ ...blockStyle, width: '100%', textAlign }}>{inlineContent}</Text>
        </View>
      );
    }

    return null;
  };

  const blockNodes = Array.from(doc.body.childNodes)
    .map((node, i) => renderBlockNode(node, i))
    .filter(Boolean);

  if (blockNodes.length === 0) {
    return <Text style={customStyle}>{""}</Text>;
  }

  return (
    <View style={{ padding: 2, width: '100%' }}>
      {blockNodes}
    </View>
  );
};

// PDF Document Component
const QuotationPDF = ({ formData, quotationInfo, subscriptionItems }) => {
  const getVisibleTextLength = (html) => {
    if (!html) return 0;
    const clean = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
    return clean.length;
  };

  const totalTextLength = subscriptionItems.reduce((acc, item) => {
    return acc + getVisibleTextLength(item.serialNumber) + getVisibleTextLength(item.subscription);
  }, 0);

  // Dynamic layout compaction settings
  const isCompact = totalTextLength > 600 || subscriptionItems.length > 1;
  const isExtraCompact = totalTextLength > 1200 || subscriptionItems.length > 3;

  const logoWidth = isExtraCompact ? 180 : (isCompact ? 210 : 250);
  const logoHeight = isExtraCompact ? 50 : (isCompact ? 60 : 72);
  const headerBottomMargin = isExtraCompact ? 3 : (isCompact ? 5 : 8);
  const headerRowMargin = isExtraCompact ? 1 : (isCompact ? 2 : 4);
  const clientInfoMarginBottom = isExtraCompact ? 1 : (isCompact ? 2 : 4);
  const clientInfoRowMarginBottom = isExtraCompact ? 1 : (isCompact ? 1.5 : 2);
  const tableMarginBottom = isExtraCompact ? 2 : (isCompact ? 4 : 8);
  const tableHeaderMinHeight = isExtraCompact ? 16 : (isCompact ? 20 : 24);
  const tableCellPadding = isExtraCompact ? 2.5 : (isCompact ? 3.5 : 4);
  const tableFontSize = isExtraCompact ? 8.0 : (isCompact ? 9.0 : 10.0);
  const amountFontSize = isExtraCompact ? 10.5 : (isCompact ? 12 : 14);
  const noteFontSize = isExtraCompact ? 9.5 : (isCompact ? 11 : 13);
  const wordAmountFontSize = isExtraCompact ? 8.5 : (isCompact ? 9.5 : 11);
  const amountSectionPadding = isExtraCompact ? 2 : (isCompact ? 3 : 4);
  const spacingMargin = isExtraCompact ? 2.5 : (isCompact ? 5 : 10);
  const sectionHeaderFont = isExtraCompact ? 10.0 : (isCompact ? 11.5 : 13);
  const sectionHeaderMarginBottom = isExtraCompact ? 2 : (isCompact ? 3.5 : 5);
  const paymentLabelFont = isExtraCompact ? 8.5 : (isCompact ? 9.5 : 10.5);
  const paymentValFont = isExtraCompact ? 8.5 : (isCompact ? 9.5 : 10.5);
  const paymentMarginBottom = isExtraCompact ? 1.5 : (isCompact ? 3 : 5);
  const declarationTextFont = isExtraCompact ? 8.0 : (isCompact ? 9.0 : 10.0);
  const declarationItemFont = isExtraCompact ? 7.5 : (isCompact ? 8.5 : 9.5);
  const declarationItemLineHeight = isExtraCompact ? 1.18 : (isCompact ? 1.25 : 1.32);
  const signatureSectionMarginTop = isExtraCompact ? 10 : (isCompact ? 15 : 20);
  const signatureImageWidth = isExtraCompact ? 95 : (isCompact ? 115 : 135);
  const signatureImageHeight = isExtraCompact ? 42 : (isCompact ? 52 : 60);
  const signatureLabelFont = isExtraCompact ? 9.5 : (isCompact ? 10.5 : 11.5);

  const cellStyle = {
    ...styles.tableCell,
    fontSize: tableFontSize,
    lineHeight: 1.15,
    padding: tableCellPadding
  };

  const vAlignMap = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end'
  };
  const vAlignStyle = vAlignMap[formData?.verticalAlignment || 'top'] || 'flex-start';

  const renderPageHeader = () => (
    <View style={{ marginBottom: headerBottomMargin }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: headerRowMargin, marginTop: 0 }}>
        {/* Address & Phone Left Section */}
        <View style={{ width: 270 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}>
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5z" fill="#000000" />
            </Svg>
            <View>
              <Text style={{ fontSize: 10.0, fontFamily: 'Helvetica-Bold', lineHeight: 1.2 }}>#246, Devaji vip Plaza, VIP Road</Text>
              <Text style={{ fontSize: 10.0, fontFamily: 'Helvetica-Bold', lineHeight: 1.2 }}>Zirakpur, Punjab Pin : 140603</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#000000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: isExtraCompact ? 16 : 18, width: 260 }}>
            <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10, marginRight: 4 }}>
              <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#ffffff" />
            </Svg>
            <Text style={{ color: '#ffffff', fontSize: isExtraCompact ? 8.5 : 9.5, fontFamily: 'Helvetica-Bold' }}>90414-99964/73</Text>
          </View>
        </View>

        {/* Logo Right Section (Bigger & Aligned in one row with address) */}
        <View style={{ width: logoWidth, height: logoHeight }}>
          <Image src={companyLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </View>
      </View>

      {/* No. & Dated Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: headerRowMargin, marginBottom: headerRowMargin }}>
        <Text style={{ fontSize: isExtraCompact ? 9.5 : (isCompact ? 10.0 : 10.5), fontFamily: 'Helvetica-Bold' }}>
          No. {quotationInfo.number}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: isExtraCompact ? 9.5 : (isCompact ? 10.0 : 10.5), fontFamily: 'Helvetica-Bold', marginRight: 10 }}>Dated</Text>
          <View style={{ borderBottomWidth: 1, borderColor: '#000000', width: isExtraCompact ? 100 : 130, alignItems: 'center' }}>
            <Text style={{ fontSize: isExtraCompact ? 9.5 : (isCompact ? 10.0 : 10.5), fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>{quotationInfo.date}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          {renderPageHeader()}
        </View>

        <View style={{ marginBottom: clientInfoMarginBottom }}>
          {/* Business Name Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: clientInfoRowMarginBottom }}>
            <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold', width: 90 }}>Business Name</Text>
            <View style={{ borderBottomWidth: 1, borderColor: '#000000', flex: 1, paddingBottom: clientInfoRowMarginBottom }}>
              <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold' }} maxLines={1}>
                {(formData.clientName || '').replace(/[\r\n]+/g, ' ').trim()}
              </Text>
            </View>
          </View>

          {/* Address Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: clientInfoRowMarginBottom }}>
            <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold', width: 90 }}>Address</Text>
            <View style={{ borderBottomWidth: 1, borderColor: '#000000', flex: 1, paddingBottom: clientInfoRowMarginBottom }}>
              <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold' }} maxLines={1}>
                {(formData.address || '').replace(/[\r\n]+/g, ', ').trim()}
              </Text>
            </View>
          </View>

          {/* Contact & Phone Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '48%' }}>
              <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold', width: 90 }}>Contact Person</Text>
              <View style={{ borderBottomWidth: 1, borderColor: '#000000', flex: 1, paddingBottom: clientInfoRowMarginBottom }}>
                <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold' }} maxLines={1}>
                  {(formData.contactPerson || '').replace(/[\r\n]+/g, ' ').trim()}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '48%' }}>
              <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold', width: 90 }}>Phone/Mobile</Text>
              <View style={{ borderBottomWidth: 1, borderColor: '#000000', flex: 1, paddingBottom: clientInfoRowMarginBottom }}>
                <Text style={{ fontSize: isExtraCompact ? 9 : 10, fontFamily: 'Helvetica-Bold' }} maxLines={1}>
                  {(formData.phone || '').replace(/[\r\n]+/g, ' ').trim()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subscription Tables (Independent blocks that carry their headers on page break) */}
        {subscriptionItems.map((item, index) => (
          <View
            key={`table-block-${index}`}
            style={[styles.table, { marginBottom: tableMarginBottom }]}
            wrap={false}
          >
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { minHeight: tableHeaderMinHeight }]}>
              <View style={styles.tableHeaderColLeft}>
                <Text style={[styles.tableHeaderCellText, { fontSize: tableFontSize }]}>SUBSCRIPTION</Text>
              </View>
              <View style={styles.tableHeaderColRight}>
                <Text style={[styles.tableHeaderCellText, { fontSize: tableFontSize }]}>DESCRIPTION</Text>
              </View>
            </View>

            {/* Table Content Row */}
            <View style={styles.tableBodyRow}>
              <View style={[styles.tableBodyColLeft, { justifyContent: vAlignStyle, padding: tableCellPadding }]}>
                <HtmlToPdf
                  html={item.serialNumber}
                  customStyle={{ ...cellStyle, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}
                  verticalAlignment={formData.verticalAlignment}
                  isCompact={isCompact}
                  isExtraCompact={isExtraCompact}
                />
              </View>
              <View style={[styles.tableBodyColRight, { justifyContent: vAlignStyle, padding: tableCellPadding }]}>
                <HtmlToPdf
                  html={item.subscription}
                  customStyle={{ ...cellStyle, fontFamily: 'Helvetica' }}
                  verticalAlignment={formData.verticalAlignment}
                  isCompact={isCompact}
                  isExtraCompact={isExtraCompact}
                />
              </View>
            </View>
          </View>
        ))}

        <View style={{ marginTop: isExtraCompact ? 2 : 6 }}>
          {/* Group 1: Amount Section & Cheques Note */}
          <View wrap={false}>
            <View style={[styles.amountSection, { padding: amountSectionPadding, marginTop: isExtraCompact ? 0 : 2, marginBottom: isExtraCompact ? 0 : 2 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text style={[styles.amountText, { fontSize: amountFontSize }]}>AMOUNT</Text>
                <Text style={[styles.amountText, { fontSize: amountFontSize }]}>
                  {formData.displayCurrency} ({CURRENCY_SYMBOLS_PDF[formData.displayCurrency]})
                </Text>
                {formData.amount ? (
                  <Text style={[styles.amountText, { fontSize: amountFontSize, color: '#FF8C00', fontFamily: 'Helvetica-Bold' }]}>
                    {formatAmountWithCommas(formData.amount)}
                  </Text>
                ) : <Text style={styles.amountText}>{""}</Text>}
                {formData.amountCustomText ? (
                  <Text style={[styles.amountText, { fontSize: noteFontSize, color: '#2563EB', fontFamily: 'Helvetica-Bold' }]}>
                    - {formData.amountCustomText}
                  </Text>
                ) : <Text style={styles.amountText}>{""}</Text>}
              </View>
              {formData.amount ? (
                <Text style={[styles.text, { textAlign: 'center', marginTop: isExtraCompact ? 1 : 4, fontFamily: 'Helvetica-Bold', fontSize: wordAmountFontSize }]}>
                  Amount in words: {numberToWords(formData.amount)}
                </Text>
              ) : <Text style={styles.text}>{""}</Text>}
              <Text style={[styles.text, { textAlign: 'center', marginTop: isExtraCompact ? 1 : 4, fontFamily: 'Helvetica-Bold', marginBottom: isExtraCompact ? 1 : 2, fontSize: wordAmountFontSize }]}>
                (GST EXTRA)
              </Text>
            </View>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: wordAmountFontSize, textAlign: 'center', marginTop: isExtraCompact ? 2 : 5, color: '#FF0000', marginBottom: isExtraCompact ? 2 : 5 }}>
              * Cheques should be drawn in favour of Devine sTudio
            </Text>
          </View>

          {/* Group 2: Payment Details */}
          <View style={{ marginBottom: spacingMargin, marginTop: spacingMargin }} wrap={false}>
            <Text style={[styles.sectionHeader, { fontSize: sectionHeaderFont, marginTop: 0, marginBottom: sectionHeaderMarginBottom }]}>PAYMENT DETAILS</Text>
            <View style={styles.paymentGrid}>
              <View style={[styles.paymentItem, { marginBottom: paymentMarginBottom }]}>
                <Text style={[styles.paymentLabel, { fontSize: paymentLabelFont }]}>Bank Name</Text>
                <Text style={[styles.paymentValue, { fontSize: paymentValFont }]}>{formData.bankName}</Text>
              </View>
              <View style={[styles.paymentItem, { marginBottom: paymentMarginBottom }]}>
                <Text style={[styles.paymentLabel, { fontSize: paymentLabelFont }]}>Account Number</Text>
                <Text style={[styles.paymentValue, { fontSize: paymentValFont }]}>{formData.accountNumber}</Text>
              </View>
              <View style={[styles.paymentItem, { marginBottom: paymentMarginBottom }]}>
                <Text style={[styles.paymentLabel, { fontSize: paymentLabelFont }]}>Account Name</Text>
                <Text style={[styles.paymentValue, { fontSize: paymentValFont }]}>{formData.accountName}</Text>
              </View>
              <View style={[styles.paymentItem, { marginBottom: paymentMarginBottom }]}>
                <Text style={[styles.paymentLabel, { fontSize: paymentLabelFont }]}>IFSC Code</Text>
                <Text style={[styles.paymentValue, { fontSize: paymentValFont }]}>{formData.ifscCode}</Text>
              </View>
            </View>
          </View>

          {/* Group 3: Declaration & Signatures Grouped Together */}
          <View wrap={false} style={{ marginTop: spacingMargin }}>
            <View style={{ marginBottom: spacingMargin }}>
              <Text style={[styles.sectionHeader, { fontSize: sectionHeaderFont, marginTop: 0, marginBottom: sectionHeaderMarginBottom }]}>DECLARATION</Text>
              <Text style={[styles.declarationText, { fontSize: declarationTextFont, marginBottom: isExtraCompact ? 2 : 4 }]}>
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
                <Text key={index} style={[styles.declarationItem, { fontSize: declarationItemFont, lineHeight: declarationItemLineHeight, marginBottom: isExtraCompact ? 0.8 : 2.0 }]}>• {item}</Text>
              ))}
            </View>

            <View style={[styles.signatureSection, { marginTop: signatureSectionMarginTop, minHeight: isExtraCompact ? 35 : 45 }]}>
              <View style={styles.signatureBox}>
                <Text style={[styles.signatureLabel, { fontSize: signatureLabelFont }]}>CLIENT SIGNATURE</Text>
                <View style={{ height: 20, justifyContent: 'flex-end', alignItems: 'flex-start', marginTop: 0 }}>
                  <Text style={styles.text}></Text>
                </View>
              </View>
              <View style={styles.signatureBox}>
                <Text style={[styles.signatureLabel, { fontSize: signatureLabelFont }]}>ORGANISATION SIGNATURE</Text>
                <View style={{ marginTop: isExtraCompact ? 0 : 2, alignItems: 'flex-start' }}>
                  <Image src={signatureImage} style={[styles.signatureImage, { width: signatureImageWidth, height: signatureImageHeight }]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'flex-start', padding: 5 }}>
          <Text style={[styles.header, { textAlign: 'center', marginBottom: 15, fontSize: 15, fontFamily: 'Helvetica-Bold' }]}>TERMS & CONDITIONS OF SERVICES</Text>

          <View style={styles.termsSection}>
            <Text style={styles.termsBoldText}>1. GENERAL</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>1.1</Text> The terms & conditions contained herein shall constitute and form an entire Agreement (hereinafter referred to as Agreement between BUILDING INDIA DIGITAL and the Customer.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>1.2.</Text> Any clause of the Terms and conditions if deemed invalid, void or for any reason becomes unenforceable, shall be deemed severable and shall not affect the validity and enforce ability of the remaining clauses of the conditions of this agreement.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>2. SERVICES.EXCLUSIONS & PERFORMANCE</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>2.1</Text> In the event the advertisement requirements requested by the Customer fell within the restricted category of face book & you tube or are not supported by face book & you tube are one against the policy of face book & youtube.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>2.2</Text> BUILDING INDIA DIGITAL reserves the right to refuse or cancel any advertising requirement at its sole discretion, with or without cause, at any time, Balanced advertising budget will not be refunded to the Customer.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>3. CONSIDERATION</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>3.1</Text> The considerations means the cost of the package, purchased by the Customer from BUILDING INDIA DIGITAL.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>3.2</Text> BUILDING INDIA DIGITAL reserves the right to charge for any additional work executed by BUILDING INDIA DIGITAL:</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>3.3</Text> In the vent the Customer agree to pay the consideration for the services via ECS mode, than the same cannot be cancelled by the Customer amidst the terms of the agreement, unless the Agreement is earlier terminated by BUILDING INDIA DIGITAL at its sole discretion or by mutual consent of BUILDING INDIA DIGITAL and the customer.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>4. INDEMNITY</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>4.1</Text> Customer shall indemnify and hold BUILDING INDIA DIGITAL harmless from all claims, costs, proceedings, damages and expenses (including legal professional fees and expenses), awarded against or paid by BUILDING INDIA DIGITAL as a result of or in connection with any alleged or actual infringement of any third party's. intellectual property right (including copyright) or other rights arisging out of the use or supply of the information by soon behalf of the Customer to BUILDING INDIA DIGITAL.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>5. TERMINATION</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>5.1</Text> If the contract is terminated by the customer before services under this Agreement are to begin executions or are in the process of completion that in such an event, under no circumstances, of the consideration paid or agreed to be the Customer, shall not be refundable and the same shall not be forfeited in full.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>6. MISCELLANEOUS</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>6.1</Text> BUILDING INDIA DIGITAL SHALL be permitted to identify customer, as BUILDING INDIA DIGITAL client and may use customer's name in connection with BUILDING INDIA DIGITAL marketing invitative.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>6.2</Text> Customer agrees and permits BUILDING INDIA DIGITAL to make calls and messages on his mobile and office contact numbers subsequent to the signing of this agreement.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>7. DISCLAIMER</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>7.1</Text> BUILDING INDIA DIGITAL makes no representation, warranties or guarantees of any kind as to the level of sales, purchase, click, sales leads or other performance that customer can expect from advertising campaign through BUILDING INDIA DIGITAL any bstimated provided by BUILDING INDIA DIGITAL to the customer are not intended to create any binding obligation or to be relied upon by the customer and the same are mere estimates.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>7.2</Text> BUILDING INDIA DIGITAL will not be liable for any loss of profit, loss of contract, loss of use, or nay idrect and/or indirect and/or any consequential loss damage and expenses sustained incurred by the customer as a result of any acts or omission or information or advise given in any form by or on behalf of BUILDING INDIA DIGITAL to the customer and the customer is advised to make its own inquiries and use its own judgement and/or intellect before taking any decision regarding the same.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>7.3</Text> In addition to the above it is further agreed that the customer shall be solely liable for any loss or damage, whther monetary or other suffered by it as a result of any change effected by it on its own in the website by using CMS and BUILDING INDIA DIGITAL shall not be held liable any account whatsoever,</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>7.4</Text> Customer would be provided access to reporting interface by BUILDING INDIA DIGITAL showcasing all the critical performance parametershowever BUILDING INDIA DIGITAL accept no liability based on performance.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>8. FORCE MAJEURE</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>8.1</Text> Neither party will be liable to the other, for any delay or failure to fulfill obligations set for till in this agreement caused by force major reasons or crcumstances beyond their control.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>9. COMMUNICATION</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>9.1</Text> Any notice send by the customer with respect to this agreement has be in writing and has to be sent registered post at the following address. F-140, 4th Floor, Phase-8B, Mohali, Punjab.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>9.2</Text> In case of any query the Customer can contact the Manager of BUILDING INDIA DIGITAL between 10Am to 6 PM between Monday to Friday on the phone number given on the face of the present invoice.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>10. GOVERNING LAW AND JURISDICTION</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>10.1</Text> The agreement, its validity, construction, interpretation, effect, performance and termination shall be governed by the laws (both substantive and procedural) as applicable in India From time to time.</Text>
            <Text style={styles.termsText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>10.2</Text> Any dispute or diffrence arising out of or in connection with this agreement including its interpretation there of between BUILDING INDIA DIGITAL customer shall be subject to the exclusive jurisdiction to the courts of Mohali (Punjab) only.</Text>

            <Text style={[styles.termsBoldText, { marginTop: 6 }]}>11. ABOVE PACKAGE IS FOR 1 ID ONLY</Text>
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
            plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
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

// FormField Component
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
  const [activeTab, setActiveTab] = useState('editor');
  const [openFolders, setOpenFolders] = useState({});
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const groupedQuotations = React.useMemo(() => {
    const groupsMap = {};
    const sorted = [...savedQuotations].sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));

    sorted.forEach(quot => {
      const date = new Date(quot.savedAt || Date.now());
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const groupKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;

      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = { label: monthYear, quotations: [] };
      }
      groupsMap[groupKey].quotations.push(quot);
    });

    return Object.keys(groupsMap).sort().reverse().map(key => groupsMap[key]);
  }, [savedQuotations]);

  const toggleFolder = (label) => {
    setOpenFolders(prev => ({ ...prev, [label]: !prev[label] }));
  };

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

  const generateQuotationInfo = (selectedDate = new Date(), customRefNum = null) => {
    const date = selectedDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let referenceNumber = customRefNum || quotationInfo.referenceNumber;
    if (!referenceNumber || referenceNumber === 0) {
      const randomPrefix = Math.floor(10 + Math.random() * 90);
      referenceNumber = randomPrefix * 100 + 1;
    }

    const baseNumber = `${year}/${month}/${day}/${referenceNumber}`;
    const revisionSuffix = formData.isRevised ? '/REV' : '';

    setQuotationInfo({
      number: `${baseNumber}${revisionSuffix}`,
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
      const filename = formData.quotationName
        ? `${formData.quotationName}.pdf`
        : `quotation-${quotationInfo.number.replace(/\//g, '-')}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error?.message || 'Unknown error'));
    }
  };

  useEffect(() => { generateQuotationInfo(); }, []);
  useEffect(() => { generateQuotationInfo(); }, [formData.isRevised, formData.revisionNumber]);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "quotations"));
        const quots = [];
        querySnapshot.forEach((doc) => {
          quots.push(doc.data());
        });
        setSavedQuotations(quots);
      } catch (error) {
        console.error("Error fetching quotations from Firestore:", error);
      }
    };
    fetchQuotations();
  }, []);

  const downloadSavedPDF = (pdfBase64, filename) => {
    try {
      const binaryString = window.atob(pdfBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading saved PDF:', error);
      alert('Error downloading saved PDF: ' + error.message);
    }
  };

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

  const saveQuotation = async () => {
    try {
      // Generate PDF blob
      const blob = await pdf(<QuotationPDF
        formData={formData}
        quotationInfo={quotationInfo}
        subscriptionItems={subscriptionItems}
      />).toBlob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const pdfBase64 = await base64Promise;

      const quotationData = {
        id: currentQuotationId || Date.now(),
        formData: { ...formData },
        subscriptionItems: [...subscriptionItems],
        quotationInfo: { ...quotationInfo },
        savedAt: new Date().toISOString(),
        baseQuotationNumber: quotationInfo.number.split('/REV')[0],
        pdfBase64: pdfBase64
      };

      // Save to Firebase Firestore Database
      const docRef = doc(db, "quotations", quotationData.id.toString());
      await setDoc(docRef, quotationData);

      setSavedQuotations(prev => currentQuotationId ? prev.map(q => q.id === currentQuotationId ? quotationData : q) : [...prev, quotationData]);
      setCurrentQuotationId(quotationData.id);
      alert('Quotation saved successfully to the database!');
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Error saving quotation: ' + error.message);
    }
  };

  const loadQuotation = (quotation) => {
    setFormData(quotation.formData);
    setSubscriptionItems(quotation.subscriptionItems);

    let updatedQuotationInfo = { ...INITIAL_QUOTATION_INFO, ...(quotation?.quotationInfo || {}) };
    const num = updatedQuotationInfo.number || '';
    
    // Check if it's in the old format (does not contain YYYY/MM/DD)
    // Old format example: "20260630/0"
    const oldFormatMatch = num.match(/^(\d{4})(\d{2})(\d{2})\/(\d+)(.*)$/);
    if (oldFormatMatch) {
      const [_, year, month, day, refNumStr, rest] = oldFormatMatch;
      let refNum = parseInt(refNumStr, 10);
      if (!refNum || refNum === 0) {
        const randomPrefix = Math.floor(10 + Math.random() * 90);
        refNum = randomPrefix * 100 + 1;
      }
      const isRevised = quotation.formData?.isRevised || num.includes('/REV') || num.includes('/Rev') || num.includes('/R');
      const suffix = isRevised ? '/REV' : '';
      updatedQuotationInfo = {
        ...updatedQuotationInfo,
        number: `${year}/${month}/${day}/${refNum}${suffix}`,
        referenceNumber: refNum
      };
      
      // Also update formData if we parsed a revision from the number
      if (isRevised && !quotation.formData?.isRevised) {
        setFormData(prev => ({ ...prev, isRevised: true }));
      }
    }

    setQuotationInfo(updatedQuotationInfo);
    setCurrentQuotationId(quotation.id);
    setShowSavedQuotations(false);
  };

  const handleRevisionFromFirebase = async (quotationId) => {
    try {
      const docRef = doc(db, "quotations", quotationId.toString());
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return alert('Quotation not found in database!');
      }
      const quotation = docSnap.data();

      // Identify the base quotation and calculate the next revision number
      const baseNumber = quotation.baseQuotationNumber;
      const relatedQuotations = savedQuotations.filter(q => q.baseQuotationNumber === baseNumber);
      const nextRevision = Math.max(0, ...relatedQuotations.map(q => q.formData?.revisionNumber || 0)) + 1;

      // Keep the first two digits of referenceNumber, and set the last two digits to (nextRevision + 1)
      const originalRef = quotation.quotationInfo?.referenceNumber || 1001;
      const basePrefix = Math.floor(originalRef / 100) || Math.floor(10 + Math.random() * 90);
      const newRefNum = basePrefix * 100 + (nextRevision + 1);

      // Generate new adapted number and date
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const newNumber = `${year}/${month}/${day}/${newRefNum}/REV`;

      setFormData({
        ...quotation.formData,
        isRevised: true,
        revisionNumber: nextRevision
      });
      setSubscriptionItems(quotation.subscriptionItems);
      setQuotationInfo({
        number: newNumber,
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        referenceNumber: newRefNum
      });
      
      setCurrentQuotationId(null); // Clear ID so it will save as a new document
      setActiveTab('editor'); // Switch to editor tab
      alert(`Quotation loaded from database and marked as Revision ${nextRevision} (ending in ${String(nextRevision + 1).padStart(2, '0')}).`);
    } catch (error) {
      console.error('Error fetching for revision:', error);
      alert('Error fetching quotation for revision: ' + error.message);
    }
  };

  const generateNewQuotation = () => {
    const randomPrefix = Math.floor(10 + Math.random() * 90);
    const newRandomNumber = randomPrefix * 100 + 1;
    setFormData(INITIAL_FORM_DATA);
    setSubscriptionItems([{ id: 1, serialNumber: '', subscription: '' }]);
    setCurrentQuotationId(null);
    setIsEditing(false);
    generateQuotationInfo(new Date(), newRandomNumber);
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

  const deleteQuotation = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const docRef = doc(db, "quotations", id.toString());
        await deleteDoc(docRef);
        setSavedQuotations(prev => prev.filter(q => q.id !== id));
        if (currentQuotationId === id) setCurrentQuotationId(null);
        alert('Quotation deleted successfully from the database!');
      } catch (error) {
        console.error('Error deleting from database:', error);
        alert('Error deleting quotation: ' + error.message);
      }
    }
  };

  const renderSubscriptionContent = (item, field) => {
    const content = item[field];
    if (!content && isEditing) return <div className="text-gray-500 italic min-h-8 p-1 cursor-pointer">Click to add {field === 'serialNumber' ? 'subscription' : 'description details'}...</div>;
    if (!content && !isEditing) return <div className="min-h-8 p-1">&nbsp;</div>;
    return <div
      dangerouslySetInnerHTML={{ __html: content }}
      className="min-h-8 p-1 leading-relaxed"
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    />;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FolderOpen size={14} />
                Saved Quotations ({savedQuotations.length})
              </button>
            </div>

            {/* Quotation Name Input in Middle to Identify */}
            {activeTab === 'editor' && (
              <div className="flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quotation Name:</span>
                <input
                  type="text"
                  value={formData.quotationName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quotationName: e.target.value }))}
                  placeholder="Enter identifier name..."
                  className="bg-transparent border-none text-sm font-semibold text-gray-800 focus:outline-none w-64"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FileText size={14} />
                Form Editor
              </button>
              {activeTab === 'editor' && (
                <>
                  <div className="relative">
                    {/* Trigger Button (Arrow) */}
                    <button
                      onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
                      className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform focus:outline-none cursor-pointer"
                    >
                      <span className={`text-base transition-transform duration-300 ${isSpeedDialOpen ? 'rotate-180' : 'rotate-0'}`}>
                        ▼
                      </span>
                    </button>

                    {/* Radial/Wheel Action Buttons */}
                    {isSpeedDialOpen && (
                      <div className="absolute right-0 top-12 bg-white/95 backdrop-blur-md shadow-2xl rounded-full border border-gray-200 p-8 z-50 flex items-center justify-center" style={{ width: '200px', height: '200px', marginRight: '-80px' }}>
                        {/* Central circle */}
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-inner">
                          <span className="text-lg">⚙️</span>
                        </div>

                        {/* New (Top-Left) */}
                        <button
                          onClick={() => { generateNewQuotation(); setIsSpeedDialOpen(false); }}
                          title="New"
                          className="absolute w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          style={{ top: '15px', left: '15px' }}
                        >
                          <Plus size={18} />
                        </button>

                        {/* Save (Top-Right) */}
                        <button
                          onClick={() => { saveQuotation(); setIsSpeedDialOpen(false); }}
                          title="Save"
                          className="absolute w-11 h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          style={{ top: '15px', right: '15px' }}
                        >
                          <Save size={18} />
                        </button>

                        {/* PDF (Bottom-Left) */}
                        <button
                          onClick={() => { downloadPDF(); setIsSpeedDialOpen(false); }}
                          title="PDF"
                          className="absolute w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          style={{ bottom: '15px', left: '15px' }}
                        >
                          <Download size={18} />
                        </button>

                        {/* Mark Revised (Bottom-Right) */}
                         <button
                           onClick={() => {
                             if (currentQuotationId) {
                               handleRevisionFromFirebase(currentQuotationId);
                             } else {
                               alert("Please save the quotation first!");
                             }
                             setIsSpeedDialOpen(false);
                           }}
                           title="Mark Revised"
                           className="absolute w-11 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                           style={{ bottom: '15px', right: '15px' }}
                         >
                           <Edit3 size={18} />
                         </button>
                      </div>
                    )}
                  </div>
                  <button onClick={toggleEditMode} className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs transition-colors cursor-pointer ${isEditing ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}><Edit3 size={14} /> {isEditing ? 'Editing ON' : 'Editing OFF'}</button>
                </>
              )}
            </div>
          </div>
        </div>
        {activeTab === 'editor' && (
          <div className="bg-gray-50 px-4 py-2 border-t flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Date:</span>
                <input
                  type="text"
                  value={quotationInfo.date || ''}
                  onChange={(e) => setQuotationInfo(prev => ({ ...prev, date: e.target.value }))}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  placeholder="DD-MMM-YYYY"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Amount:</span>
                <input type="text" value={formData.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter amount" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Amount Note / Details:</span>
                <input type="text" value={formData.amountCustomText || ''} onChange={(e) => handleFormChange('amountCustomText', e.target.value)} className="w-48 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 50% Advance / Note" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Currency:</span>
                <select value={formData.displayCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Text Vertical Alignment:</span>
                <select value={formData.verticalAlignment || 'top'} onChange={(e) => handleFormChange('verticalAlignment', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium">
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              {currentQuotationId && (
                <button onClick={() => handleRevisionFromFirebase(currentQuotationId)} className="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-955 border border-orange-300 px-3 py-1.5 rounded bg-orange-50 hover:bg-orange-100 cursor-pointer font-semibold"><Edit3 size={14} /> Mark as Revised</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'editor' ? (
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
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-black flex-shrink-0" />
                      <div className="text-sm font-bold leading-tight">
                        <div>#246, Devaji vip Plaza, VIP Road</div>
                        <div>Zirakpur, Punjab Pin : 140603</div>
                      </div>
                    </div>
                    <div className="bg-black text-white px-3 py-1 mt-2.5 flex items-center justify-center gap-2 w-72">
                      <Phone size={12} fill="white" className="text-white" />
                      <span className="text-xs font-bold tracking-wider">90414-99964/73</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="object-contain"
                      style={{ width: '300px', height: '95px' }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm font-bold">No. {quotationInfo.number}</div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>Dated</span>
                    <input
                      type="text"
                      value={quotationInfo.date || ''}
                      onChange={(e) => setQuotationInfo(prev => ({ ...prev, date: e.target.value }))}
                      className="border-b border-black text-center min-w-32 font-bold bg-transparent focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="DD-MMM-YYYY"
                    />
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <FormField
                    label="Business Name"
                    value={formData.clientName}
                    onChange={(value) => handleFormChange('clientName', value)}
                  />
                  <FormField
                    label="Contact Person"
                    value={formData.contactPerson}
                    onChange={(value) => handleFormChange('contactPerson', value)}
                  />
                  <FormField
                    label="Phone/Mobile"
                    value={formData.phone}
                    onChange={(value) => handleFormChange('phone', value)}
                  />
                </div>
                <div>
                  <FormField
                    label="Address"
                    value={formData.address}
                    onChange={(value) => handleFormChange('address', value.replace(/[\r\n]+/g, ' '))}
                    type="text"
                  />
                </div>
              </div>

              {/* Subscription Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold">SUBSCRIPTION & DESCRIPTION DETAILS</h3>
                  <button
                    onClick={addSubscriptionItem}
                    className="print:hidden px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <table className="w-full text-sm" style={{ border: '2px solid black', tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left w-1/5" style={{ border: '2px solid black' }}>SUBSCRIPTION</th>
                      <th className="p-2 text-left w-3/4" style={{ border: '2px solid black' }}>DESCRIPTION</th>
                      <th className="print:hidden p-2 text-left w-1/12" style={{ border: '2px solid black' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionItems.map((item) => {
                      const cssVAlign = formData.verticalAlignment === 'center' ? 'middle' : formData.verticalAlignment === 'bottom' ? 'bottom' : 'top';
                      return (
                        <tr key={item.id}>
                          <td
                            onClick={() => openTextEditor(item.id, 'serialNumber')}
                            className={`p-2 ${isEditing ? 'cursor-pointer border-dashed border-blue-400 bg-blue-50' : ''}`}
                            style={{ border: '2px solid black', width: '20%', verticalAlign: cssVAlign }}
                          >
                            {renderSubscriptionContent(item, 'serialNumber')}
                          </td>
                          <td
                            onClick={() => openTextEditor(item.id, 'subscription')}
                            className={`p-2 ${isEditing ? 'cursor-pointer border-dashed border-blue-400 bg-blue-50' : ''}`}
                            style={{ border: '2px solid black', width: '70%', verticalAlign: cssVAlign }}
                          >
                            {renderSubscriptionContent(item, 'subscription')}
                          </td>
                          <td className="print:hidden p-2 text-center" style={{ border: '2px solid black', width: '10%', verticalAlign: cssVAlign }}>
                            <button
                              onClick={() => removeSubscriptionItem(item.id)}
                              disabled={subscriptionItems.length === 1}
                              className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Section */}
              <div className="mt-8">
                {/* Amount */}
                <div className="mb-6 border-2 border-black p-4 bg-gray-50">
                  <div className="flex items-center justify-center gap-6 flex-wrap">
                    <h3 className="text-2xl font-bold">AMOUNT</h3>
                    <span className="text-2xl font-bold">{formData.displayCurrency} ({CURRENCY_SYMBOLS[formData.displayCurrency]})</span>
                    {formData.amount && <span className="text-2xl font-bold">{formatAmountWithCommas(formData.amount)}</span>}
                    {formData.amountCustomText && (
                      <span className="text-2xl font-bold text-blue-600">- {formData.amountCustomText}</span>
                    )}
                  </div>
                  {formData.amount && (
                    <div className="text-center text-sm font-semibold mt-2">
                      Amount in words: {numberToWords(formData.amount)}
                    </div>
                  )}
                  <div className="text-center text-sm font-semibold mt-1">(GST EXTRA)</div>
                </div>
                <div className="text-center text-sm font-bold text-red-600 mb-6">
                  * Cheques should be drawn in favour of Devine sTudio
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
                    <h3 className="font-bold text-base mb-1 text-gray-800">ORGANISATION SIGNATURE</h3>
                    <img
                      src={signatureImage}
                      alt="Organization Signature"
                      style={{
                        width: '155px',
                        height: 'auto',
                        maxHeight: '85px',
                        objectFit: 'contain',
                        display: 'block',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border-t pt-4" style={{ pageBreakBefore: 'always' }}>
                <h3 className="text-lg font-bold text-center mb-4">TERMS & CONDITIONS OF SERVICES</h3>
                <div className="space-y-3 text-sm leading-relaxed font-medium">
                  <div>
                    <h4 className="font-bold mb-1">1. GENERAL</h4>
                    <p className="mb-1">1.1 The terms & conditions contained herein shall constitute and form an entire Agreement (hereinafter referred to as Agreement between BUILDING INDIA DIGITAL and the Customer.</p>
                    <p className="mb-1">1.2. Any clause of the Terms and conditions if deemed invalid, void or for any reason becomes unenforceable, shall be deemed severable and shall not affect the validity and enforce ability of the remaining clauses of the conditions of this agreement.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">2. SERVICES.EXCLUSIONS & PERFORMANCE</h4>
                    <p className="mb-1">2.1 In the event the advertisement requirements requested by the Customer fell within the restricted category of face book & you tube or are not supported by face book & you tube are one against the policy of face book & youtube.</p>
                    <p className="mb-1">2.2 BUILDING INDIA DIGITAL reserves the right to refuse or cancel any advertising requirement at its sole discretion, with or without cause, at any time, Balanced advertising budget will not be refunded to the Customer.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">3. CONSIDERATION</h4>
                    <p className="mb-1">3.1 The considerations means the cost of the package, purchased by the Customer from BUILDING INDIA DIGITAL.</p>
                    <p className="mb-1">3.2 BUILDING INDIA DIGITAL reserves the right to charge for any additional work executed by BUILDING INDIA DIGITAL:</p>
                    <p className="mb-1">3.3 In the vent the Customer agree to pay the consideration for the services via ECS mode, than the same cannot be cancelled by the Customer amidst the terms of the agreement, unless the Agreement is earlier terminated by BUILDING INDIA DIGITAL at its sole discretion or by mutual consent of BUILDING INDIA DIGITAL and the customer.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">4. INDEMNITY</h4>
                    <p className="mb-1">4.1 Customer shall indemnify and hold BUILDING INDIA DIGITAL harmless from all claims, costs, proceedings, damages and expenses (including legal professional fees and expenses), awarded against or paid by BUILDING INDIA DIGITAL as a result of or in connection with any alleged or actual infringement of any third party's. intellectual property right (including copyright) or other rights arisging out of the use or supply of the information by soon behalf of the Customer to BUILDING INDIA DIGITAL.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">5. TERMINATION</h4>
                    <p className="mb-1">5.1 If the contract is terminated by the customer before services under this Agreement are to begin executions or are in the process of completion that in such an event, under no circumstances, of the consideration paid or agreed to be the Customer, shall not be refundable and the same shall not be forfeited in full.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">6. MISCELLANEOUS</h4>
                    <p className="mb-1">6.1 BUILDING INDIA DIGITAL SHALL be permitted to identify customer, as BUILDING INDIA DIGITAL client and may use customer's name in connection with BUILDING INDIA DIGITAL marketing invitative.</p>
                    <p className="mb-1">6.2 Customer agrees and permits BUILDING INDIA DIGITAL to make calls and messages on his mobile and office contact numbers subsequent to the signing of this agreement.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">7. DISCLAIMER</h4>
                    <p className="mb-1">7.1 BUILDING INDIA DIGITAL makes no representation, warranties or guarantees of any kind as to the level of sales, purchase, click, sales leads or other performance that customer can expect from advertising campaign through BUILDING INDIA DIGITAL any bstimated provided by BUILDING INDIA DIGITAL to the customer are not intended to create any binding obligation or to be relied upon by the customer and the same are mere estimates.</p>
                    <p className="mb-1">7.2 BUILDING INDIA DIGITAL will not be liable for any loss of profit, loss of contract, loss of use, or nay idrect and/or indirect and/or any consequential loss damage and expenses sustained incurred by the customer as a result of any acts or omission or information or advise given in any form by or on behalf of BUILDING INDIA DIGITAL to the customer and the customer is advised to make its own inquiries and use its own judgement and/or intellect before taking any decision regarding the same.</p>
                    <p className="mb-1">7.3 In addition to the above it is further agreed that the customer shall be solely liable for any loss or damage, whther monetary or other suffered by it as a result of any change effected by it on its own in the website by using CMS and BUILDING INDIA DIGITAL shall not be held liable any account whatsoever,</p>
                    <p className="mb-1">7.4 Customer would be provided access to reporting interface by BUILDING INDIA DIGITAL showcasing all the critical performance parametershowever BUILDING INDIA DIGITAL accept no liability based on performance.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">8. FORCE MAJEURE</h4>
                    <p className="mb-1">8.1 Neither party will be liable to the other, for any delay or failure to fulfill obligations set for till in this agreement caused by force major reasons or crcumstances beyond their control.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">9. COMMUNICATION</h4>
                    <p className="mb-1">9.1 Any notice send by the customer with respect to this agreement has be in writing and has to be sent registered post at the following address. F-140, 4th Floor, Phase-8B, Mohali, Punjab.</p>
                    <p className="mb-1">9.2 In case of any query the Customer can contact the Manager of BUILDING INDIA DIGITAL between 10Am to 6 PM between Monday to Friday on the phone number given on the face of the present invoice.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">10. GOVERNING LAW AND JURISDICTION</h4>
                    <p className="mb-1">10.1 The agreement, its validity, construction, interpretation, effect, performance and termination shall be governed by the laws (both substantive and procedural) as applicable in India From time to time.</p>
                    <p className="mb-1">10.2 Any dispute or diffrence arising out of or in connection with this agreement including its interpretation there of between BUILDING INDIA DIGITAL customer shall be subject to the exclusive jurisdiction to the courts of Mohali (Punjab) only.</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">11. ABOVE PACKAGE IS FOR 1 ID ONLY</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 my-6 print:hidden">
            <h2 className="text-xl font-bold mb-6">Saved Quotations</h2>
            {groupedQuotations.length === 0 ? (
              <p className="text-gray-500">No saved quotations found.</p>
            ) : (
              <div className="space-y-4">
                {groupedQuotations.map(group => (
                  <div key={group.label} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => toggleFolder(group.label)} className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <FolderOpen size={20} className="text-blue-500" />
                        <span className="font-semibold text-gray-800 text-lg">{group.label}</span>
                        <span className="text-xs text-blue-800 bg-blue-100 font-bold px-2.5 py-0.5 rounded-full">{group.quotations.length}</span>
                      </div>
                      <span className="text-gray-400 font-bold">{openFolders[group.label] ? '▼' : '▶'}</span>
                    </button>
                    
                    {openFolders[group.label] && (
                      <div className="divide-y divide-gray-100 bg-white">
                        {group.quotations.map(quot => (
                          <div key={quot.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                              <div className="font-medium flex items-center gap-2 text-gray-900">
                                {quot.quotationInfo?.number || quot.number || 'No Quotation Number'}
                                {quot.formData?.isRevised && (
                                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">R{quot.formData.revisionNumber}</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 font-medium">
                                {quot.formData?.quotationName ? `${quot.formData.quotationName} (${quot.formData.clientName || 'No Client Name'})` : (quot.formData?.clientName || 'No Client Name')}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">Saved on: {new Date(quot.savedAt || Date.now()).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { loadQuotation(quot); setActiveTab('editor'); }} className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors font-medium font-semibold">Load</button>
                              <button onClick={() => handleRevisionFromFirebase(quot.id)} className="px-4 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors font-medium font-semibold">Revised</button>
                              {quot.formData && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const blob = await pdf(<QuotationPDF
                                        formData={quot.formData}
                                        quotationInfo={quot.quotationInfo || INITIAL_QUOTATION_INFO}
                                        subscriptionItems={quot.subscriptionItems || []}
                                      />).toBlob();
                                      const url = URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      const quotNum = quot.quotationInfo?.number || 'quotation';
                                      const filename = quot.formData.quotationName
                                        ? `${quot.formData.quotationName}.pdf`
                                        : `quotation-${quotNum.replace(/\//g, '-')}.pdf`;
                                      link.download = filename;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Error generating PDF:', error);
                                      alert('Error generating PDF: ' + error.message);
                                    }
                                  }}
                                  className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors font-medium font-semibold"
                                >
                                  Download PDF
                                </button>
                              )}
                              <button onClick={() => deleteQuotation(quot.id)} className="px-4 py-1.5 bg-white text-red-500 text-sm rounded-md hover:bg-red-50 border border-red-200 transition-colors font-medium">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationForm;
