import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - Fetch all campaigns
export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT
        id,
        name,
        send_date as "sendDate",
        delivered,
        opened,
        clicked,
        bounce,
        unsubscribed,
        spam,
        raw_opens,
        raw_clicks,
        ab_subject_a,
        ab_subject_b,
        ab_winner,
        ab_opened_a,
        ab_opened_b,
        ab_clicked_a,
        ab_clicked_b,
        ab_opens_a,
        ab_opens_b,
        notes
      FROM campaigns
      ORDER BY send_date DESC
    `;

    return NextResponse.json({ campaigns: result.rows });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      sendDate,
      delivered = 0,
      opened = 0,
      clicked = 0,
      bounce = 0,
      unsubscribed = 0,
      spam = 0,
      raw_opens,
      raw_clicks,
      notes,
      ab_subject_a,
      ab_subject_b,
      ab_winner,
      ab_opened_a,
      ab_opened_b,
      ab_clicked_a,
      ab_clicked_b,
      ab_opens_a,
      ab_opens_b
    } = body;

    const result = await sql`
      INSERT INTO campaigns (
        name, send_date, delivered, opened, clicked, bounce, unsubscribed, spam,
        raw_opens, raw_clicks, notes,
        ab_subject_a, ab_subject_b, ab_winner, ab_opened_a, ab_opened_b,
        ab_clicked_a, ab_clicked_b, ab_opens_a, ab_opens_b
      )
      VALUES (
        ${name}, ${sendDate}, ${delivered}, ${opened}, ${clicked}, ${bounce},
        ${unsubscribed}, ${spam}, ${raw_opens}, ${raw_clicks}, ${notes},
        ${ab_subject_a}, ${ab_subject_b}, ${ab_winner}, ${ab_opened_a}, ${ab_opened_b},
        ${ab_clicked_a}, ${ab_clicked_b}, ${ab_opens_a}, ${ab_opens_b}
      )
      RETURNING *
    `;

    return NextResponse.json({ campaign: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id, name, sendDate, delivered, opened, clicked, bounce, unsubscribed, spam,
      raw_opens, raw_clicks, notes,
      ab_subject_a, ab_subject_b, ab_winner, ab_opened_a, ab_opened_b,
      ab_clicked_a, ab_clicked_b, ab_opens_a, ab_opens_b
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE campaigns
      SET
        name = COALESCE(${name}, name),
        send_date = COALESCE(${sendDate}, send_date),
        delivered = COALESCE(${delivered}, delivered),
        opened = COALESCE(${opened}, opened),
        clicked = COALESCE(${clicked}, clicked),
        bounce = COALESCE(${bounce}, bounce),
        unsubscribed = COALESCE(${unsubscribed}, unsubscribed),
        spam = COALESCE(${spam}, spam),
        raw_opens = COALESCE(${raw_opens}, raw_opens),
        raw_clicks = COALESCE(${raw_clicks}, raw_clicks),
        notes = COALESCE(${notes}, notes),
        ab_subject_a = COALESCE(${ab_subject_a}, ab_subject_a),
        ab_subject_b = COALESCE(${ab_subject_b}, ab_subject_b),
        ab_winner = COALESCE(${ab_winner}, ab_winner),
        ab_opened_a = COALESCE(${ab_opened_a}, ab_opened_a),
        ab_opened_b = COALESCE(${ab_opened_b}, ab_opened_b),
        ab_clicked_a = COALESCE(${ab_clicked_a}, ab_clicked_a),
        ab_clicked_b = COALESCE(${ab_clicked_b}, ab_clicked_b),
        ab_opens_a = COALESCE(${ab_opens_a}, ab_opens_a),
        ab_opens_b = COALESCE(${ab_opens_b}, ab_opens_b),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ campaign: result.rows[0] });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM campaigns WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
