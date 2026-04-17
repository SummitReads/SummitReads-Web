import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

function buildUserSkills(progressData, booksData) {
  if (!progressData || progressData.length === 0) return []

  const daysByBook = progressData.reduce((acc, row) => {
    if (!acc[row.book_id]) acc[row.book_id] = 0
    if (row.completed) acc[row.book_id] += 1
    return acc
  }, {})

  return Object.entries(daysByBook)
    .map(([bookId, daysCompleted]) => {
      const book = booksData.find((b) => b.id === bookId)
      if (!book || !book.sprint_skill) return null
      return {
        bookId,
        bookTitle:   book.title,
        sprintSkill: book.sprint_skill,
        daysCompleted,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aComplete = a.daysCompleted >= 7
      const bComplete = b.daysCompleted >= 7
      if (aComplete && !bComplete) return 1
      if (!aComplete && bComplete) return -1
      return b.daysCompleted - a.daysCompleted
    })
}

// ── Server component — fetches everything before the page renders ─────────────

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient()

  // ── Auth check — redirect before anything renders ─────────────────────────
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect('/auth/login')
  }

  // ── Fetch books ────────────────────────────────────────────────────────────
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select('*')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })

  const books = booksError || !booksData ? [] : booksData
  const booksByCategory = groupBooksByCategory(books)

  // ── Fetch sprint count ─────────────────────────────────────────────────────
  const { count: sprintCount } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('review_status', 'approved')

  // ── Fetch user progress ────────────────────────────────────────────────────
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('book_id, day_number, completed')
    .eq('user_id', session.user.id)

  const userSkills = buildUserSkills(progressData ?? [], books)

  // ── Pass pre-fetched data to client component ──────────────────────────────
  return (
    <LibraryClient
      initialBooks={books}
      initialBooksByCategory={booksByCategory}
      initialUserSkills={userSkills}
      initialSprintCount={sprintCount ?? 0}
    />
  )
}
