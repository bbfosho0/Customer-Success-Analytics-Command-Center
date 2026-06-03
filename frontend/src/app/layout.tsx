import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../styles/globals.css";

import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AWS Serverless Support Analytics",
  description: "Local-first dashboards backed by FastAPI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
