import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Generator",
  description: "Generate prompts for various use cases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          enableSystem
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              className: '',
              style: {
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '280px',
                maxWidth: '400px',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #22c55e',
                },
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fef2f2',
                },
              },
              loading: {
                style: {
                  background: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                },
                iconTheme: {
                  primary: '#f59e0b',
                  secondary: '#fffbeb',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
