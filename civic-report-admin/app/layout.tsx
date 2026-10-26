import './globals.css';
import React from 'react';

export const metadata = {
  title: 'PolisCheck Municipality Admin Portal',
  description: 'Municipal management dashboard for civic issue reports',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
