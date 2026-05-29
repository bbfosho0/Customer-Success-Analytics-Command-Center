import type { Metadata } from "next";
import "../styles/globals.css";

import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

const fontVariables = "[--font-sans:Inter,system-ui,sans-serif] [--font-display:Space_Grotesk,Inter,system-ui,sans-serif]";

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
    <html lang="en" className={fontVariables}>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
