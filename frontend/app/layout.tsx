import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Directory Service',
  description: 'Manage permissions, user groups, and contacts',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <SessionProvider session={session}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </SessionProvider>
      </body>
    </html>
  );
} 