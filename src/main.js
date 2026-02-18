import './style.css'
import { Game } from './game.js'

// iOS Safari workaround: enables :active pseudo-class on touch
document.addEventListener('touchstart', () => {}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
