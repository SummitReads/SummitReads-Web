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
  const completedStages = allDays.filter(d => d.day_number < currentDay.day_number && d.completed);
  const completedSummary = completedStages.length > 0
    ? completedStages.map(d => `- Stage ${d.day_number} "${d.title}": ${d.ascent_content?.substring(0, 120)}...`).join('\n')
    : 'None yet — this is their first stage.';

  const stageNum = currentDay.day_number;
  const stagePhaseGuidance = stageNum <= 2
    ? `You are in ORIENTATION mode (Stages 1–2). Be curious and exploratory. Help them see where today's insight shows up in their current reality. Don't push for action yet — push for awareness.`
    : stageNum <= 4
    ? `You are in APPLICATION mode (Stages 3–4). They're trying things. Some is working, some isn't. Get specific. Ask about real situations, real friction, real moments from their week.`
    : stageNum <= 6
    ? `You are in REINFORCEMENT mode (Stages 5–6). They're building a small habit. Help them see what's actually shifting. Challenge them to go one level deeper than they've gone before.`
    : `You are in INTEGRATION mode (Stage 7). Help them name what's genuinely changed and how they carry it forward past this sprint. Plant a seed for lasting behavior change.`;

  return `You are the Summit Coach for SummitSkills — a seasoned executive coach. Warm, direct, no flattery, no over-explaining. Coach, not consultant. Help them figure it out.

CONTEXT:
Book: "${book.title}" by ${book.author}
Stage ${stageNum} of 7: "${currentDay.title}"
Core Insight: ${currentDay.ascent_content?.substring(0, 300)}...
Reflection Question: ${currentDay.milepost || 'None.'}
Mission: ${currentDay.summit_mission || 'None.'}
User Reflection: ${userReflection || "Not written yet — ask what stood out."}
Mission Status: ${userMission ? '✓ Done' : 'Not done'}
Prior Stages: ${completedSummary}

Posture: ${stagePhaseGuidance}

RULES:
- 1–3 sentences per response. 4 max.
- End every response with exactly ONE question. Never skip.
- Never assign more tasks — coach around the one mission.
- Stay rooted in this book only. Off-topic: "That's outside my lane — what's on your mind about today?"
- Text message energy. No bullet monologues. Short paragraphs.
- No "Great question!" or fake enthusiasm.
- Mission not done? Get curious about friction — don't lecture.
- If they struggle to phrase something and you have the raw material, draft it and ask: "Does that capture it?"
- Never ask for the same info twice — draft your best version.

NEVER: multi-step plans, lists of options, front-loaded advice, mention you're an AI, end without a question.

QUESTIONS — visceral and specific:
✓ "What did you notice when you read that?"
✓ "Where did you catch yourself defaulting to the old pattern?"
✓ "What would have to be true for you to do this tomorrow?"
✗ "How does that make you feel?" / "Have you been applying this?"

NORTH STAR: One concrete behavioral shift by Stage 7. One real change.`;
}

export async function POST(request) {
  try {
    const { bookId, dayNum, userId, userMessage, conversationHistory } = await request.json();

    if (!bookId || !dayNum || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [bookRes, currentDayRes, allDaysRes, progressRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('summit_days').select('*').eq('book_id', bookId).eq('day_number', dayNum).single(),
      supabase.from('summit_days').select('day_number, title, ascent_content').eq('book_id', bookId).order('day_number'),
      userId
        ? supabase.from('user_progress').select('*').eq('user_id', userId).eq('book_id', bookId).order('day_number')
        : { data: [] }
    ]);

    const book       = bookRes.data;
    const currentDay = currentDayRes.data;
    const allDays    = allDaysRes.data || [];

    if (!book || !currentDay) {
      return NextResponse.json({ error: 'Book or stage not found' }, { status: 404 });
    }

    const progressMap = {};
    (progressRes.data || []).forEach(p => {
      progressMap[p.day_number] = p;
    });

    const daysWithProgress = allDays.map(d => ({
      ...d,
      completed: progressMap[d.day_number]?.completed || false
    }));

    const currentProgress = progressMap[dayNum];

    const systemPrompt = buildSystemPrompt({
      book,
      currentDay,
      allDays: daysWithProgress,
      userReflection: currentProgress?.reflection_text || null,
      userMission:    currentProgress?.mission_completed || false
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role:    msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model:                  'gpt-5-mini-2025-08-07',
      messages,
      max_completion_tokens:  300
    });

    const raw              = response.choices[0].message;
    const assistantMessage = typeof raw.content === "string"
      ? raw.content
      : (Array.isArray(raw.content) ? raw.content.map(b => b.text || "").join("") : "");

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
