# 🎵 Background Music - Troubleshooting Guide

## Quick Fix: Music Not Playing

The background music now requires a **user interaction** before it can play (browser autoplay policy). Here's how to fix it:

### ✅ Steps to Enable Music

1. **Refresh the page**
2. **Click anywhere** on the page (on a button, game mode card, speaker icon, etc.)
3. **Listen for funky music** - it should start automatically after your first click
4. **Check the speaker icon** in the top-right corner:
   - 🔊 **Cyan speaker** = Music is ON ✓
   - 🔇 **Red X speaker** = Music is MUTED

---

## Why This Works

Modern browsers **block audio autoplay** by default for security reasons. The app now:
1. Listens for any user click/keypress
2. On first interaction, enables music playback
3. Resumes music whenever you unmute

---

## Testing the Audio System

### Method 1: Using Browser Console
1. Open the app and refresh the page
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. **Click anywhere on the page** to trigger interaction
5. Paste and run this code:

```javascript
soundManager.forceBgmStart();
console.log('Music playing:', soundManager.isBgmPlaying());
console.log('Muted:', soundManager.isMuted());
console.log('BGM Volume:', (soundManager.getBgmVolume() * 100) + '%');
```

### Method 2: Testing the Speaker Icon
1. **Click the speaker icon** in top-right (if it shows red X)
2. Icon should change to **cyan speaker** 
3. Music should start playing
4. Click again to toggle mute on/off

### Method 3: Testing Volume Control
1. Go to **Dashboard** (click your avatar)
2. Find **Profile** card
3. Click **SETTINGS** button
4. Use **"Background Music"** slider to adjust volume
5. Try different levels:
   - 0% = Silent
   - 25% = Quiet
   - 50% = Normal (DEFAULT)
   - 75% = Loud
   - 100% = Very Loud

---

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| No sound after clicking | Make sure speaker icon is cyan (not red X) |
| Speaker icon is red | Click it to unmute |
| Volume is too low | Go to Settings, increase BGM slider |
| Music was playing, now silent | Check speaker icon - might be muted |
| Same music repeats forever | That's correct - it loops continuously |
| Hear SFX but no BGM | Adjust BGM volume in Settings separately |
| Music very quiet even at 100% | Try clicking speaker icon twice |

---

## Debug Console Commands

**In browser console (F12 → Console tab):**

### Check Status
```javascript
console.log('🎵 Music Status:');
console.log('Playing:', soundManager.isBgmPlaying());
console.log('Muted:', soundManager.isMuted());
console.log('BGM Volume:', (soundManager.getBgmVolume() * 100) + '%');
console.log('SFX Volume:', (soundManager.getSfxVolume() * 100) + '%');
```

### Force Music Start
```javascript
soundManager.forceBgmStart();
console.log('Attempted to start music');
```

### Play Test Sound
```javascript
soundManager.play('click');
console.log('Click sound played');
```

### Mute/Unmute
```javascript
soundManager.toggleMute();
console.log('Mute toggled, now:', soundManager.isMuted());
```

### Set Volume (0-1: 0 is silent, 1 is 100%)
```javascript
soundManager.setBgmVolume(0.5); // 50%
console.log('BGM volume set to 50%');
```

### Stop Music
```javascript
soundManager.stopBgm();
console.log('Music stopped');
```

---

## Audio System Details

### Funky Music URLs (in order of preference)
1. `https://assets.mixkit.co/active_storage/music/35811/35811-preview.mp3` (Primary)
2. `https://assets.mixkit.co/active_storage/music/48701/48701-preview.mp3` (Fallback 1)
3. `https://assets.mixkit.co/active_storage/music/49219/49219-preview.mp3` (Fallback 2)

The system tries each one if previous fails.

### Default Settings
- **BGM Volume**: 50% (was 15%, increased for better hearing)
- **SFX Volume**: 50%
- **Muted**: OFF (music plays by default)
- **Autoplay**: ON (after first user interaction)

---

## Browser Compatibility

✅ **Works in:**
- Chrome/Chromium 69+
- Firefox 25+
- Safari 14+
- Edge 79+
- Opera 56+

⚠️ **Note**: Autoplay requires:
- First user click/interaction
- HTTPS (for production)
- Audio permission (some browsers ask)

---

## Common Issues & Fixes

### Issue: "I only hear click sound, not background music"
**Fix:**
1. Go to Dashboard → Settings
2. Check **Background Music** slider is NOT at 0%
3. Click speaker icon to ensure it's unmuted
4. Refresh page and click something to trigger autoplay

### Issue: "Music is too quiet"
**Fix:**
1. Go to Dashboard → Settings
2. Drag **Background Music** slider to the right (increase volume)
3. Default is 50%, try 70-80% for better hearing
4. Check system volume - not just the app

### Issue: "Music plays then stops"
**Possible causes:**
- You muted it (check speaker icon)
- Browser paused it (click page to resume)
- Network issue (it was streaming, connection dropped)

**Fix:** 
1. Click speaker icon to unmute
2. Refresh the page
3. Click on the page to trigger autoplay

### Issue: "Different music keeps playing"
**Normal behavior** - if first URL fails to load, system tries alternatives. All are funky/upbeat music.

---

## For Developers

### How Autoplay Works
1. **Constructor** runs - sets up audio elements
2. **setupAutoplayListener()** adds event listeners
3. User clicks page → `forceBgmStart()` called
4. `hasInteracted` flag set to true
5. `play('bgm')` executed - music starts
6. Loop continues indefinitely (BGM loops)

### Key Methods
```typescript
soundManager.forceBgmStart()      // Start music after interaction
soundManager.stopBgm()            // Stop music
soundManager.toggleMute()         // Toggle muted state
soundManager.setBgmVolume(vol)    // Set volume (0-1)
soundManager.isBgmPlaying()       // Check if playing
soundManager.isMuted()            // Check if muted
```

### Debugging Steps
1. Open DevTools (F12)
2. Go to Console tab
3. Run: `console.log(soundManager)`
4. Check for any errors in Console
5. Click page
6. Run: `soundManager.forceBgmStart()`
7. Listen for music

---

## Still Not Working?

**Last resort:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear local storage: Go to Console and run: `localStorage.clear()`
3. Close all X-PIN tabs
4. Reopen the app
5. Click immediately
6. Check console for errors

**If still failing:**
- Check if audio URLs are accessible (copy to browser address bar)
- Check network tab in DevTools for failed audio requests
- Try in different browser
- Check if system volume is ON

---

## Expected Behavior

✓ App loads - no music yet (waiting for interaction)
✓ You click anything - music starts automatically
✓ Speaker icon shows cyan playback icon
✓ Funky arkade music plays continuously
✓ Click speaker icon - music mutes (icon turns red)
✓ Click speaker again - music resumes
✓ Go to Settings - adjust volume independently
✓ Settings persist across page refreshes

---

**Last Updated**: March 19, 2026  
**Status**: ✅ All audio systems operational
