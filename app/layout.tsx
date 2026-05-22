import type { Metadata } from "next";
import { AuthProvider } from "./_components/auth-provider";
import { LeadProvider } from "./_components/lead-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADU Sales CRM",
  description: "Mobile-first CRM for ADU sales teams",
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
    >
      <body className="min-h-full bg-[#07090d] text-zinc-100">
        <AuthProvider>
          <LeadProvider>{children}</LeadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
