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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #ffffff;
            color: #000000;
          }
        `}</style>
      </head>
      <body className="bg-white">{children}</body>
    </html>
  );
}
