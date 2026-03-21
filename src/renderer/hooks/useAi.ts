import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { AiDepartment, AiResponse } from '@/shared/types'

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => window.plunge.ai.status(),
    staleTime: 60_000,
  })
}

export function useAi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ask = useCallback(async (
    department: AiDepartment,
    message: string,
    context?: Record<string, unknown>
  ): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res: AiResponse = await window.plunge.ai.ask({ department, message, context })
      if (res.ok) {
        return res.content
      } else {
        setError(res.error)
        return null
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { ask, isLoading, error }
}
