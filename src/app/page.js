"use client";

import dynamic from 'next/dynamic';

const QuotationForm = dynamic(
  () => import('../components/QuotationForm'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <QuotationForm />
    </main>
  );
}
