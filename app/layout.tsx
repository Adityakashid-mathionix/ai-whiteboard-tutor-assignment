import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Braynix Studios | AI Interactive Whiteboard Tutor",
  description:
    "An AI-powered interactive learning whiteboard that explains any educational topic with synchronized voice narration, dynamic SVG diagrams, and contextual follow-ups.",
  keywords: [
    "AI Whiteboard Tutor",
    "Interactive Whiteboard",
    "Braynix Studios",
    "NVIDIA NIM",
    "Voice Narration",
    "SVG Diagramming",
    "Next.js",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
