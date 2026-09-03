/**
 * Google Tag Manager utility functions
 * Use these functions to track custom events in your application
 */

interface DataLayerEvent {
    event: string;
    [key: string]: any;
}

/**
 * Push an event to GTM's dataLayer
 * @param eventData - The event data to push
 */
export const trackEvent = (eventData: DataLayerEvent) => {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push(eventData);
    }
};

/**
 * Track page view
 * @param pagePath - The path of the page
 * @param pageTitle - The title of the page
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
    trackEvent({
        event: "pageview",
        page: pagePath,
        title: pageTitle || document.title,
    });
};

/**
 * Track custom event
 * @param category - Event category (e.g., "engagement", "conversion")
 * @param action - Event action (e.g., "click", "purchase")
 * @param label - Event label (optional)
 * @param value - Event value (optional)
 */
export const trackCustomEvent = (
    category: string,
    action: string,
    label?: string,
    value?: number
) => {
    trackEvent({
        event: "customEvent",
        eventCategory: category,
        eventAction: action,
        ...(label && { eventLabel: label }),
        ...(value && { eventValue: value }),
    });
};

/**
 * Track purchase/conversion
 * @param transactionId - Transaction ID
 * @param amount - Transaction amount
 * @param items - Items purchased
 */
export const trackPurchase = (
    transactionId: string,
    amount: number,
    items?: any[]
) => {
    trackEvent({
        event: "purchase",
        transactionId,
        value: amount,
        currency: "AUD",
        ...(items && { items }),
    });
};

/**
 * Track user signup
 * @param userId - User ID (optional)
 * @param userEmail - User email (optional)
 */
export const trackSignup = (userId?: string, userEmail?: string) => {
    trackEvent({
        event: "sign_up",
        userId,
        userEmail,
    });
};

/**
 * Track login
 * @param userId - User ID (optional)
 */
export const trackLogin = (userId?: string) => {
    trackEvent({
        event: "login",
        userId,
    });
};

/**
 * Declare the dataLayer global
 */
declare global {
    interface Window {
        dataLayer: DataLayerEvent[];
    }
}
