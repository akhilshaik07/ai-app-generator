import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/shell/AppShell'
import { QueryProvider } from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: 'AI Studio - App Generator',
  description: 'Config-driven app generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('unhandledrejection', function(event) {
              if (event.reason && event.reason.type === 'cancelation') {
                event.preventDefault();
              }
            });
          `
        }} />
      </head>
      <body>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  )
}
