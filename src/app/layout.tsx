import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Карта воспитательной среды",
  description: "Инструмент самодиагностики для советников директора по воспитанию",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
