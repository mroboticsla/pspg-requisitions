"use client"

import { useEffect, useState } from 'react'
import getFullUserData from './getFullUserData'

export default function useFullUser() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getFullUserData()
      .then((res) => {
        if (!mounted) return
        setData(res)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  return { data, loading, error }
}
