import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klient IoT",
  description: "Frontend do wysyłania zadań obliczeniowych",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}