'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import GroupDetails from '@/components/dashboard/GroupDetails'

export default function GroupDetailsPage() {
  const params = useParams()
  const groupId = params.id as string

  return (
    <ProtectedRoute>
      <GroupDetails groupId={groupId} />
    </ProtectedRoute>
  )
}