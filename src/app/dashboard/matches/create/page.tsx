'use client'

import { Suspense } from 'react'
import CreateMatchForm from '@/components/dashboard/CreateMatchForm'

export default function CreateMatchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    }>
      <CreateMatchForm />
    </Suspense>
  )
}