import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeSprintProgress, computePracticeStreak } from '@/lib/sprintDisplay'
import LibraryClient from './LibraryClient'

// Always hit Supabase for library — new approved sprints must appear without redeploy.
export const dynamic = 'force-dynamic'

// ── Data helpers ──────────────────────────────────────────────────────────────

function groupBooksByCategory(booksData) {
  return booksData.reduce((acc, book) => {
    const category = book.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(book)
    return acc
  }, {})
}

/**
 * Build continue rows with open-loop pull fields (situation, last try, outcome).
 */
function buildUserSkills(progressData, booksData, dayMetaByBook = {}) {
  if (!progressData || progressData.length === 0) return []

  const byBook = {}
  progressData.forEach((row) => {
    if (!byBook[row.book_id]) byBook[row.book_id] = []
    byBook[row.book_id].push(row)
  })

  return Object.entries(byBook)
    .map(([bookId, rows]) => {
      const book = booksData.find((b) => b.id === bookId)
      if (!book) return null
      if (!book.sprint_title && !book.sprint_skill) return null

      const progress = computeSprintProgress(rows)
      // Show in Continue only if they've started and not finished all 7
      if (!progress.hasStarted || progress.isComplete) return null
      if (progress.completedDays < 1 && !rows.some((r) => Number(r.day_number) >= 0)) {
        return null
      }

      const byDay = {}
      for (const r of rows) {
        const n = Number(r.day_number)
        if (!Number.isFinite(n)) continue
        byDay[n] = r
      }

      // Week situation lives on Day 1 progress_notes
      const situation = String(byDay[1]?.progress_notes || '').trim() || null

      // Last completed practice day (1–7) for "what you tried"
      let lastDid = null
      let lastOutcome = null
      let lastDidDay = null
      for (let d = 7; d >= 1; d--) {
        const row = byDay[d]
        if (!row?.completed) continue
        const did = String(row.action_commitment || '').trim()
        const outcome = String(row.evening_reflection || '').trim()
        if (did || outcome) {
          lastDid = did || null
          lastOutcome = outcome || null
          lastDidDay = d
          break
        }
      }
      // If no completed-day notes, still surface yesterday-of-next if they logged a try
      if (!lastDid && progress.nextDay > 1) {
        const prev = byDay[progress.nextDay - 1]
        const did = String(prev?.action_commitment || '').trim()
        const outcome = String(prev?.evening_reflection || '').trim()
        if (did) {
          lastDid = did
          lastOutcome = outcome || null
          lastDidDay = progress.nextDay - 1
        }
      }

      const dayMeta = dayMetaByBook[bookId] || {}
      const nextMeta = dayMeta[progress.nextDay] || {}

      return {
        bookId,
        bookTitle: book.title,
        sprintTitle: book.sprint_title || '',
        sprintSkill: book.sprint_skill || '',
        daysCompleted: progress.completedDays,
        nextDay: progress.nextDay,
        pct: progress.pct,
        lastTouched: progress.lastTouched,
        situation,
        lastDid,
        lastOutcome,
        lastDidDay,
        nextDayTitle: nextMeta.title || '',
        nextDaySkill: nextMeta.skill_focus || '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const ta = a.lastTouched ? new Date(a.lastTouched).getTime() : 0
      const tb = b.lastTouched ? new Date(b.lastTouched).getTime() : 0
      if (tb !== ta) return tb - ta
      return b.daysCompleted - a.daysCompleted
    })
}

// ── Server component — fetches everything before the page renders ─────────────

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Public library = shippable only (approved + has sprint title).
  // Never surface in_repair / pending — even if RLS or cache is noisy.
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select('id, title, author, category, tag, cover_url, brief_content, sprint_title, sprint_skill, review_status')
    .eq('review_status', 'approved')
    .not('sprint_title', 'is', null)
    .order('created_at', { ascending: false })

  if (booksError) {
    console.error('[library] books query failed:', booksError.message)
  }

  const books = (booksError || !booksData ? [] : booksData).filter(
    (b) =>
      b?.review_status === 'approved' &&
      String(b.sprint_title || '').trim().length > 0
  )
  const booksByCategory = groupBooksByCategory(books)
  const sprintCount = books.length

  const { data: progressData } = await supabase
    .from('user_progress')
    .select(
      'book_id, day_number, completed, unlocked_at, completed_at, progress_notes, action_commitment, evening_reflection'
    )
    .eq('user_id', user.id)

  // Day titles/skill focus for pull copy on next day
  const bookIds = books.map((b) => b.id)
  const dayMetaByBook = {}
  if (bookIds.length) {
    const { data: dayRows } = await supabase
      .from('summit_days')
      .select('book_id, day_number, title, skill_focus')
      .in('book_id', bookIds)
      .gte('day_number', 1)
      .lte('day_number', 7)

    for (const row of dayRows || []) {
      if (!dayMetaByBook[row.book_id]) dayMetaByBook[row.book_id] = {}
      const n = Number(row.day_number)
      // Prefer first row (or IC if multiple contexts later)
      if (!dayMetaByBook[row.book_id][n]) {
        dayMetaByBook[row.book_id][n] = {
          title: row.title || '',
          skill_focus: row.skill_focus || '',
        }
      }
    }
  }

  const userSkills = buildUserSkills(progressData ?? [], books, dayMetaByBook)
  const practiceStreak = computePracticeStreak(progressData ?? [])

  return (
    <LibraryClient
      initialBooks={books}
      initialBooksByCategory={booksByCategory}
      initialUserSkills={userSkills}
      initialSprintCount={sprintCount ?? 0}
      initialPracticeStreak={practiceStreak}
    />
  )
}
