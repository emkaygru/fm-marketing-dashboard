'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Check, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  content_id: number;
  author_name: string;
  comment_text: string;
  resolved: boolean;
  parent_comment_id: number | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

interface CommentThreadProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  contentTitle?: string;
}

export default function CommentThread({ isOpen, onClose, contentId, contentTitle }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('Emily'); // Should come from session/auth
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && contentId) {
      fetchComments();
    }
  }, [isOpen, contentId]);

  const fetchComments = async () => {
    if (!contentId) return;

    try {
      const response = await fetch(`/api/social-content/comments?content_id=${contentId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !contentId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/social-content/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: contentId,
          author_name: authorName,
          comment_text: newComment,
        }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (parentId: number) => {
    if (!replyText.trim() || !contentId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/social-content/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: contentId,
          author_name: authorName,
          comment_text: replyText,
          parent_comment_id: parentId,
        }),
      });

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        await fetchComments();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolved = async (commentId: number, currentResolved: boolean) => {
    try {
      const response = await fetch('/api/social-content/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          resolved: !currentResolved,
        }),
      });

      if (response.ok) {
        await fetchComments();
      }
    } catch (error) {
      console.error('Error toggling resolved:', error);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isUnresolved = !comment.resolved;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div
          className={`p-3 rounded-lg border ${
            isUnresolved
              ? 'bg-orange-50 border-orange-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-medium text-sm text-gray-900">
                {comment.author_name}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-fm-blue hover:text-fm-navy flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
              )}
              <button
                onClick={() => handleToggleResolved(comment.id, comment.resolved)}
                className={`text-xs flex items-center gap-1 ${
                  comment.resolved
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                <Check className="w-3 h-3" />
                {comment.resolved ? 'Resolved' : 'Resolve'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>

          {replyingTo === comment.id && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={loading || !replyText.trim()}
                  className="px-3 py-1 text-xs text-white bg-fm-blue rounded hover:bg-fm-navy disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-fm-blue" />
          <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
          <span className="text-sm text-gray-500">({comments.length})</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {contentTitle && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">{contentTitle}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleAddComment}>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Commenting as:
            </label>
            <select
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
            >
              <option value="Emily">Emily</option>
              <option value="Ali">Ali</option>
              <option value="Victoria">Victoria</option>
            </select>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
