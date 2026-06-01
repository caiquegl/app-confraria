let highlightPostId: string | null = null;

export function setHighlightPostId(postId: string): void {
  highlightPostId = postId;
}

export function consumeHighlightPostId(): string | null {
  const postId = highlightPostId;
  highlightPostId = null;
  return postId;
}
