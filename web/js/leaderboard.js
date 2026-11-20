// Global Firestore leaderboard — mirrors app/src/main/java/.../game/FirestoreLeaderboardRepository.kt
// and Leaderboard.kt (same "scores_yorijorirun" collection, same field names, same qualifying rule),
// so a score set from the web build lands in the same shared leaderboard as the Android app.
//
// The Web app registered in the game's own Firebase project (yorijori-run, separate from Lane
// Dash). These values are public by design — every web page that uses Firebase ships them;
// the leaderboard is protected by firestore.rules, not by hiding this config.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD1lOvE8bhC-Bs6Yq2Dqyss-9h_-LpvbbM',
  authDomain: 'yorijori-run.firebaseapp.com',
  projectId: 'yorijori-run',
  storageBucket: 'yorijori-run.firebasestorage.app',
  messagingSenderId: '992177570584',
  appId: '1:992177570584:web:77dd6428e721287a9b146d',
};

firebase.initializeApp(FIREBASE_CONFIG);
const leaderboardDb = firebase.firestore();
const SCORES_COLLECTION = 'scores_yorijorirun';

async function fetchTopScores(limit = 10) {
  const snapshot = await leaderboardDb.collection(SCORES_COLLECTION)
    .orderBy('score', 'desc')
    .limit(limit)
    .get();
  const entries = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (typeof data.name === 'string' && typeof data.score === 'number') {
      entries.push({ name: data.name, score: data.score });
    }
  });
  return entries;
}

async function submitScore(name, score) {
  const cleanName = name.trim().slice(0, 12) || 'PLAYER';
  await leaderboardDb.collection(SCORES_COLLECTION).add({ name: cleanName, score });
  return cleanName;
}

/** True if `score` would land inside the top `limit` entries — mirrors qualifiesForTop in Leaderboard.kt. */
async function qualifiesForTop(score, limit = 10) {
  const top = await fetchTopScores(limit);
  return top.length < limit || score > top[top.length - 1].score;
}
