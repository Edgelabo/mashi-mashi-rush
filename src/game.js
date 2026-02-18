import { CallGenerator } from './utils.js';

export class Game {
  constructor() {
    this.score = 0;
    this.timeLeft = 60;
    this.timerInterval = null;
    this.isPlaying = false;
    this.currentOrder = null;
    this.currentInput = {
      yasai: 0,
      ninniku: 0,
      abura: 0
    };
    
    // DOM Elements
    this.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      result: document.getElementById('result-screen'),
      howto: document.getElementById('howto-screen')
    };
    
    this.ui = {
      timer: document.getElementById('timer'),
      score: document.getElementById('score'),
      finalScore: document.getElementById('final-score'),
      callBubble: document.getElementById('call-bubble'),
      customerImg: document.getElementById('customer-img'),
      badges: {
        yasai: document.getElementById('badge-yasai'),
        ninniku: document.getElementById('badge-ninniku'),
        abura: document.getElementById('badge-abura'),
      }
    };
    
    // Audio contexts or placeholders
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Screen Navigation
    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('retry-btn').addEventListener('click', () => this.startGame());
    document.getElementById('share-btn').addEventListener('click', () => this.shareResult());
    document.getElementById('howto-btn').addEventListener('click', () => this.showScreen('howto'));
    document.getElementById('back-from-howto-btn').addEventListener('click', () => this.showScreen('start'));
    
    // Game Controls
    document.querySelectorAll('.topping-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.addTopping(type);
      });
    });

    document.getElementById('reset-btn').addEventListener('click', () => this.resetInput());
    document.getElementById('serve-btn').addEventListener('click', () => this.serveOrder());
    
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });
    this.screens[screenName].classList.remove('hidden');
    this.screens[screenName].classList.add('active');
  }

  startGame() {
    this.score = 0;
    this.timeLeft = 60;
    this.isPlaying = true;
    this.updateUI();
    this.showScreen('game');
    this.nextOrder();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame();
      }
      this.updateUI();
    }, 1000);
  }

  endGame() {
    clearInterval(this.timerInterval);
    this.isPlaying = false;
    this.ui.finalScore.textContent = `${this.score}杯`;
    this.showScreen('result');
  }

  nextOrder() {
    this.currentOrder = CallGenerator.generate();
    this.resetInput();
    this.ui.callBubble.textContent = this.currentOrder.text;
    const n = Math.floor(Math.random() * 5) + 1;
    this.ui.customerImg.style.backgroundImage = `url('/customer_${n}.webp')`;
  }

  resetInput() {
    this.currentInput = { yasai: 0, ninniku: 0, abura: 0 };
    this.updateBadges();
  }

  addTopping(type) {
    if (!this.isPlaying) return;
    this.currentInput[type]++;
    // Cap at 3 (Mashi Mashi)
    if (this.currentInput[type] > 3) this.currentInput[type] = 3;
    this.updateBadges();
  }

  updateBadges() {
    ['yasai', 'ninniku', 'abura'].forEach(type => {
      const dots = this.ui.badges[type].querySelectorAll('.dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < this.currentInput[type]);
      });
    });
  }

  serveOrder() {
    if (!this.isPlaying) return;
    
    if (this.validateOrder()) {
      this.score += 1;
      this.triggerFeedback(true);
    } else {
      this.triggerFeedback(false);
    }
    
    this.nextOrder();
    this.updateUI();
  }

  triggerFeedback(isCorrect) {
    const color = isCorrect ? 'var(--color-accent)' : 'var(--color-secondary)';
    this.ui.score.style.color = color;
    this.ui.score.style.transform = 'scale(1.5)';
    setTimeout(() => {
        this.ui.score.style.color = 'white';
        this.ui.score.style.transform = 'scale(1)';
    }, 300);
    
    // Visual flash on screen
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = isCorrect ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '5';
    document.getElementById('game-screen').appendChild(flash);
    setTimeout(() => flash.remove(), 200);
  }

  validateOrder() {
    return this.currentInput.yasai === this.currentOrder.yasai &&
           this.currentInput.ninniku === this.currentOrder.ninniku &&
           this.currentInput.abura === this.currentOrder.abura;
  }

  updateUI() {
    this.ui.timer.textContent = this.timeLeft;
    this.ui.score.textContent = this.score;
  }

  async shareResult() {
    const text = `マシマシRUSH!!でラーメンを${this.score}杯提供しました！ #マシマシRUSH`;
    try {
      const blob = await this.generateResultImage();
      const file = new File([blob], 'mashi-mashi-result.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        // フォールバック: 画像DL + Twitter を開く
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mashi-mashi-result.png';
        a.click();
        URL.revokeObjectURL(url);
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
      }
    } catch {
      // ユーザーキャンセルなど
    }
  }

  generateResultImage() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      const draw = (ramenImg) => {
        // 背景
        ctx.fillStyle = '#1a1a1d';
        ctx.fillRect(0, 0, 1200, 630);

        // グラデーションアクセント
        const g1 = ctx.createRadialGradient(120, 126, 0, 120, 126, 300);
        g1.addColorStop(0, 'rgba(245,197,66,0.15)');
        g1.addColorStop(1, 'transparent');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, 1200, 630);

        const g2 = ctx.createRadialGradient(1080, 504, 0, 1080, 504, 300);
        g2.addColorStop(0, 'rgba(255,71,87,0.15)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, 1200, 630);

        // ラーメン画像（右側）
        if (ramenImg) {
          ctx.drawImage(ramenImg, 800, 150, 320, 320);
        }

        ctx.textAlign = 'center';

        // タイトル
        ctx.font = "bold 70px 'Zen Dots', cursive";
        ctx.fillStyle = '#f5c542';
        ctx.fillText('マシマシ RUSH!!', 480, 180);

        // スコア
        ctx.font = "bold 150px 'Mochiy Pop One', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${this.score}杯`, 480, 380);

        // サブテキスト
        ctx.font = "48px 'Mochiy Pop One', sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('提供しました！', 480, 460);

        // ハッシュタグ
        ctx.font = "32px 'Mochiy Pop One', sans-serif";
        ctx.fillStyle = '#ff4757';
        ctx.fillText('#マシマシRUSH', 480, 570);

        canvas.toBlob(resolve, 'image/png');
      };

      const ramenImg = new Image();
      ramenImg.onload = () => document.fonts.ready.then(() => draw(ramenImg));
      ramenImg.onerror = () => document.fonts.ready.then(() => draw(null));
      ramenImg.src = '/ramen.webp';
    });
  }
}
