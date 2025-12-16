import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avoar - Excursões Ecológicas",
  description: "Plataforma de excursões ecológicas e blog educativo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
