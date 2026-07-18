import LandingClient from './LandingClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Re-fetch approved sprint count periodically so new waves show up without redeploy.
// First HTML paint still includes the number (no client-side flash).
export const revalidate = 300

async function getApprovedSprintCount() {
  try {
    const supabase = await createSupabaseServerClient()
    const { count, error } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'approved')

    if (error) {
      console.error('[landing] sprint count error:', error.message)
      return null
    }
    if (typeof count === 'number' && count >= 0) return count
    return null
  } catch (e) {
    console.error('[landing] sprint count fetch failed:', e)
    return null
  }
}

export default async function Home() {
  const sprintCount = await getApprovedSprintCount()
  // Fallback keeps marketing line intact if Supabase is briefly unavailable
  return <LandingClient sprintCount={sprintCount ?? 14} />
}
