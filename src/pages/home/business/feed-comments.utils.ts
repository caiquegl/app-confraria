import type { FeedComment } from "../types/feed.types";

export type ReplyTarget = {
  parentId: string;
  replyToCommentId: string;
  mentionName?: string;
};

export function buildReplyTarget(
  comment: FeedComment,
  rootCommentId: string,
  depth: number,
): ReplyTarget {
  if (depth === 0) {
    return {
      parentId: comment.id,
      replyToCommentId: comment.id,
    };
  }

  return {
    mentionName: comment.userName,
    parentId: rootCommentId,
    replyToCommentId: comment.id,
  };
}

export function buildReplyText(text: string, mentionName?: string): string {
  const trimmed = text.trim();
  if (!mentionName) return trimmed;

  const mention = `@${mentionName}`;
  if (trimmed.startsWith(mention)) return trimmed;

  return `${mention} ${trimmed}`;
}

export function countFeedComments(comments: FeedComment[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + (comment.replies?.length ?? 0),
    0,
  );
}

export function updateCommentInTree(
  comments: FeedComment[],
  commentId: string,
  updater: (comment: FeedComment) => FeedComment,
): FeedComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updater),
      };
    }

    return comment;
  });
}

export function removeCommentFromTree(
  comments: FeedComment[],
  commentId: string,
): FeedComment[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies
        ? removeCommentFromTree(comment.replies, commentId)
        : undefined,
    }));
}

export function appendReplyToComment(
  comments: FeedComment[],
  parentCommentId: string,
  reply: FeedComment,
): FeedComment[] {
  return comments.map((comment) => {
    if (comment.id === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), reply],
      };
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: appendReplyToComment(comment.replies, parentCommentId, reply),
      };
    }

    return comment;
  });
}
