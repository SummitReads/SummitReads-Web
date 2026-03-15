#!/usr/bin/env node
// scripts/sync-books.js
// Syncs book data from Google Sheets to Supabase

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Load Google credentials
const credentialsPath = join(__dirname, '..', 'google-credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// ✅ YOUR GOOGLE SHEET CONFIGURATION
const SPREADSHEET_ID = '1bF7g6lohi6uAFNBZ4jTxha6dZP18e8CjxpKLhkq4FA8';
const SHEET_GID = '1616087500'; // Your sheet's gid from the URL
const RANGE = 'A2:E'; // Just the range, no sheet name

async function syncBooks() {
  console.log('📚 SummitReads Book Sync');
  console.log('========================\n');

  try {
    // Step 1: Get the sheet name from the gid
    console.log('🔍 Finding sheet by gid...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get spreadsheet metadata to find the sheet name
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.sheetId.toString() === SHEET_GID
    );
    
    if (!sheet) {
      console.log(`❌ Could not find sheet with gid ${SHEET_GID}`);
      return;
    }
    
    const sheetName = sheet.properties.title;
    console.log(`✓ Found sheet: "${sheetName}"\n`);

    // Step 2: Fetch data from Google Sheets
    console.log('📥 Fetching books from Google Sheets...');
    const fullRange = `${sheetName}!${RANGE}`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: fullRange,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No data found in sheet');
      return;
    }

    console.log(`✓ Found ${rows.length} books in Google Sheets\n`);

    // Step 3: Process each book
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const [category, tag, title, author, status] = row;
      
      if (!title || !author) {
        console.log(`⚠️  Skipping incomplete row: ${title || 'No title'}`);
        skipped++;
        continue;
      }

      // Check if book exists
      const { data: existing, error: selectError } = await supabase
        .from('books')
        .select('id, category, tag, status')
        .eq('title', title)
        .eq('author', author)
        .maybeSingle();

      if (selectError) {
        console.log(`❌ Error checking ${title}: ${selectError.message}`);
        errors++;
        continue;
      }

      if (existing) {
        // Update existing book
        const { error: updateError } = await supabase
          .from('books')
          .update({ 
            category: category || existing.category,
            tag: tag || existing.tag,
            status: status || existing.status
          })
          .eq('id', existing.id);

        if (updateError) {
          console.log(`❌ Error updating ${title}: ${updateError.message}`);
          errors++;
        } else {
          console.log(`✓ Updated: ${title}`);
          updated++;
        }
      } else {
        // Insert new book
        const { error: insertError } = await supabase
          .from('books')
          .insert({ 
            title,
            author,
            category: category || 'Uncategorized',
            tag: tag || 'General',
            status: status || 'pending'
          });

        if (insertError) {
          console.log(`❌ Error inserting ${title}: ${insertError.message}`);
          errors++;
        } else {
          console.log(`✨ Added: ${title}`);
          added++;
        }
      }
    }

    // Step 4: Summary
    console.log('\n📊 Sync Summary');
    console.log('================');
    console.log(`✨ Added: ${added} books`);
    console.log(`✓ Updated: ${updated} books`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped: ${skipped} incomplete rows`);
    }
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
    }
    console.log(`📚 Total processed: ${rows.length} books\n`);

    // Step 5: Show category breakdown
    const { data: categoryCount } = await supabase
      .from('books')
      .select('category')
      .not('category', 'is', null);

    if (categoryCount) {
      const counts = categoryCount.reduce((acc, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
      }, {});

      console.log('📚 Books by Category:');
      console.log('=====================');
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count} books`);
        });
    }

    console.log('\n✅ Sync complete!\n');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the sync
syncBooks();
