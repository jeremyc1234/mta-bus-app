// app/api/submit-feedback/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, category, rating, feedback, timestamp } = body;

    // Debug log environment variables (safely)
    console.log('Checking environment variables:');
    console.log('GOOGLE_CLIENT_EMAIL exists:', !!GOOGLE_CLIENT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY exists:', !!GOOGLE_PRIVATE_KEY);
    console.log('GOOGLE_SHEET_ID exists:', !!GOOGLE_SHEET_ID);

    // Validate the required fields
    if (!feedback || !category || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_SHEET_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Format the private key correctly
    const formattedPrivateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Set up Google Sheets Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: formattedPrivateKey,
        type: 'service_account'  // Add this line
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the row data
    const row = [
      timestamp,
      name || 'Anonymous',
      email || 'Not provided',
      category,
      rating,
      feedback,
    ];

    console.log('Attempting to append row to sheet...');
    
    // Append the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log('Sheet append response:', response.status);

    return NextResponse.json(
      { message: 'Feedback submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}