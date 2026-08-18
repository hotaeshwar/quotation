import "./globals.css";

export const metadata = {
  title: "Quotation",
  description: "Generate and manage quotations easily",
  icons: {
    icon: "/images/LOGO c.png",
    shortcut: "/images/LOGO c.png",
    apple: "/images/LOGO c.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
