
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NYC Bus Schedules | MTA Bus Finder',
  description: 'Find real-time New York City bus schedules, stop locations, and arrival times for all boroughs.',
}

export default function SchedulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}