import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TeamUp — Find Your Dream Hackathon Team",
  description: "The premier platform for hackers to discover hackathons, form teams, and build together. Find your perfect teammates based on skills, experience, and shared interests.",
  keywords: ["hackathon", "team formation", "developers", "coding", "teamup"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a1a] text-[#f1f5f9]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
