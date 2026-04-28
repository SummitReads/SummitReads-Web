import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt({ book, currentDay, userReflection, userMission, learningPreferences }) {
  const stageNum = currentDay.day_number;
  const stagePhaseGuidance = stageNum <= 2
    ? 'ORIENTATION mode. Be curious and exploratory. Help them see where today\'s insight shows up in their current reality. Push awareness before action.'
    : stageNum <= 4
    ? 'APPLICATION mode. Get specific. Ask about real situations, real friction, real moments from their week.'
    : stageNum <= 6
    ? 'REINFORCEMENT mode. Help them see what\'s actually shifting. Challenge them to go one level deeper.'
    : 'INTEGRATION mode. Help them name what\'s genuinely changed and how they carry it forward.';

  return `You are the Summit Coach for SummitSkills — a seasoned executive coach. Warm, direct, no flattery, no over-explaining. Coach, not consultant. Help them figure it out.

CONTEXT:
Book: "${book.title}" by ${book.author}
Stage ${stageNum} of 7: "${currentDay.title}"
Core Insight: ${currentDay.ascent_content?.substring(0, 300)}...
Reflection Question: ${currentDay.milepost || 'None.'}
Mission: ${currentDay.summit_mission || 'None.'}
User Reflection: ${userReflection || 'Not written yet — ask what stood out.'}
Mission Status: ${userMission ? '✓ Done' : 'Not done'}

Posture: ${stagePhaseGuidance}

${learningPreferences ? `LEARNER PREFERENCES:
${learningPreferences.context === 'individual_contributor' ? '- Context: Individual contributor. Frame examples through personal workflow and individual performance — not team leadership.' : ''}${learningPreferences.context === 'people_manager' ? '- Context: People manager. Frame examples through leading a team, 1:1s, direct reports, and management decisions.' : ''}${learningPreferences.context === 'business_owner' ? '- Context: Business owner or founder. Frame examples through organizational decisions, strategy, and leading at scale.' : ''}
${learningPreferences.style === 'examples_first' ? '- Coaching style: Lead with a concrete real-world example before explaining the concept. Make it tangible first.' : ''}${learningPreferences.style === 'question_led' ? '- Coaching style: Guide through questions more than statements. Help them find the answer themselves.' : ''}${learningPreferences.style === 'action_first' ? '- Coaching style: Lead with a specific next action. Be direct. They will figure out the reasoning themselves.' : ''}${learningPreferences.style === 'reasoning_first' ? '- Coaching style: Explain the why before the what. They want to understand the mechanism before acting.' : ''}` : ''}

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

function buildExploreSystemPrompt({ book, currentDay, activeSection }) {
  const sectionLabel = {
    reading:     'Worth Knowing (extended reading)',
    examples:    'In Practice (real examples)',
    reflections: 'Think About This (reflection prompts)',
    challenges:  'Try This (action challenges)',
  }[activeSection] || 'Explore Further bonus content';

  const sectionGuidance = {
    reading:     'They are reading extended context. Help them connect it to their real situation. Push toward application, not comprehension.',
    examples:    'They are reading real examples. Help them find the one that maps to their context. If none fit, help them adapt the closest one.',
    reflections: 'They are working through reflection prompts. Help them get specific and honest. Push past the polished answer.',
    challenges:  'They are looking at action challenges. Help them pick one and make it concrete enough to actually do. If too heavy, help them find a smaller version that still counts.',
  }[activeSection] || 'They are exploring bonus content from this stage. Help them find what is most relevant to their situation.';

  return `You are the Summit Coach for SummitSkills — a seasoned executive coach. Warm, direct, no flattery, no over-explaining.

CONTEXT:
Book: "${book.title}" by ${book.author}
Stage ${currentDay.day_number} of 7: "${currentDay.title}"
Section: ${sectionLabel}

The user has already completed this stage's mission. They are now in the Explore Further section, going deeper on their own time.

Your posture here: ${sectionGuidance}

RULES:
- 1–3 sentences per response. 4 max.
- End every response with exactly ONE question. Never skip.
- Stay grounded in this stage's content. If they go off-topic: "That's a bit outside what we're looking at here — what's coming up for you from this section?"
- No bullet lists. No multi-step plans. Short paragraphs only.
- No "Great question!" or fake enthusiasm.
- If they want to apply something, get specific about their actual situation — not a hypothetical.
- If they're stuck on a reflection prompt, help them draft an honest answer and check it with them.

NEVER: assign new tasks beyond the stage content, mention you're an AI, end without a question.`;
}

// ── Helper: extract milepost text from reflection_data ────────────────────
// reflection_data is a jsonb column. Historically it has been written as a
// raw string from the page (which Postgres wraps as a JSON string), so the
// value coming back from Supabase may be a string OR an object. This helper
// normalizes both cases to a plain string for the coach prompt.
function extractMilepostText(reflectionData) {
  if (!reflectionData) return null;
  if (typeof reflectionData === 'string') return reflectionData.trim() || null;
  if (typeof reflectionData === 'object') {
    // If a future version stores structured data, prefer a `text` field,
    // otherwise stringify defensively.
    if (reflectionData.text) return String(reflectionData.text).trim() || null;
    try {
      const stringified = JSON.stringify(reflectionData);
      return stringified === '{}' ? null : stringified;
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const { bookId, dayNum, userId, userMessage, conversationHistory, context = 'day', activeSection = null } = await request.json();

    if (!bookId || !dayNum || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [bookRes, currentDayRes, progressRes, profileRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('summit_days').select('*').eq('book_id', bookId).eq('day_number', dayNum).single(),
      userId
        ? supabase.from('user_progress').select('*').eq('user_id', userId).eq('book_id', bookId).order('day_number')
        : { data: [], error: null },
      userId
        ? supabase.from('profiles').select('learning_preferences').eq('id', userId).single()
        : { data: null, error: null }
    ]);

    if (bookRes.error) {
      console.error('Books query failed:', bookRes.error.message);
      return NextResponse.json({ error: `Books query failed: ${bookRes.error.message}` }, { status: 500 });
    }
    if (currentDayRes.error) {
      console.error('Current day query failed:', currentDayRes.error.message);
      return NextResponse.json({ error: `Stage query failed: ${currentDayRes.error.message}` }, { status: 500 });
    }

    const book                = bookRes.data;
    const learningPreferences = profileRes?.data?.learning_preferences || null;
    const currentDay          = currentDayRes.data;

    if (!book || !currentDay) {
      return NextResponse.json({ error: 'Book or stage not found' }, { status: 404 });
    }

    const progressMap = {};
    (progressRes.data || []).forEach(p => {
      progressMap[p.day_number] = p;
    });

    const currentProgress = progressMap[dayNum];

    // ── FIELD NAME FIX ────────────────────────────────────────────────────
    // The schema columns are `reflection_data` (jsonb) and `completed` (bool).
    // Previous code read `reflection_text` and `mission_completed`, which do
    // not exist — so the coach has been operating without the user's milepost
    // for an unknown amount of time. Fixed below.
    const userReflection = extractMilepostText(currentProgress?.reflection_data);
    const userMission    = currentProgress?.completed === true;

    // Use explore prompt when in explore context, day prompt otherwise
    const systemPrompt = context === 'explore'
      ? buildExploreSystemPrompt({ book, currentDay, activeSection })
      : buildSystemPrompt({
          book,
          currentDay,
          userReflection,
          userMission,
          learningPreferences,
        });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role:    msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    let openAiStream;
    try {
      openAiStream = await openai.chat.completions.create({
        model:      'gpt-4.1-mini',
        messages,
        max_tokens: 300,
        stream:     true
      });
    } catch (openAiError) {
      console.error('OpenAI API error:', openAiError);
      return NextResponse.json({ error: `OpenAI error: ${openAiError.message}` }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of openAiStream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type':      'text/plain; charset=utf-8',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      }
    });

  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: error?.message || 'Something went wrong. Try again.' }, { status: 500 });
  }
}