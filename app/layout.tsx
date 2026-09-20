import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ATScore — Resume ATS Scorer",
  description:
    "Upload your resume and a job description to get an instant ATS compatibility score and tailored rewrite suggestions."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
