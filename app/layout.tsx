import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './logic.css';

export const metadata: Metadata = {
  title: 'Navora — A agenda que acompanha seu estilo',
  description: 'Agendamento inteligente para barbearias.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
