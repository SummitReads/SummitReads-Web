import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ──────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────

// reflection_data is jsonb; values may be plain strings or future structured objects.
function extractMilepostText(reflectionData) {
  if (!reflectionData) return null;
  if (typeof reflectionData === 'string') return reflectionData.trim() || null;
  if (typeof reflectionData === 'object') {
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

// Fire-and-forget logger — never blocks the response stream
async function logInteraction({ userId, bookId, dayNumber, interactionType, userInput, coachOutput, metadata }) {
  if (!userId || !bookId || !dayNumber) return; // skip logging for anonymous / malformed calls
  try {
    await supabase.from('coach_interactions').insert({
      user_id:          userId,
      book_id:          bookId,
      day_number:       dayNumber,
      interaction_type: interactionType,
      user_input:       userInput || null,
      coach_output:     coachOutput || null,
      metadata:         metadata || null,
    });
  } catch (err) {
    console.error('Failed to log coach interaction:', err?.message ?? err);
    // Logging failures must not affect the user experience
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ──────────────────────────────────────────────────────────────────────────

// CHAT mode — the existing widget. Voice unchanged from the field-name fix.
function buildChatSystemPrompt({ book, currentDay, userReflection, userMission, learningPreferences }) {
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

// EXPLORE mode — unchanged from current behavior.
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

// SECOND_LOOK mode — Phase 2 stub. Real prompt comes in Phase 2.
function buildSecondLookSystemPrompt({ book, currentDay, milepostText, previousMileposts }) {
  return `[STUB] Second look prompt placeholder. Phase 2 will replace this with the advisory voice we drafted.
Book: ${book.title} | Day ${currentDay.day_number} | Milepost: ${milepostText}`;
}

// OPENING mode — Phase 3 stub.
function buildOpeningSystemPrompt({ book, currentDay, yesterdayMilepost, yesterdayReflection }) {
  return `[STUB] Opening check-in prompt placeholder. Phase 3 will replace this.`;
}

// CLOSING mode — Phase 3 stub.
function buildClosingSystemPrompt({ book, currentDay, todayMilepost }) {
  return `[STUB] Closing reflection prompt placeholder. Phase 3 will replace this.`;
}

// ARTIFACT mode — Phase 4 stub.
function buildArtifactSystemPrompt({ book, allDays, allProgress }) {
  return `[STUB] Day 7 artifact generation prompt placeholder. Phase 4 will replace this.`;
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN ROUTE
// ──────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const {
    bookId,
    dayNum,
    userId,
    userMessage,
    conversationHistory,
    context           = 'day',
    activeSection     = null,
    interaction_type,                       // NEW — drives mode dispatch
    milepostText,                           // for second_look mode
  } = requestBody;

  // Backwards compat: if interaction_type isn't provided, infer from context.
  // Existing SummitCoach.jsx widget calls won't include it, and we want them to keep working.
  const mode = interaction_type || (context === 'explore' ? 'explore' : 'chat');

  // Validate required fields per mode
  if (!bookId || !dayNum) {
    return NextResponse.json({ error: 'Missing bookId or dayNum' }, { status: 400 });
  }
  if ((mode === 'chat' || mode === 'explore') && !userMessage) {
    return NextResponse.json({ error: 'Missing userMessage for chat/explore mode' }, { status: 400 });
  }
  if (mode === 'second_look' && !milepostText) {
    return NextResponse.json({ error: 'Missing milepostText for second_look mode' }, { status: 400 });
  }

  // Fetch shared context — book, current day, user progress, profile.
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
    return NextResponse.json({ error: `Day query failed: ${currentDayRes.error.message}` }, { status: 500 });
  }

  const book                = bookRes.data;
  const currentDay          = currentDayRes.data;
  const learningPreferences = profileRes?.data?.learning_preferences || null;

  if (!book || !currentDay) {
    return NextResponse.json({ error: 'Book or day not found' }, { status: 404 });
  }

  // Build progress map for cross-day context lookups
  const progressMap = {};
  (progressRes.data || []).forEach(p => {
    progressMap[p.day_number] = p;
  });
  const currentProgress = progressMap[dayNum];
  const userReflection  = extractMilepostText(currentProgress?.reflection_data);
  const userMission     = currentProgress?.completed === true;

  // ── Mode dispatch ──────────────────────────────────────────────────────
  let systemPrompt;
  let promptUserMessage = userMessage;

  switch (mode) {
    case 'chat':
      systemPrompt = buildChatSystemPrompt({
        book,
        currentDay,
        userReflection,
        userMission,
        learningPreferences,
      });
      break;

    case 'explore':
      systemPrompt = buildExploreSystemPrompt({ book, currentDay, activeSection });
      break;

    case 'second_look': {
      const previousMileposts = [];
      for (let d = 1; d < dayNum; d++) {
        const prev = progressMap[d];
        const text = extractMilepostText(prev?.reflection_data);
        if (text) previousMileposts.push({ day: d, milepost: text });
      }
      systemPrompt = buildSecondLookSystemPrompt({
        book,
        currentDay,
        milepostText,
        previousMileposts,
      });
      // For second_look, the "user message" is the milepost itself
      promptUserMessage = `Here is my milepost for review: "${milepostText}"`;
      break;
    }

    case 'opening': {
      const yesterday = progressMap[dayNum - 1];
      systemPrompt = buildOpeningSystemPrompt({
        book,
        currentDay,
        yesterdayMilepost:    extractMilepostText(yesterday?.reflection_data),
        yesterdayReflection:  yesterday?.evening_reflection || null,
      });
      promptUserMessage = userMessage || 'Generate the opening check-in for today.';
      break;
    }

    case 'closing': {
      systemPrompt = buildClosingSystemPrompt({
        book,
        currentDay,
        todayMilepost: userReflection,
      });
      promptUserMessage = userMessage || 'Generate the closing reflection prompt for today.';
      break;
    }

    case 'artifact':
      systemPrompt = buildArtifactSystemPrompt({
        book,
        allDays:     [],          // Phase 4 will populate
        allProgress: progressRes.data || [],
      });
      promptUserMessage = userMessage || 'Generate the Day 7 artifact for this user.';
      break;

    default:
      return NextResponse.json({ error: `Unknown interaction_type: ${mode}` }, { status: 400 });
  }

  // ── OpenAI call ────────────────────────────────────────────────────────
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: promptUserMessage },
  ];

  let openAiStream;
  try {
    openAiStream = await openai.chat.completions.create({
      model:      'gpt-4.1-mini',
      messages,
      max_tokens: 300,
      stream:     true,
    });
  } catch (openAiError) {
    console.error('OpenAI API error:', openAiError);
    return NextResponse.json({ error: `OpenAI error: ${openAiError.message}` }, { status: 500 });
  }

  // ── Stream the response, accumulate for logging ────────────────────────
  const encoder = new TextEncoder();
  let fullCoachOutput = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of openAiStream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            fullCoachOutput += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        console.error('Stream error:', err);
      } finally {
        controller.close();
        // Fire-and-forget log AFTER stream closes — never blocks the user
        logInteraction({
          userId,
          bookId,
          dayNumber:       dayNum,
          interactionType: mode,
          userInput:       promptUserMessage,
          coachOutput:     fullCoachOutput,
          metadata: {
            context,
            active_section:        activeSection,
            had_user_reflection:   Boolean(userReflection),
            mission_completed:     userMission,
            had_milepost_text:     Boolean(milepostText),
          },
        });
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':      'text/plain; charset=utf-8',
      'Cache-Control':     'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}