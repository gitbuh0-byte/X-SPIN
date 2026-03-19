// Test script for sound system
// Add this to browser console to verify audio is working

console.log('=== X-PIN AUDIO SYSTEM TEST ===');

// Test 1: Check if Audio is supported
console.log('✓ Audio API supported:', !!window.Audio);

// Test 2: Test audio sources exist
const audioSources = [
  'https://assets.mixkit.co/active_storage/music/35811/35811-preview.mp3',
  'https://assets.mixkit.co/active_storage/music/48701/48701-preview.mp3',
  'https://assets.mixkit.co/active_storage/music/49219/49219-preview.mp3',
];

console.log('✓ Audio sources configured:', audioSources.length);

// Test 3: Check soundManager
console.log('✓ Sound Manager:', typeof soundManager !== 'undefined' ? 'Available' : 'NOT FOUND');

if (typeof soundManager !== 'undefined') {
  console.log('  - BGM Volume:', (soundManager.getBgmVolume() * 100).toFixed(0) + '%');
  console.log('  - SFX Volume:', (soundManager.getSfxVolume() * 100).toFixed(0) + '%');
  console.log('  - Muted:', soundManager.isMuted());
  console.log('  - BGM Playing:', soundManager.isBgmPlaying());
  
  // Test 4: Try to play BGM
  console.log('\n🎵 ATTEMPTING TO START MUSIC...');
  soundManager.forceBgmStart();
  
  // Give it time to load
  setTimeout(() => {
    console.log('  - BGM Playing now:', soundManager.isBgmPlaying());
    console.log('  - Muted:', soundManager.isMuted());
    if (!soundManager.isBgmPlaying()) {
      console.log('  ⚠️  Music still not playing - check browser console for errors');
    } else {
      console.log('  ✓ Music is PLAYING!');
    }
  }, 500);
}

console.log('\n=== TEST COMPLETE ===');
console.log('To manually test:');
console.log('1. Click anywhere on the page');
console.log('2. Check the speaker icon in the top-right (should be cyan, not red)');
console.log('3. Listen for funky background music');
console.log('4. Open Developer Tools > Console to see debug logs');
