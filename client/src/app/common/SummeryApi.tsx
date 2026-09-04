


export const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
console.log(baseUrl, "url working ")


export const SummeryApi = {

    verifyEmail: {
        url: "/api/user/verify-email",
        method: "post",
    },
    forgotPassword: {
        url: "/api/user/forgot-password",
        method: "post",
    },
    resetPassword: {
        url: "/api/user/reset-password",
        method: "post",
    },
    changePassword: {
        url: "/api/user/change-password",
        method: "put",
    },
    signup: {
        url: "/api/user/signup",
        method: "post",
    },
    signin: {
        url: "/api/user/signin",
        method: "post"
    },
    refreshToken: {
        url: '/api/user/refresh-token',
        method: 'post'
    },
    getUserDetails: {
        url: "/api/user/get-user-details",
        method: "get",
    },
    signout: {
        url: "/api/user/signout",
        method: "get",
    },
    imageUpload: {
        url: "/api/image/upload",
        method: "post",
    },
    fileUpload: {
        url: "/api/image/upload-file",
        method: "post",
    },
    updateUserDetails: {
        url: "/api/user/update-user",
        method: "put",
    },
    getAllUser: {
        url: "/api/user/all-users",
        method: "get",
    },
    updateUserByAdmin: {
        url: "/api/user/update-user-by-admin",
        method: "put",
    },
    deleteUser: {
        url: "/api/user/delete-user",
        method: "delete",
    },
    fetchProducts: {
        url: "/api/products/all",
        method: "get"
    },
    fetchProductDetails: {
        url: "/api/products/get-details",
        method: "post"
    },
    addProduct: {
        url: "/api/products/create",
        method: "post"
    },
    updateProduct: {
        url: "/api/products/update",
        method: "put"
    },
    deleteProduct: {
        url: "/api/products/delete",
        method: "delete"
    },
    searchProduct: {
        url: "/api/products/search",
        method: "get",  // GET request
    },
    getProductByCategory: {
        url: "/api/products/by-category",
        method: "post",
    },

    fetchCart: {
        url: "/api/cart/get-cart",
        method: "get"
    },
    addCart: {
        url: "/api/cart/add-cart",
        method: "post"
    },
    updateCart: {
        url: "/api/cart/update-cart",
        method: "put"
    },
    deleteCart: {
        url: "/api/cart/delete-cart",
        method: "delete"
    },
    mergeCart: {
        url: "/api/cart/merge-cart",
        method: "post",
    },

    // Orders
    placeOrder: {
        url: "/api/orders/place-order",
        method: "post",
    },
    fetchMyOrders: {
        url: "/api/orders/my-orders",
        method: "get",
    },
    fetchOrderByNumber: {
        url: "/api/orders/lookup",
        method: "get",
    },
    fetchAllOrdersByAdmin: {
        url: "/api/orders/admin/get-all-orders",
        method: "get",
    },
    updateOrderByAdmin: {
        url: "/api/orders/admin/update-order",
        method: "put",
    },
    downloadInvoiceByAdmin: {
        // GET /api/orders/admin/invoice/:orderId — returns the PDF file
        url: "/api/orders/admin/invoice",
        method: "get",
    },

    // ── Team tasks (internal admin board) ──
    listTeamTasks: { url: "/api/team-tasks", method: "get" },
    createTeamTask: { url: "/api/team-tasks", method: "post" },
    acceptTeamTask: { url: "/api/team-tasks/accept", method: "post" },
    updateTeamTask: { url: "/api/team-tasks", method: "put" },
    deleteTeamTask: { url: "/api/team-tasks", method: "delete" },

    // ── Pre-launch waitlist ──
    joinWaitlist: { url: "/api/waitlist", method: "post" },
    listWaitlist: { url: "/api/waitlist", method: "get" },

    // ── Free training sessions ──
    getTrainingSessions: { url: "/api/training-sessions/all", method: "get" },
    registerTrainingSession: { url: "/api/training-sessions/register", method: "post" },
    getAllTrainingSessionsAdmin: { url: "/api/training-sessions/admin/all", method: "get" },
    createTrainingSession: { url: "/api/training-sessions/create", method: "post" },
    updateTrainingSession: { url: "/api/training-sessions/update", method: "put" },
    deleteTrainingSession: { url: "/api/training-sessions/delete", method: "delete" },
    getTrainingSessionRegistrations: { url: "/api/training-sessions/registrations", method: "post" },

    // ── Reddit community feed ──
    getRedditPosts: { url: "/api/reddit-posts/all", method: "get" },
    getAllRedditPostsAdmin: { url: "/api/reddit-posts/admin/all", method: "get" },
    createRedditPost: { url: "/api/reddit-posts/create", method: "post" },
    updateRedditPost: { url: "/api/reddit-posts/update", method: "put" },
    deleteRedditPost: { url: "/api/reddit-posts/delete", method: "delete" },

    // ── FAQs (standalone "Long FAQ" page + per-article embedded FAQ sections) ──
    getFaqs: { url: "/api/faqs", method: "get" },
    getAllFaqsAdmin: { url: "/api/faqs/all", method: "get" },
    createFaq: { url: "/api/faqs/create", method: "post" },
    updateFaq: { url: "/api/faqs/update", method: "put" },
    deleteFaq: { url: "/api/faqs/delete", method: "delete" },

    // ── SC Billing Tracker (admin-only: support coordination plans + time log) ──
    getScPlans: { url: "/api/sc-billing/plans", method: "get" },
    createScPlan: { url: "/api/sc-billing/plans/create", method: "post" },
    updateScPlan: { url: "/api/sc-billing/plans/update", method: "put" },
    deleteScPlan: { url: "/api/sc-billing/plans/delete", method: "delete" },
    getScEntries: { url: "/api/sc-billing/entries", method: "get" },
    createScEntry: { url: "/api/sc-billing/entries/create", method: "post" },
    updateScEntry: { url: "/api/sc-billing/entries/update", method: "put" },
    deleteScEntry: { url: "/api/sc-billing/entries/delete", method: "delete" },

    // ── Retailer/Distributor portal: credit + downloadable resources ──
    getMyCreditStatus: { url: "/api/trade/credit", method: "get" },
    getPortalResources: { url: "/api/portal-resources", method: "get" },
    getAccountManagerContact: { url: "/api/portal-resources/account-manager", method: "get" },
    updateAccountManagerContact: { url: "/api/portal-resources/account-manager", method: "put" },
    getAllPortalResourcesAdmin: { url: "/api/portal-resources/all", method: "get" },
    createPortalResource: { url: "/api/portal-resources/create", method: "post" },
    updatePortalResource: { url: "/api/portal-resources/update", method: "put" },
    deletePortalResource: { url: "/api/portal-resources/delete", method: "delete" },

    // Payment (Stripe)
    createCheckoutSession: {
        url: "/api/payment/create-checkout-session",
        method: "post",
    },

    // review

    getAllReviews: {
        url: "/api/reviews/all-reviews",
        method: "get"
    },
    addReview: {
        url: "/api/reviews/add-review",
        method: "post"
    },
    getProductReviews: {
        url: "/api/reviews/get-reviews",
        method: "post"
    },
    updateReview: {
        url: "/api/review/update-review",
        method: "put"
    },
    deleteReview: {
        url: "/api/review/delete-review",
        method: "delete"
    },

    // testimonials
    getTestimonials: {
        url: "/api/testimonials",
        method: "get",
    },
    getAllTestimonials: {
        url: "/api/testimonials/all",
        method: "get",
    },
    createTestimonial: {
        url: "/api/testimonials/create",
        method: "post",
    },
    updateTestimonial: {
        url: "/api/testimonials/update",
        method: "put",
    },
    deleteTestimonial: {
        url: "/api/testimonials/delete",
        method: "delete",
    },

    // categories
    getAllCategories: {
        url: "/api/categories",
        method: "get"
    },
    createCategory: {
        url: "/api/categories/create",
        method: "post"
    },
    updateCategory: {
        url: "/api/categories/update",
        method: "put"
    },
    getCategoryBySlug: {
        url: "/api/categories/single-category",
        method: "post"
    },
    deleteCategory: {
        url: "/api/categories/delete",
        method: "delete"
    },



    // subcategory

    // fetchSubcategoriesByCategory: {
    //     url: "/api/subcategories/category/subcategories-by-categories",
    //     method: "post",
    // },
    // fetchSubcategoryBySlug: {
    //     url: "/api/subcategories",
    //     method: "get",
    // },
    // createSubcategory: {
    //     url: "/api/subcategories",
    //     method: "post",
    // },
    // updateSubcategory: {
    //     url: "/api/subcategories",
    //     method: "put",
    // },
    // deleteSubcategory: {
    //     url: "/api/subcategories",
    //     method: "delete",
    // },
fetchSubcategoriesByCategory: {
    url: "/api/subcategories/category/subcategories-by-categories",
    method: "post",
},
fetchSubcategoryBySlug: {
    url: "/api/subcategories/subcategory-by-slug",
    method: "get",
},
createSubcategory: {
    url: "/api/subcategories/create",
    method: "post",
},
updateSubcategory: {
    url: "/api/subcategories/update",
    method: "put",
},
deleteSubcategory: {
    url: "/api/subcategories/delete",
    method: "delete",
},

    // SummeryApi additions

    getProductBySubcategory: {
        url: "/api/products/by-subcategory",
        method: "post",
    },

    createProduct: {
        url: "/api/products/create",
        method: "post",
    },

    getAllBlogs: {
        url: "/api/blogs/all",
        method: "get",
    },
    getBlogById: {
        url: "/api/blogs/by-id",
        method: "post",
    },
    getBlogBySlug: {
        url: "/api/blogs/by-slug",
        method: "post",
    },
    createBlog: {
        url: "/api/blogs/create",
        method: "post",
    },
    updateBlog: {
        url: "/api/blogs/update",
        method: "put",
    },
    deleteBlog: {
        url: "/api/blogs/delete",
        method: "delete",
    },

    // ── Bestiee portal: account applications ──
    applyForAccount: { url: "/api/account-applications/apply", method: "post" },
    getMyApplication: { url: "/api/account-applications/me", method: "get" },
    listApplications: { url: "/api/account-applications", method: "get" },
    approveApplication: { url: "/api/account-applications/approve", method: "put" },
    rejectApplication: { url: "/api/account-applications/reject", method: "put" },

    // ── Pricing engine ──
    getPricingSettings: { url: "/api/pricing/settings", method: "get" },
    updatePricingSettings: { url: "/api/pricing/settings", method: "put" },
    listPricingTiers: { url: "/api/pricing/tiers", method: "get" },
    upsertPricingTier: { url: "/api/pricing/tiers", method: "put" },
    deletePricingTier: { url: "/api/pricing/tiers", method: "delete" },
    listPriceOverrides: { url: "/api/pricing/overrides", method: "get" },
    upsertPriceOverride: { url: "/api/pricing/overrides", method: "put" },
    deletePriceOverride: { url: "/api/pricing/overrides", method: "delete" },
    quoteUnitPrice: { url: "/api/pricing/quote", method: "get" },

    // ── NDIS quotes ──
    previewQuote: { url: "/api/quotes/preview", method: "post" },
    createQuote: { url: "/api/quotes", method: "post" },
    getMyQuotes: { url: "/api/quotes", method: "get" },
    duplicateQuote: { url: "/api/quotes/duplicate", method: "post" },
    emailQuote: { url: "/api/quotes/email", method: "post" },
    convertQuoteToOrder: { url: "/api/quotes/convert", method: "post" },

    // ── Enquiries ──
    submitFundingEnquiry: { url: "/api/enquiries/funding", method: "post" },
    submitEnquiry: { url: "/api/enquiries", method: "post" },
    submitMeetingRequest: { url: "/api/enquiries/meeting", method: "post" },
    listEnquiries: { url: "/api/enquiries", method: "get" },
    updateEnquiryStatus: { url: "/api/enquiries/status", method: "put" },

    // ── B2B trade ──
    getTradeCatalogue: { url: "/api/trade/catalogue", method: "get" },
    placeTradeOrder: { url: "/api/trade/order", method: "post" },
    quickReorder: { url: "/api/trade/reorder", method: "post" },
    listStandingOrders: { url: "/api/trade/standing-orders", method: "get" },
    upsertStandingOrder: { url: "/api/trade/standing-orders", method: "put" },

    // ── Consumer subscriptions ──
    listSubscriptions: { url: "/api/subscriptions", method: "get" },
    upsertSubscription: { url: "/api/subscriptions", method: "put" },
    oneClickReorder: { url: "/api/subscriptions/reorder", method: "post" },

    // ── Phase 3: multi-site, negotiated pricing, deeper reporting ──
    listDeliverySites: { url: "/api/phase3/delivery-sites", method: "get" },
    upsertDeliverySite: { url: "/api/phase3/delivery-sites", method: "put" },
    deleteDeliverySite: { url: "/api/phase3/delivery-sites", method: "delete" },
    listNegotiatedPrices: { url: "/api/phase3/negotiated-prices", method: "get" },
    upsertNegotiatedPrice: { url: "/api/phase3/negotiated-prices", method: "put" },
    deleteNegotiatedPrice: { url: "/api/phase3/negotiated-prices", method: "delete" },
    getReport: { url: "/api/phase3/report", method: "get" },

};
