import type { Metadata } from "next";
import "../styles/globals.css";

import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

export const metadata: Metadata = {
  title: "Customer Success Analytics Command Center",
  description: "Customer 360, churn risk, retention, LTV, and support analytics dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
