import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Build the coaching system prompt from live context
function buildSystemPrompt({ book, currentDay, allDays, userReflection, userMission }) {
  const completedDays = allDays.filter(d => d.day_number < currentDay.day_number && d.completed);
  const completedSummary = completedDays.length > 0
    ? completedDays.map(d => `- Day ${d.day_number} "${d.title}": ${d.ascent_content?.substring(0, 120)}...`).join('\n')
    : 'None yet — this is their first day.';

  return `You are the Summit Coach for SummitReads, a personal reading and growth platform. You help users apply what they're learning from their current book into their real life.

CURRENT BOOK CONTEXT:
Book: "${book.title}" by ${book.author}
Category: ${book.category || 'Personal Development'}

CURRENT DAY (Day ${currentDay.day_number} of 7):
Title: "${currentDay.title}"
Today's Insight: ${currentDay.ascent_content}
Reflection Question: ${currentDay.basecamp_question || 'No reflection question today.'}
Today's Mission: ${currentDay.summit_mission || 'No mission assigned today.'}

USER'S REFLECTION (what they wrote today):
${userReflection || '(They haven\'t written a reflection yet.)'}

MISSION STATUS:
${userMission ? 'Completed ✓' : 'Not yet completed'}

DAYS ALREADY COMPLETED IN THIS JOURNEY:
${completedSummary}

YOUR COACHING STYLE:
- Be warm, direct, and grounded. You are calm and wise, not hyped up.
- Ask ONE good question at a time. Never bombard them with multiple questions.
- Help them connect today's insight to their actual life — not a generic example.
- If they share something personal, acknowledge it before pivoting to the lesson.
- If they're stuck on the mission, help them adapt it to their situation. The mission is a starting point, not a rigid rule.
- If they ask about the book's content, stay grounded in what their journey actually covers. Don't fabricate details beyond what's provided here.
- Keep responses concise — 2-4 sentences unless they're deep in conversation.
- Never be preachy. Never lecture. Guide through questions and gentle observations.
- Invite reflection with "Notice what happens when..." rather than "think about" or "consider." Match the experiential tone of the journey content.
- Keep questions visceral and specific. Ask "What did you notice in your chest when you read that?" not "How does that make you feel?"
- If they go off-topic entirely (unrelated to their journey or personal growth), briefly redirect: "That's outside my lane — I'm here to help with your ${book.title} journey. What's on your mind about today?"

IMPORTANT BOUNDARIES:
- You only know what's in this context. Don't invent book details, chapters, or quotes.
- You are not a therapist. If they mention serious mental health struggles, gently suggest professional support.
- Stay focused on THIS book and THIS journey. Don't recommend other books or platforms.`;
}

export async function POST(request) {
  try {
    const { bookId, dayNum, userId, userMessage, conversationHistory } = await request.json();

    if (!bookId || !dayNum || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- Pull context from Supabase (server-side, service role) ---
    const [bookRes, currentDayRes, allDaysRes, progressRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('summit_days').select('*').eq('book_id', bookId).eq('day_number', dayNum).single(),
      supabase.from('summit_days').select('day_number, title, ascent_content').eq('book_id', bookId).order('day_number'),
      userId
        ? supabase.from('user_progress').select('*').eq('user_id', userId).eq('book_id', bookId).order('day_number')
        : { data: [] }
    ]);

    const book = bookRes.data;
    const currentDay = currentDayRes.data;
    const allDays = allDaysRes.data || [];

    if (!book || !currentDay) {
      return NextResponse.json({ error: 'Book or day not found' }, { status: 404 });
    }

    // Merge progress into days
    const progressMap = {};
    (progressRes.data || []).forEach(p => {
      progressMap[p.day_number] = p;
    });

    const daysWithProgress = allDays.map(d => ({
      ...d,
      completed: progressMap[d.day_number]?.completed || false
    }));

    const currentProgress = progressMap[dayNum];

    // --- Build messages for OpenAI ---
    const systemPrompt = buildSystemPrompt({
      book,
      currentDay,
      allDays: daysWithProgress,
      userReflection: currentProgress?.reflection_text || null,
      userMission: currentProgress?.mission_completed || false
    });

    // Build message array: system + history + current message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // --- Call OpenAI ---
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7
    });

    const assistantMessage = response.choices[0].message.content;

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
