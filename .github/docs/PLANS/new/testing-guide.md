# Mobile Loading Screen - Testing Guide

## Why the Loading Screen Might Not Appear

The loading screen is designed to show **only once per session** on mobile. If you've already visited the site on mobile, sessionStorage remembers and won't show it again.

## How to Test the Loading Screen

### Method 1: Clear Session Storage (Desktop Browser Testing)

1. **Open the site in your mobile browser**
2. **Open Developer Console** (if available) or **Clear Site Data**:
   - Chrome Mobile: Settings → Site settings → All sites → Find your site → Clear & reset
   - Safari iOS: Settings → Safari → Clear History and Website Data
3. **Refresh the page** - loading screen should appear

### Method 2: Test in Desktop Browser with DevTools

1. Open the site in Chrome/Edge
2. Open DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Select a mobile device (iPhone, Pixel, etc.)
5. **IMPORTANT**: Clear sessionStorage:
   - Go to Application tab → Session Storage → Clear all
   - Or run in console: `sessionStorage.clear()`
6. Refresh the page
7. Loading screen should appear

### Method 3: Force Show Loading Screen (Development Only)

I can add a temporary URL parameter to force the loading screen to show for testing:

Add `?showLoading` to the URL: `http://localhost:5173/?showLoading`

This bypasses the sessionStorage check for testing purposes.

## Expected Behavior

### On Mobile (< 768px width):
1. ✅ Loading screen appears immediately on first visit
2. ✅ Shows butterfly animation with "Exoskeleton" title
3. ✅ Shows "Swipe left or right to navigate" instruction
4. ✅ Animated arrows (← →) demonstrating swipe gesture
5. ✅ "Tap to Begin" button
6. ✅ Auto-dismisses after 5 seconds if not tapped
7. ✅ On dismiss, won't show again in same browser session
8. ✅ Swipe indicator appears for first 3 page navigations

### On Desktop (>= 768px width):
- ❌ Loading screen should NOT appear at all
- ❌ Swipe indicator should NOT appear

## Troubleshooting

### Loading Screen Not Appearing on Mobile?

1. **Check if sessionStorage is set**:
   - The loading screen only shows once per session
   - Close all browser tabs and reopen to start a new session
   - Or clear site data completely

2. **Check viewport width**:
   - Loading screen only shows when viewport < 768px
   - Most phones are < 768px, but tablets in landscape might not be

3. **Check browser compatibility**:
   - sessionStorage must be supported (all modern browsers support it)
   - Check browser console for errors

### Still Not Working?

The loading screen might be working correctly but dismissing too quickly. Try:
- Watching carefully for a brief flash (500ms delay + 400ms fade-out)
- The screen auto-dismisses after 5 seconds

## Quick Test Command

To force the loading screen to show every time (for development), temporarily modify the `useMobileIntroSeen` hook:

```typescript
// In src/hooks/useMobileDetection.ts, temporarily change:
export function useMobileIntroSeen(): [boolean, () => void] {
  // FORCE SHOW: Always return false so loading screen appears
  return [false, () => {}]
  
  // Original code:
  // const [hasSeen, setHasSeen] = useState(false)
  // ...
}
```

This will make the loading screen appear every time you refresh, making it easy to test and refine the design.
