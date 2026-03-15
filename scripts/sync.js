const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

// 1. Setup Clients
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const auth = new google.auth.GoogleAuth({
  keyFile: 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1bF7g6lohi6uAFNBZ4jTxha6dZP18e8CjxpKLhkq4FA8';

async function syncBooks() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:E100',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows. Checking for 'Pending' books...`);

    for (let i = 0; i < rows.length; i++) {
      const [id, category, title, author, status] = rows[i];
      const rowIndex = i + 2;

      if (status === 'Pending') {
        console.log(`🏛 The Scholar-Strategist is synthesizing "${title}"...`);

        const completion = await openai.chat.completions.create({
          model: "gpt-5-mini-2025-08-07",
          messages: [
            {
              role: "system",
              content: `You are an elite strategic advisor and classically trained scholar. 
              Your style is erudite, punchy, and avoids all corporate jargon or "AI-speak."
              
              RULES:
              1. Never use: "delve," "unlock," "comprehensive," or "in today's world."
              2. Focus on "Systems Design" over generic self-help.
              3. Address the reader as a high-stakes peer.`
            },
            {
              role: "user",
              content: `Synthesize "${title}" by ${author} through three lenses:
              
              1. THE SYNOPSIS (Brief): A singular, weight-bearing truth. One paragraph.
              2. THE STRATEGIC BLUEPRINT (Standard): The "Systems ROI." Three paragraphs on organizational restructuring.
              3. THE ARCHITECT'S LABS (Deep): Five rigorous implementation exercises.
              
              Return ONLY JSON: 
              { "brief": "...", "standard": "...", "labs": [{ "title": "...", "description": "..." }] }`
            }
          ],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        console.log(`📡 Upserting ${title} to Supabase...`);

        // Use upsert to handle both new records and updates
        const { error: supabaseError } = await supabase
          .from('books')
          .upsert({
            title: title,
            author: author,
            brief_content: result.brief,
            standard_content: result.standard,
            deep_content: result.labs,
            status: 'synced'
          }, { onConflict: 'title' });

        if (supabaseError) {
          console.error(`❌ Supabase Error for ${title}:`, supabaseError.message);
          continue;
        }

        // Update Google Sheet status
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Sheet1!E${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['Synced']] },
        });

        console.log(`✅ ${title} successfully synthesized!`);
      }
    }
    console.log('Sync process complete.');
  } catch (error) {
    console.error('Error during sync:', error.message);
  }
}

syncBooks();