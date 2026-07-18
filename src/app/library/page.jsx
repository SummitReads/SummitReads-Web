import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeSprintProgress } from '@/lib/sprintDisplay'
import LibraryClient from './LibraryClient'

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
 * Build continue rows using accurate day 1–7 progress (not raw completed-row counts).
 */
function buildUserSkills(progressData, booksData) {
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
      // Need at least some engagement (unlocked or completed) on the sprint
      if (progress.completedDays < 1 && !rows.some((r) => Number(r.day_number) >= 0)) {
        return null
      }

      return {
        bookId,
        bookTitle: book.title,
        sprintTitle: book.sprint_title || '',
        sprintSkill: book.sprint_skill || '',
        daysCompleted: progress.completedDays,
        nextDay: progress.nextDay,
        pct: progress.pct,
        lastTouched: progress.lastTouched,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Most recently touched first, then further along
      const ta = a.lastTouched ? new Date(a.lastTouched).getTime() : 0
      const tb = b.lastTouched ? new Date(b.lastTouched).getTime() : 0
      if (tb !== ta) return tb - ta
      return b.daysCompleted - a.daysCompleted
    })
}

// ── Server component — fetches everything before the page renders ─────────────

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient()

  // ── Auth check — redirect before anything renders ─────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // ── Fetch books ────────────────────────────────────────────────────────────
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select('id, title, author, category, tag, cover_url, brief_content, sprint_title, sprint_skill, review_status')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })

  const books = booksError || !booksData ? [] : booksData
  const booksByCategory = groupBooksByCategory(books)

  const sprintCount = books.length

  // ── Fetch user progress ────────────────────────────────────────────────────
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('book_id, day_number, completed, unlocked_at, completed_at')
    .eq('user_id', user.id)

  const userSkills = buildUserSkills(progressData ?? [], books)

  return (
    <LibraryClient
      initialBooks={books}
      initialBooksByCategory={booksByCategory}
      initialUserSkills={userSkills}
      initialSprintCount={sprintCount ?? 0}
    />
  )
}
