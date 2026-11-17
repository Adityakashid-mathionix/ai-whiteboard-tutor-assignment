import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Braynix AI Whiteboard Tutor | Autonomous Visual Learning",
  description:
    "An editorial, AI-powered interactive learning whiteboard that explains any educational concept with synchronized voice narration, dynamic SVG diagrams, and real-time Socratic follow-ups.",
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

export const viewport: Viewport = {
  themeColor: "#0c0d10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#0c0d10] text-[#f6f4ef] font-sans antialiased selection:bg-[#1677ff]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
