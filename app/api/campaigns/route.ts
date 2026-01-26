import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET all campaigns
export async function GET() {
  try {
    const result = await sql`
      SELECT
        id, name, send_date as "sendDate", delivered, opened, clicked,
        bounce, unsubscribed, spam, raw_opens as "rawOpens", raw_clicks as "rawClicks",
        ab_subject_a, ab_subject_b, ab_winner, ab_opened_a, ab_opened_b,
        ab_clicked_a, ab_clicked_b, ab_opens_a, ab_opens_b, notes
      FROM campaigns
      ORDER BY send_date DESC
    `;

    const campaigns = result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      sendDate: row.sendDate,
      delivered: row.delivered,
      opened: parseFloat(row.opened) || 0,
      clicked: parseFloat(row.clicked) || 0,
      bounce: row.bounce,
      unsubscribed: row.unsubscribed,
      spam: row.spam,
      rawOpens: row.rawOpens,
      rawClicks: row.rawClicks,
      abResults: row.ab_subject_a ? {
        subjectA: row.ab_subject_a,
        subjectB: row.ab_subject_b,
        winner: row.ab_winner,
        openedA: row.ab_opened_a ? parseFloat(row.ab_opened_a) : null,
        openedB: row.ab_opened_b ? parseFloat(row.ab_opened_b) : null,
        clickedA: row.ab_clicked_a ? parseFloat(row.ab_clicked_a) : null,
        clickedB: row.ab_clicked_b ? parseFloat(row.ab_clicked_b) : null,
        opensA: row.ab_opens_a,
        opensB: row.ab_opens_b,
      } : undefined,
      notes: row.notes,
    }));

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({
      error: 'Failed to fetch campaigns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recipients = body.recipients || body.delivered || 0;
    const opens = body.opens || body.rawOpens || 0;
    const clicks = body.clicks || body.rawClicks || 0;
    const openRate = recipients > 0 ? parseFloat(((opens / recipients) * 100).toFixed(2)) : 0;
    const clickRate = recipients > 0 ? parseFloat(((clicks / recipients) * 100).toFixed(2)) : 0;

    let abData: any = {};
    if (body.abResults && body.abResults.hasTest) {
      abData = {
        ab_subject_a: body.abResults.subjectA,
        ab_subject_b: body.abResults.subjectB,
        ab_winner: body.abResults.winner,
        ab_opens_a: body.abResults.opensA,
        ab_opens_b: body.abResults.opensB,
      };
    }

    const result = await sql`
      INSERT INTO campaigns (
        name, send_date, delivered, opened, clicked, bounce, unsubscribed, spam,
        raw_opens, raw_clicks, ab_subject_a, ab_subject_b, ab_winner,
        ab_opened_a, ab_opened_b, ab_opens_a, ab_opens_b, notes
      ) VALUES (
        ${body.name}, ${body.sendDate}, ${recipients}, ${openRate}, ${clickRate},
        ${body.bounce || 0}, ${body.unsubscribed || 0}, ${body.spam || 0},
        ${opens}, ${clicks}, ${abData.ab_subject_a || null}, ${abData.ab_subject_b || null},
        ${abData.ab_winner || null}, ${abData.ab_opened_a || null}, ${abData.ab_opened_b || null},
        ${abData.ab_opens_a || null}, ${abData.ab_opens_b || null}, ${body.notes || null}
      ) RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    const recipients = body.recipients || body.delivered || 0;
    const opens = body.opens || body.rawOpens || 0;
    const clicks = body.clicks || body.rawClicks || 0;
    const openRate = recipients > 0 ? parseFloat(((opens / recipients) * 100).toFixed(2)) : 0;
    const clickRate = recipients > 0 ? parseFloat(((clicks / recipients) * 100).toFixed(2)) : 0;

    let abData: any = {};
    if (body.abResults && body.abResults.hasTest) {
      abData = {
        ab_subject_a: body.abResults.subjectA,
        ab_subject_b: body.abResults.subjectB,
        ab_winner: body.abResults.winner,
        ab_opens_a: body.abResults.opensA,
        ab_opens_b: body.abResults.opensB,
      };
    }

    const result = await sql`
      UPDATE campaigns SET
        name = ${body.name}, send_date = ${body.sendDate}, delivered = ${recipients},
        opened = ${openRate}, clicked = ${clickRate}, bounce = ${body.bounce || 0},
        unsubscribed = ${body.unsubscribed || 0}, spam = ${body.spam || 0},
        raw_opens = ${opens}, raw_clicks = ${clicks},
        ab_subject_a = ${abData.ab_subject_a || null}, ab_subject_b = ${abData.ab_subject_b || null},
        ab_winner = ${abData.ab_winner || null}, ab_opened_a = ${abData.ab_opened_a || null},
        ab_opened_b = ${abData.ab_opened_b || null}, ab_opens_a = ${abData.ab_opens_a || null},
        ab_opens_b = ${abData.ab_opens_b || null}, notes = ${body.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${body.id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({
      error: 'Failed to update campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    const result = await sql`DELETE FROM campaigns WHERE id = ${id}`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({
      error: 'Failed to delete campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
