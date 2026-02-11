// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    });
}

// Sky Flap Game - Main Application
class SkyFlapGame {
    constructor() {
        // Canvas Setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Bird Properties (must be before resizeCanvas which sets bird position)
        this.bird = {
            x: 0,
            y: 0,
            radius: 18,
            velocityY: 0,
            gravity: 0.6,
            flapPower: -12,
            maxVelocity: 15
        };

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game States
        this.state = 'start'; // 'start', 'playing', 'gameover'
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.level = 1;
        this.gameStartTime = 0;
        this.isPaused = false;

        // Game Properties
        this.pipeGap = 160;
        this.pipeWidth = 60;
        this.pipesSpeed = 4;
        this.pipeSpacing = 280;
        this.pipes = [];
        this.nextPipeX = this.canvas.width + 50;
        this.difficultyMultiplier = 1;

        // Audio Context
        this.audioContext = null;
        this.initAudio();

        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.homeBtn = document.getElementById('home-btn');
        this.shareBtn = document.getElementById('share-btn');
        this.currentScoreDisplay = document.getElementById('current-score');
        this.currentLevelDisplay = document.getElementById('current-level');
        this.bestScoreDisplay = document.getElementById('best-score-display');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.finalBestScoreDisplay = document.getElementById('final-best-score');
        this.newRecordItem = document.getElementById('new-record-item');
        this.pauseIndicator = document.getElementById('pause-indicator');
        this.langToggle = document.getElementById('lang-toggle');
        this.langMenu = document.getElementById('lang-menu');

        // Event Listeners
        this.setupEventListeners();

        // Animation Loop
        this.animationId = null;
        this.gameLoop();
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;

        // Adjust bird starting position
        this.bird.x = this.canvas.width * 0.2;
        this.bird.y = this.canvas.height / 2;
    }

    setupEventListeners() {
        // Game Controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());
        this.homeBtn.addEventListener('click', () => this.goHome());
        this.shareBtn.addEventListener('click', () => this.shareResult());

        // Game Input (Bird Control) - only on game canvas area
        const gameCanvas = this.canvas;
        gameCanvas.addEventListener('click', (e) => {
            if (this.state === 'playing' && !this.isPaused) {
                this.flap();
            }
        });

        gameCanvas.addEventListener('touchstart', (e) => {
            if (this.state === 'playing' && !this.isPaused) {
                this.flap();
                e.preventDefault();
            }
        }, { passive: false });

        // Also allow clicking anywhere on game screen (not just canvas)
        this.gameScreen.addEventListener('click', (e) => {
            if (this.state === 'playing' && !this.isPaused && e.target !== gameCanvas) {
                this.flap();
            }
        });

        // Keyboard Control
        document.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && this.state === 'playing') {
                this.flap();
                e.preventDefault();
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });

        // Language Selector
        this.langToggle.addEventListener('click', () => {
            this.langMenu.classList.toggle('hidden');
        });

        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                i18n.setLanguage(lang);
                this.langMenu.classList.add('hidden');
            });
        });

        // Close language menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.language-selector')) {
                this.langMenu.classList.add('hidden');
            }
        });
    }

    initAudio() {
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playSound(type = 'flap') {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        if (type === 'flap') {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'score') {
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'collision') {
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    startGame() {
        this.showScreen('game');
        // Resize canvas AFTER screen is visible (prevents height=0 bug)
        this.resizeCanvas();

        this.score = 0;
        this.level = 1;
        this.difficultyMultiplier = 1;
        this.pipes = [];
        this.nextPipeX = this.canvas.width + 50;
        this.bird.velocityY = 0;
        this.bird.y = this.canvas.height / 2;
        this.bird.x = this.canvas.width * 0.2;
        this.gameStartTime = Date.now();
        this.isPaused = false;
        this.state = 'playing';
    }

    flap() {
        if (this.state === 'playing') {
            this.bird.velocityY = this.bird.flapPower;
            this.playSound('flap');
        }
    }

    togglePause() {
        if (this.state === 'playing') {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.pauseIndicator.classList.add('visible');
            } else {
                this.pauseIndicator.classList.remove('visible');
            }
        }
    }

    goHome() {
        this.state = 'start';
        this.showScreen('start');
        this.updateBestScoreDisplay();
    }

    shareResult() {
        const text = `I scored ${this.score} points on Sky Flap! Can you beat my score? Play now at dopabrain.com/games/sky-flap/`;
        if (navigator.share) {
            navigator.share({
                title: 'Sky Flap',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard!');
            });
        }
    }

    update() {
        if (this.state !== 'playing' || this.isPaused) return;

        // Update Bird Physics
        this.bird.velocityY += this.bird.gravity;
        this.bird.velocityY = Math.min(this.bird.velocityY, this.bird.maxVelocity);
        this.bird.y += this.bird.velocityY;

        // Update Pipes
        this.updatePipes();

        // Collision Detection
        this.checkCollisions();

        // Update Score Display
        this.currentScoreDisplay.textContent = this.score;
        this.currentLevelDisplay.textContent = this.level;

        // Update Difficulty
        this.updateDifficulty();
    }

    updatePipes() {
        const speed = this.pipesSpeed * this.difficultyMultiplier;

        // Move existing pipes left
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= speed;

            // Check if pipe has passed the bird (score point)
            if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
                this.pipes[i].scored = true;
                this.score++;
                this.playSound('score');

                if (this.score % 5 === 0) {
                    this.showInterstitialAd();
                }
            }

            // Remove pipes that are off-screen
            if (this.pipes[i].x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Scroll spawn point left with the world
        this.nextPipeX -= speed;

        // Generate new pipe when spawn point enters the view
        if (this.nextPipeX < this.canvas.width) {
            const gapY = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
            this.pipes.push({
                x: this.nextPipeX,
                gapY: gapY,
                scored: false
            });
            this.nextPipeX += this.pipeSpacing;
        }
    }

    updateDifficulty() {
        // Increase difficulty every 5 points
        const newLevel = Math.floor(this.score / 5) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.difficultyMultiplier = 1 + (this.level - 1) * 0.1;
            this.pipeGap = Math.max(130, 160 - (this.level - 1) * 5);
        }
    }

    checkCollisions() {
        // Top and bottom boundaries
        if (this.bird.y - this.bird.radius <= 0 ||
            this.bird.y + this.bird.radius >= this.canvas.height) {
            this.gameOver();
            return;
        }

        // Pipe collisions
        for (const pipe of this.pipes) {
            // Top pipe
            if (this.bird.x + this.bird.radius > pipe.x &&
                this.bird.x - this.bird.radius < pipe.x + this.pipeWidth &&
                this.bird.y - this.bird.radius < pipe.gapY) {
                this.gameOver();
                return;
            }

            // Bottom pipe
            if (this.bird.x + this.bird.radius > pipe.x &&
                this.bird.x - this.bird.radius < pipe.x + this.pipeWidth &&
                this.bird.y + this.bird.radius > pipe.gapY + this.pipeGap) {
                this.gameOver();
                return;
            }
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.playSound('collision');

        // Update final scores
        this.finalScoreDisplay.textContent = this.score;
        this.finalBestScoreDisplay.textContent = this.bestScore;

        // Check if new record
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.newRecordItem.classList.remove('hidden');
        } else {
            this.newRecordItem.classList.add('hidden');
        }

        this.showScreen('gameover');
    }

    draw() {
        // Solid dark background
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Subtle star particles
        this.drawStars();

        // Draw pipes
        this.drawPipes();

        // Draw bird
        this.drawBird();

        // Draw score (during gameplay)
        if (this.state === 'playing') {
            this.drawScore();
        }
    }

    drawStars() {
        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 60; i++) {
                this._stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    r: Math.random() * 1.5 + 0.5,
                    a: Math.random() * 0.5 + 0.1
                });
            }
        }
        this._stars.forEach(s => {
            this.ctx.fillStyle = `rgba(255,255,255,${s.a})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPipes() {
        for (const pipe of this.pipes) {
            const w = this.pipeWidth;
            const capH = 20;
            const capExtra = 6;

            // Top pipe body
            const topGrad = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + w, 0);
            topGrad.addColorStop(0, '#2ecc71');
            topGrad.addColorStop(0.5, '#27ae60');
            topGrad.addColorStop(1, '#1e8449');
            this.ctx.fillStyle = topGrad;
            this.ctx.fillRect(pipe.x, 0, w, pipe.gapY - capH);

            // Top pipe cap
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.beginPath();
            this.ctx.roundRect(pipe.x - capExtra, pipe.gapY - capH, w + capExtra * 2, capH, [0, 0, 4, 4]);
            this.ctx.fill();

            // Top pipe highlight
            this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.ctx.fillRect(pipe.x + 4, 0, 6, pipe.gapY - capH);

            // Bottom pipe
            const bottomY = pipe.gapY + this.pipeGap;
            const bottomH = this.canvas.height - bottomY;
            this.ctx.fillStyle = topGrad;
            this.ctx.fillRect(pipe.x, bottomY + capH, w, bottomH - capH);

            // Bottom pipe cap
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.beginPath();
            this.ctx.roundRect(pipe.x - capExtra, bottomY, w + capExtra * 2, capH, [4, 4, 0, 0]);
            this.ctx.fill();

            // Bottom pipe highlight
            this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.ctx.fillRect(pipe.x + 4, bottomY + capH, 6, bottomH - capH);
        }
    }

    drawBird() {
        const x = this.bird.x;
        const y = this.bird.y;
        const r = this.bird.radius;

        this.ctx.save();
        this.ctx.translate(x, y);

        // Tilt based on velocity
        const tilt = Math.max(-0.5, Math.min(0.5, this.bird.velocityY * 0.04));
        this.ctx.rotate(tilt);

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(2, 3, r, r * 0.85, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        const bodyGrad = this.ctx.createRadialGradient(-3, -3, 0, 0, 0, r);
        bodyGrad.addColorStop(0, '#FFE066');
        bodyGrad.addColorStop(1, '#F0A500');
        this.ctx.fillStyle = bodyGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing
        const wingY = Math.sin(Date.now() * 0.01) * 3;
        this.ctx.fillStyle = '#E8920B';
        this.ctx.beginPath();
        this.ctx.ellipse(-r * 0.4, wingY, r * 0.55, r * 0.35, -0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye white
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(r * 0.3, -r * 0.2, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil
        this.ctx.fillStyle = '#111';
        this.ctx.beginPath();
        this.ctx.arc(r * 0.38, -r * 0.15, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.beginPath();
        this.ctx.moveTo(r * 0.7, 0);
        this.ctx.lineTo(r * 1.3, -r * 0.15);
        this.ctx.lineTo(r * 1.3, r * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawScore() {
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.font = 'bold 48px -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(this.score, this.canvas.width / 2, 60);
        this.ctx.fillText(this.score, this.canvas.width / 2, 60);
        this.ctx.textAlign = 'start';
    }

    showScreen(screenName) {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.gameoverScreen.classList.remove('active');

        if (screenName === 'start') {
            this.startScreen.classList.add('active');
        } else if (screenName === 'game') {
            this.gameScreen.classList.add('active');
            this.pauseIndicator.classList.remove('visible');
        } else if (screenName === 'gameover') {
            this.gameoverScreen.classList.add('active');
        }
    }

    showInterstitialAd() {
        // In production, this would trigger AdSense interstitial ad
        console.log('Interstitial ad would show here (every 5 points)');
    }

    updateBestScoreDisplay() {
        this.bestScoreDisplay.textContent = this.bestScore;
    }

    loadBestScore() {
        const saved = localStorage.getItem('sky-flap-best-score');
        return saved ? parseInt(saved) : 0;
    }

    saveBestScore() {
        localStorage.setItem('sky-flap-best-score', this.bestScore);
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready (await i18n first)
let game;

async function initApp() {
    // Initialize i18n before creating the game so translations are loaded
    try {
        if (window.i18n && window.i18n.initialize) {
            await window.i18n.initialize();
        }
    } catch (e) {
        console.warn('i18n init failed, continuing without translations:', e);
    }

    game = new SkyFlapGame();
    initSoundToggle();

    // Hide loader if present
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 300);
    }
}

// Failsafe: hide loader after 5s even if init stalls
setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 300);
    }
}, 5000);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initApp());
} else {
    initApp();
}

// Sound toggle functionality
function initSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (!btn || !window.sfx) return;

    btn.textContent = window.sfx.enabled ? '🔊' : '🔇';
    btn.addEventListener('click', () => {
        window.sfx.toggle();
        btn.textContent = window.sfx.enabled ? '🔊' : '🔇';
    });
}
