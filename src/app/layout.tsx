import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roleta de Leads',
  description: 'Sistema de distribuição automatizada de leads para corretores',
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

