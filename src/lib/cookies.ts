export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export const COOKIE_CONSENT_KEY = 'infinity-stack-cookie-consent'
export const COOKIE_BANNER_KEY = 'infinity-stack-banner-shown'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent ? JSON.parse(consent) : null
}

export function setCookieConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
  localStorage.setItem(COOKIE_BANNER_KEY, 'true')
  
  // Apply consent settings
  if (!consent.analytics) {
    // Disable analytics cookies
    document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
  
  if (!consent.marketing) {
    // Disable marketing cookies
    document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

export function shouldShowCookieBanner(): boolean {
  if (typeof window === 'undefined') return false
  
  const bannerShown = localStorage.getItem(COOKIE_BANNER_KEY)
  const consent = getCookieConsent()
  
  return !bannerShown && !consent
}

export function acceptAllCookies() {
  setCookieConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true
  })
}

export function acceptNecessaryOnly() {
  setCookieConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  })
}