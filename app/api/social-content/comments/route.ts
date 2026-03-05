import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET comments for a specific content item, OR batch comment counts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const content_id = searchParams.get('content_id');
  const counts_for = searchParams.get('counts_for'); // e.g. "1,2,3,4"

  // ── Batch counts mode: returns { "1": 3, "4": 1, … } ─────────────────
  if (counts_for) {
    try {
      const ids = counts_for.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      if (ids.length === 0) return NextResponse.json({});

      const result = await sql.query(
        `SELECT content_id, COUNT(*) AS cnt
         FROM content_comments
         WHERE content_id = ANY($1::bigint[])
         GROUP BY content_id`,
        [ids]
      );

      const map: Record<string, number> = {};
      result.rows.forEach((row: any) => {
        map[String(row.content_id)] = parseInt(row.cnt, 10);
      });
      return NextResponse.json(map);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch counts', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  const thread_id = searchParams.get('thread_id');

  // ── Thread-level comments: all posts sharing this thread_id ──────────
  if (thread_id) {
    try {
      // Find all content_ids in this thread + their platforms
      const contentResult = await sql`
        SELECT id, platform FROM social_content WHERE thread_id = ${thread_id}
      `;
      const platformMap: Record<number, string> = {};
      const contentIds: number[] = contentResult.rows.map((r: any) => {
        platformMap[r.id] = r.platform;
        return r.id;
      });

      if (contentIds.length === 0) {
        return NextResponse.json({ comments: [], count: 0 });
      }

      const result = await sql.query(
        `SELECT * FROM content_comments WHERE content_id = ANY($1::bigint[]) ORDER BY created_at ASC`,
        [contentIds]
      );

      const comments = result.rows.map((c: any) => ({ ...c, platform: platformMap[c.content_id] || '' }));
      const commentMap = new Map<number, any>();
      const threadedComments: any[] = [];

      comments.forEach((c: any) => commentMap.set(c.id, { ...c, replies: [] }));
      comments.forEach((c: any) => {
        const node = commentMap.get(c.id)!;
        if (c.parent_comment_id) {
          const parent = commentMap.get(c.parent_comment_id);
          if (parent) parent.replies.push(node);
        } else {
          threadedComments.push(node);
        }
      });

      return NextResponse.json({ comments: threadedComments, count: comments.length });
    } catch (error) {
      console.error('Error fetching thread comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  // ── Single-item threaded comments mode ───────────────────────────────
  if (!content_id) {
    return NextResponse.json(
      { error: 'content_id, thread_id, or counts_for is required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT * FROM content_comments
      WHERE content_id = ${content_id}
      ORDER BY created_at ASC
    `;

    const comments = result.rows;
    const commentMap = new Map();
    const threadedComments: any[] = [];

    comments.forEach((comment: any) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment: any) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        threadedComments.push(commentWithReplies);
      }
    });

    return NextResponse.json({
      comments: threadedComments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content_id,
      author_name,
      comment_text,
      parent_comment_id = null
    } = body;

    if (!content_id || !author_name || !comment_text) {
      return NextResponse.json(
        { error: 'content_id, author_name, and comment_text are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO content_comments (
        content_id, author_name, comment_text, parent_comment_id
      )
      VALUES (
        ${content_id}, ${author_name}, ${comment_text}, ${parent_comment_id}
      )
      RETURNING *
    `;

    const newComment = result.rows[0];

    // ── Notification trigger: Victoria's comments notify Emily ────────────
    if (author_name === 'Victoria') {
      try {
        // Get the content title for a useful notification message
        const contentRes = await sql`
          SELECT content_needs FROM social_content WHERE id = ${content_id} LIMIT 1
        `;
        const title = contentRes.rows[0]?.content_needs
          ? contentRes.rows[0].content_needs.substring(0, 60) + (contentRes.rows[0].content_needs.length > 60 ? '…' : '')
          : `Post #${content_id}`;

        await sql`
          INSERT INTO notifications (type, message, content_id, comment_id, author_name)
          VALUES (
            'comment',
            ${`Victoria commented on "${title}"`},
            ${content_id},
            ${newComment.id},
            'Victoria'
          )
        `;
      } catch (notifError) {
        // Non-fatal — log but don't fail the comment creation
        console.warn('Could not create notification:', notifError);
      }
    }

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: newComment
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update comment (mainly for resolving/unresolving)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, resolved, comment_text } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    let query = 'UPDATE content_comments SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [id];
    let paramIndex = 2;

    if (resolved !== undefined) {
      query += `, resolved = $${paramIndex}`;
      params.push(resolved);
      paramIndex++;
    }

    if (comment_text !== undefined) {
      query += `, comment_text = $${paramIndex}`;
      params.push(comment_text);
      paramIndex++;
    }

    query += ' WHERE id = $1 RETURNING *';

    const result = await sql.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      DELETE FROM content_comments
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
