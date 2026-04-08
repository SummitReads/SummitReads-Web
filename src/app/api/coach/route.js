import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INITIAL_GREETING = `I'm your Summit Coach for this journey. I'm here to help you think through today's insight, work through the mission, or just talk about what's coming up for you. What's on your mind?`;

function shortText(value, max = 220) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}

function buildSystemPrompt({ book, currentDay, recentCompleted, userReflection, userMission }) {
  const stageNum = currentDay.day_number;

  const stagePhaseGuidance = stageNum <= 2
    ? 'Orientation mode. Stay curious. Help them notice where today\'s idea shows up in real life. Push awareness before action.'
    : stageNum <= 4
      ? 'Application mode. Get concrete about real situations, friction, and what happened this week.'
      : stageNum <= 6
        ? 'Reinforcement mode. Help them see what is starting to shift and go one level deeper.'
        : 'Integration mode. Help them name what changed and how they will carry it forward.';

  const completedSummary = recentCompleted.length
    ? recentCompleted.map(d => `Stage ${d.day_number}: ${d.title}`).join(' | ')
    : 'None yet.';

  return `You are the Summit Coach for SummitSkills: warm, sharp, direct, and grounded. You are a coach, not a consultant. Help them think clearly instead of dumping advice.

Book: "${book.title}" by ${book.author}
Category: ${book.category || 'Personal Development'}

Today is Stage ${stageNum} of 7.
Stage title: "${currentDay.title}"
Core insight: ${shortText(currentDay.ascent_content, 700)}
Reflection question: ${currentDay.basecamp_question || 'No reflection question for today.'}
Mission: ${currentDay.summit_mission || 'No mission assigned today.'}
User reflection: ${userReflection || 'No written reflection yet.'}
Mission completed: ${userMission ? 'Yes' : 'No'}
Completed stages: ${completedSummary}

Posture for today: ${stagePhaseGuidance}

Rules:
- Default to 1 to 3 sentences. 4 max.
- End every response with exactly one question.
- Stay rooted in this book and this stage.
- Do not give a multi-step plan.
- Do not give multiple options unless they ask.
- If they have not done the mission, get curious about the friction instead of lecturing.
- If they have given enough raw material and are struggling to phrase it, draft the sentence for them and ask one confirmation question.
- Do not use fake enthusiasm or long explanations.
- Keep aiming at one real behavior change by the end of the sprint.`;
}

export async function POST(request) {
  try {
    const { bookId, dayNum, userId, userMessage, conversationHistory } = await request.json();

    if (!bookId || !dayNum || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [bookRes, allDaysRes, progressRes] = await Promise.all([
      supabase
        .from('books')
        .select('id, title, author, category')
        .eq('id', bookId)
        .single(),
      supabase
        .from('summit_days')
        .select('day_number, title, ascent_content, basecamp_question, summit_mission')
        .eq('book_id', bookId)
        .order('day_number'),
      userId
        ? supabase
            .from('user_progress')
            .select('day_number, completed, reflection_text, mission_completed')
            .eq('user_id', userId)
            .eq('book_id', bookId)
        : Promise.resolve({ data: [] })
    ]);

    if (bookRes.error) throw bookRes.error;
    if (allDaysRes.error) throw allDaysRes.error;
    if (progressRes?.error) throw progressRes.error;

    const book = bookRes.data;
    const allDays = allDaysRes.data || [];
    const currentDay = allDays.find(d => Number(d.day_number) === Number(dayNum));

    if (!book || !currentDay) {
      return NextResponse.json({ error: 'Book or stage not found' }, { status: 404 });
    }

    const progressMap = Object.fromEntries(
      (progressRes.data || []).map(p => [Number(p.day_number), p])
    );

    const recentCompleted = allDays
      .filter(d => Number(d.day_number) < Number(dayNum) && progressMap[Number(d.day_number)]?.completed)
      .slice(-2);

    const currentProgress = progressMap[Number(dayNum)];

    const systemPrompt = buildSystemPrompt({
      book,
      currentDay,
      recentCompleted,
      userReflection: currentProgress?.reflection_text || null,
      userMission: currentProgress?.mission_completed || false
    });

    const trimmedHistory = (conversationHistory || [])
      .filter(msg => msg?.content && msg.content !== INITIAL_GREETING)
      .slice(-6)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmedHistory,
        { role: 'user', content: userMessage.trim() }
      ],
      max_completion_tokens: 220
    });

    const raw = response.choices?.[0]?.message;
    const assistantMessage = typeof raw?.content === 'string'
      ? raw.content
      : Array.isArray(raw?.content)
        ? raw.content.map(block => block?.text || '').join('')
        : '';

    return NextResponse.json({
      message: assistantMessage || 'What feels most true for you about today\'s stage?'
    });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}