import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AlertsClient from './AlertsClient'

export default async function AlertsPage() {
  const session = await getServerSession(authOptions)
  const { nombre } = session!.user
  return <AlertsClient userName={nombre} />
}
