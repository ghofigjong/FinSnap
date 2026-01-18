import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinSnap API',
  description: 'Backend API for FinSnap expense tracking app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
