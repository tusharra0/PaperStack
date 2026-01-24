import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import ToastContainer from "@/components/ToastContainer";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PaperStack",
  description: "Paper trading platform for students to learn and compete.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-background text-foreground`}>
        <AuthProvider>
          <Navbar />
          <main className="container py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}

