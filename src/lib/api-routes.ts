export const apiRoutes = {
  admin: {
    bikeCategories: "/admin/bike-categories",
    ridingCompanions: "/admin/riding-companions",
    termsLatest: "/admin/terms/latest",
    tripStyles: "/admin/trip-styles",
  },
  chat: {
    conversations: "/chat/conversations",
    conversationRead: (conversationId: string) =>
      `/chat/conversations/${conversationId}/read`,
    messages: (conversationId: string) =>
      `/chat/conversations/${conversationId}/messages`,
    sendMessage: "/chat/messages",
    unreadCount: "/chat/unread-count",
  },
  feed: {
    posts: "/feed/posts",
    likedPosts: "/feed/posts/liked",
    post: (postId: string) => `/feed/posts/${postId}`,
    postComments: (postId: string) => `/feed/posts/${postId}/comments`,
    postComment: (postId: string, commentId: string) =>
      `/feed/posts/${postId}/comments/${commentId}`,
    postCommentLike: (postId: string, commentId: string) =>
      `/feed/posts/${postId}/comments/${commentId}/like`,
    postLike: (postId: string) => `/feed/posts/${postId}/like`,
  },
  notifications: {
    list: "/notifications",
    readAll: "/notifications/read-all",
    unreadCount: "/notifications/unread-count",
  },
  stories: {
    create: "/stories",
    feed: "/stories/feed",
    like: (storyId: string) => `/stories/${storyId}/like`,
    markViewed: (storyId: string) => `/stories/${storyId}/view`,
    userStories: (userId: string) => `/stories/users/${userId}`,
    viewers: (storyId: string) => `/stories/${storyId}/viewers`,
  },
  users: {
    checkEmail: (email: string) => `/users/check-email/${encodeURIComponent(email)}`,
    follow: (userId: string) => `/users/${userId}/follow`,
    forgotPassword: "/users/forgot-password",
    login: "/users/login",
    publicProfile: (userId: string) => `/users/${userId}/public-profile`,
    register: "/users/register",
    resetPassword: "/users/reset-password",
    verifyResetCode: "/users/verify-reset-code",
  },
} as const;
