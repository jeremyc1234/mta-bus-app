import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | MTA Bus Finder',
  description: 'Learn about MTA Bus Finder and how we help you track New York City buses in real-time.',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}