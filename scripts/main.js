import { loadPoopHistory, loadPoopHeatmap, logPoopEntry } from './scripts/poop-logs.js';

// scripts/main.js
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("💥 App starting...");
  initAuth();

  // Later we will load other modules here:
  // initPoopLog();
  // initHeatmap();
  // initFacts();
  // initQuiz();
});
