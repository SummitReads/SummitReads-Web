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
      if (daysCompleted < 1) return null
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
  // getUser() validates server-side — more secure than getSession()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // ── Fetch books ────────────────────────────────────────────────────────────
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select('id, title, author, category, tag, cover_url, brief_content, sprint_title, sprint_skill, featured, review_status')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })

  const books = booksError || !booksData ? [] : booksData
  const booksByCategory = groupBooksByCategory(books)

  // ── Sprint count derived from books — no extra query needed ─────────────
  const sprintCount = books.length

  // ── Fetch user progress ────────────────────────────────────────────────────
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('book_id, day_number, completed')
    .eq('user_id', user.id)

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
