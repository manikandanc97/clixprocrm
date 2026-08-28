import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ClixProCRM",
  description:
    "ClixProCRM dashboard for sales, customers, pipeline, quotations, tasks, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className="h-full antialiased" 
      suppressHydrationWarning 
      data-scroll-behavior="smooth"
    >
      <body className="flex flex-col min-h-full font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}












