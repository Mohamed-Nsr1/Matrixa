/**
 * HTML Sanitization Utility
 * 
 * Provides server-side HTML sanitization to prevent XSS attacks.
 * Used for sanitizing user-generated HTML content like notes.
 */

import DOMPurify from 'isomorphic-dompurify'

// Allowed HTML tags for rich text content
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'span', 'div',
  'sub', 'sup',
]

// Allowed HTML attributes
const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'class', 'id',
  'dir', 'align',
]

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ADD_ATTR: ['target'], // Allow target="_blank" for links
    FORCE_BODY: true, // Treat input as body content
  }

  return DOMPurify.sanitize(html, config) as string
}

/**
 * Strip all HTML tags and return plain text
 * @param html - The HTML content to strip
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // First sanitize, then strip remaining tags
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
  return sanitized
}

/**
 * Truncate HTML content while preserving valid HTML structure
 * @param html - The HTML content to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated HTML string
 */
export function truncateHtml(html: string, maxLength: number): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Strip HTML to get plain text length
  const plainText = stripHtml(html)
  
  if (plainText.length <= maxLength) {
    return html
  }

  // For truncation, return plain text with ellipsis
  return plainText.substring(0, maxLength) + '...'
}
