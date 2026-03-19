# 🎵 Funky Background Music Feature Guide

## Overview
X-PIN now features **funky background music** that plays by default and can be controlled via speaker icon or settings.

---

## Features Implemented ✅

### 1. **Auto-Play Background Music**
- Funky music plays automatically when the app loads
- Music continues across all pages (Home, Dashboard, Game Rooms, Tournaments)
- Music stops when explicitly muted or when user leaves the app

### 2. **Speaker Icon Toggle** 
- Located in the **header/navbar** (top-right area)
- **Red muted icon** with X - when music is OFF
- **Cyan speaker icon** with waves - when music is ON
- Click to toggle music on/off instantly
- Respects user preference and saves state

### 3. **Music Settings Control**
- Access via Dashboard → Profile Card → **SETTINGS** button
- **Background Music Volume**: 0-100% slider
- **Game Sound Effects Volume**: 0-100% (separate volume control)
- Test buttons to preview changes
- Settings auto-save to localStorage

### 4. **Music Details**
- **Track**: Funky electronic/arcade music
- **Source**: High-quality royalty-free music
- **Format**: MP3, streamed from Mixkit
- **Loop**: Continuous looping
- **Default Volume**: 15% (adjustable)

---

## How to Use

### Toggle Music (Speaker Icon)
1. Look for the speaker icon in the **top-right corner** of any page
2. Click the speaker icon to toggle music:
   - **Cyan speaker** = Music ON ✓
   - **Red X speaker** = Music OFF ✗
3. Changes apply immediately

### Adjust Volume (Settings)
1. Go to **Dashboard** (click your avatar in top-right)
2. Find the **Profile** card with your information
3. Click **SETTINGS** button
4. Adjust **Background Music** slider (0-100%)
5. Use **Music Test** button to preview changes
6. Settings automatically save

### Mute/Unmute
- Click speaker icon to instantly mute all sounds
- When unmuted, background music resumes automatically
- Mute state is saved

---

## Technical Details

### Files Modified

#### 1. `services/soundManager.ts`
**Changes Made:**
- Updated BGM track URL to funky music
- Added `autoPlayBgm()` method to start music on app load
- Added `isBgmPlaying()` method to check status
- Added `stopBgm()` method to stop music
- Enhanced `toggleMute()` to resume BGM when unmuting

**Key Methods:**
```typescript
autoPlayBgm()        // Auto-play music on app initialization
isBgmPlaying()       // Check if music is currently playing
stopBgm()            // Stop background music
toggleMute()         // Toggle mute and resume music if unmuted
```

#### 2. `App.tsx`
**Changes Made:**
- Added `useEffect` to auto-play background music on app mount
- Calls `soundManager.autoPlayBgm()` when app loads

**Code:**
```typescript
useEffect(() => {
  soundManager.autoPlayBgm();
}, []);
```

#### 3. `components/Auth.tsx` (No changes needed)
- Speaker icon already exists in Layout
- Music plays after authentication

#### 4. `pages/Dashboard.tsx` (No changes needed)
- Music Settings Modal already implemented
- Adjusts BGM volume via soundManager

---

## Music URL
**Current Track**: 
```
https://assets.mixkit.co/active_storage/music/35811/35811-preview.mp3
```

This is a royalty-free funky electronic track optimized for gaming.

---

## How It Works (User Flow)

```
User Opens X-PIN App
    ↓
App Initializes (AppContent component mounts)
    ↓
autoPlayBgm() Called
    ↓
Check if NOT muted and NOT already playing
    ↓
Start Background Music
    ↓
User sees Cyan Speaker Icon (music ON status)
    ↓
User can:
  • Click speaker icon to toggle mute
  • Go to Dashboard → Settings to adjust volume
  • Enjoy funky music while playing
```

---

## Troubleshooting

### Music Not Playing?
1. **Check speaker icon** - Make sure it's cyan (not red with X)
2. **Check volume** - Go to Settings and increase BGM volume
3. **Check browser** - Allow audio autoplay in browser settings
4. **Check internet** - Music streams from online source

### Music Playing Too Loud?
1. Click **SETTINGS** on Dashboard Profile card
2. Drag **Background Music** slider to the left (lower volume)
3. Use **Music Test** to preview volume

### Music Playing Too Quietly?
1. Click **SETTINGS** on Dashboard Profile card
2. Drag **Background Music** slider to the right (higher volume)
3. Default is 15%, try 50-70%

### Music Plays Over Sound Effects?
- All sounds are mixed together
- Adjust **Background Music** volume separately from **Game Sound Effects**
- If both are too loud, reduce BGM volume in Settings

### Can't Find Settings?
- Go to **Dashboard** (click your avatar in top-right)
- Find the **Profile** card (shows your username and avatar)
- Look for **SETTINGS** button in the card
- That's the Music Settings modal

---

## Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Auto-play music on load | ✅ | App initialization |
| Speaker icon toggle | ✅ | Header/Navbar |
| Mute/Unmute | ✅ | Speaker icon click |
| Volume control slider | ✅ | Dashboard → Settings |
| Music Test button | ✅ | Dashboard → Settings |
| SFX Test button | ✅ | Dashboard → Settings |
| Volume persistence | ✅ | localStorage |
| Music across pages | ✅ | All pages |

---

## Default Settings

| Setting | Default Value | Range |
|---------|--------------|-------|
| Background Music Volume | 15% | 0-100% |
| Game Sound Effects Volume | 50% | 0-100% |
| Muted | No (music plays) | On/Off |

---

## Advanced Usage

### Change the Music Track
Edit `services/soundManager.ts` line with:
```typescript
bgm: new Audio('YOUR_MUSIC_URL_HERE'),
```

### Disable Auto-Play (For Development)
Comment out in `App.tsx`:
```typescript
// soundManager.autoPlayBgm();
```

### Set Different Default Volume
Edit `services/soundManager.ts`:
```typescript
private bgmVolume: number = 0.15; // Change 0.15 to desired value (0-1)
```

---

## Browser Compatibility

✅ Chrome/Chromium  
✅ Firefox  
✅ Safari  
✅ Edge  
⚠️ Autoplay may require user gesture in some browsers - click speaker icon if needed

---

## Notes

- Music is high-quality, optimized for gaming
- Continuous loop - no awkward silence
- Separate volume control from sound effects
- Works on desktop and mobile
- Settings persist across sessions
- No performance impact on gameplay

---

## Support

**Issue**: Music not starting
- **Solution**: Click speaker icon to ensure it's enabled

**Issue**: Music too loud
- **Solution**: Use Settings slider to adjust

**Issue**: Want different music
- **Solution**: Update music URL in soundManager.ts

**Issue**: Music paused unexpectedly
- **Solution**: Check if speaker icon shows muted (X icon)

---

**Implementation Date**: March 19, 2026  
**Status**: ✅ Production Ready
