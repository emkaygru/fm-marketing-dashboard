import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET comments for a specific content item
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const content_id = searchParams.get('content_id');

  if (!content_id) {
    return NextResponse.json(
      { error: 'content_id is required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT * FROM content_comments
      WHERE content_id = ${content_id}
      ORDER BY created_at ASC
    `;

    // Organize comments into threaded structure
    const comments = result.rows;
    const commentMap = new Map();
    const threadedComments: any[] = [];

    // First pass: create map of all comments
    comments.forEach((comment: any) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build threaded structure
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

    // TODO: Send email notification here
    // When implementing email notifications, add logic to send email to:
    // - Emily (all comments)
    // - Ali (comments on her content)
    // - Victoria (when status is ready_for_approval)

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: result.rows[0]
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
