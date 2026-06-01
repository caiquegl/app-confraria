export const apiRoutes = {
  admin: {
    bikeCategories: "/admin/bike-categories",
    ridingCompanions: "/admin/riding-companions",
    termsLatest: "/admin/terms/latest",
    tripStyles: "/admin/trip-styles",
  },
  feed: {
    posts: "/feed/posts",
    likedPosts: "/feed/posts/liked",
    post: (postId: string) => `/feed/posts/${postId}`,
    postComments: (postId: string) => `/feed/posts/${postId}/comments`,
    postLike: (postId: string) => `/feed/posts/${postId}/like`,
  },
  notifications: {
    list: "/notifications",
    readAll: "/notifications/read-all",
    unreadCount: "/notifications/unread-count",
  },
  users: {
    checkEmail: (email: string) => `/users/check-email/${encodeURIComponent(email)}`,
    forgotPassword: "/users/forgot-password",
    login: "/users/login",
    register: "/users/register",
    resetPassword: "/users/reset-password",
    verifyResetCode: "/users/verify-reset-code",
  },
} as const;
