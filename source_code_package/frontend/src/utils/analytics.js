import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Get auth token from localStorage
const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Track page view event
 * @param {string} page - Page path/name
 * @param {string} pageTitle - Page title
 * @param {string} referrer - Previous page
 */
export const trackPageView = async (page, pageTitle = '', referrer = '') => {
  try {
    const token = getToken();
    if (!token) return; // Only track logged-in users
    
    await axios.post(`${API}/analytics/page-view`, {
      page,
      page_title: pageTitle,
      referrer
    }, { headers: getHeaders() });
  } catch (error) {
    // Silent fail - analytics should not break the app
    console.debug('Analytics tracking failed:', error.message);
  }
};

/**
 * Track user action (click, submit, etc.)
 * @param {string} action - Action type (click, submit, share, etc.)
 * @param {string} element - Element identifier
 * @param {string} page - Current page
 * @param {object} metadata - Additional data
 */
export const trackAction = async (action, element, page = '', metadata = {}) => {
  try {
    const token = getToken();
    if (!token) return;
    
    await axios.post(`${API}/analytics/action`, {
      action,
      element,
      page,
      metadata
    }, { headers: getHeaders() });
  } catch (error) {
    console.debug('Analytics tracking failed:', error.message);
  }
};

/**
 * Track feature usage for personalization
 * @param {string} feature - Feature name (news, astrology, fitness, etc.)
 * @param {string} subFeature - Sub-feature name
 * @param {string} action - Action performed
 * @param {object} metadata - Additional data
 */
export const trackFeature = async (feature, subFeature = '', action = 'view', metadata = {}) => {
  try {
    const token = getToken();
    if (!token) return;
    
    await axios.post(`${API}/analytics/feature`, {
      feature,
      sub_feature: subFeature,
      action,
      metadata
    }, { headers: getHeaders() });
  } catch (error) {
    console.debug('Analytics tracking failed:', error.message);
  }
};

// Pre-defined feature names for consistency
export const FEATURES = {
  NEWS: 'news',
  ASTROLOGY: 'astrology',
  FITNESS: 'fitness',
  ISSUES: 'issues',
  POLLS: 'polls',
  AQI: 'aqi',
  HEALTH: 'health',
  WARD: 'ward',
  TEMPLATES: 'templates',
  CHAT: 'chat',
  PROFILE: 'profile'
};

export const ACTIONS = {
  VIEW: 'view',
  CLICK: 'click',
  SUBMIT: 'submit',
  SHARE: 'share',
  GENERATE: 'generate',
  DOWNLOAD: 'download',
  LIKE: 'like',
  COMMENT: 'comment',
  SEARCH: 'search',
  FILTER: 'filter'
};

export default {
  trackPageView,
  trackAction,
  trackFeature,
  FEATURES,
  ACTIONS
};
