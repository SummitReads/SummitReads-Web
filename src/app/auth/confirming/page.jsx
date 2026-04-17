'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmingInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type')
    const next       = searchParams.get('next')

    if (!token_hash || !type) {
      router.replace('/auth/login?error=invalid_link')
      return
    }

    // Forward to the actual callback route handler
    const params = new URLSearchParams({ token_hash, type })
    if (next) params.set('next', next)
    router.replace(`/auth/callback?${params.toString()}`)
  }, [])

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0D1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', animation: 'fadeIn 0.2s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgba(238,242,247,0.9)', letterSpacing: '-0.5px' }}>
          Summit<span style={{ color: '#17B8E0' }}>Skills</span>
        </div>
        <div style={{ width: '36px', height: '36px', border: '2px solid rgba(23,184,224,0.15)', borderTopColor: '#17B8E0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '0.85rem', color: 'rgba(238,242,247,0.35)', margin: 0 }}>Setting up your account…</p>
      </div>
    </>
  )
}

export default function ConfirmingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1520' }} />}>
      <ConfirmingInner />
    </Suspense>
  )
}
