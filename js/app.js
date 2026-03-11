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

        // Particles & Effects
        this.particles = [];
        this.floatingTexts = [];
        this.shakeAmount = 0;
        this.shakeDuration = 0;

        // Game Properties
        this.pipeGap = 160;
        this.pipeWidth = 60;
        this.pipesSpeed = 4;
        this.pipeSpacing = 280;
        this.pipes = [];
        this.coins = [];
        this.nextPipeX = this.canvas.width + 50;
        this.difficultyMultiplier = 1;

        // Image Assets
        this.imagesLoaded = 0;
        this.imagesTotal = 3;
        this.allImagesReady = false;
        this.bgScrollX = 0;

        this.birdImg = new Image();
        this.birdImg.onload = () => this._onImageLoad();
        this.birdImg.onerror = () => this._onImageLoad();
        this.birdImg.src = 'assets/bird-opt.png';

        this.pipeImg = new Image();
        this.pipeImg.onload = () => this._onImageLoad();
        this.pipeImg.onerror = () => this._onImageLoad();
        this.pipeImg.src = 'assets/pipe-opt.png';

        this.bgImg = new Image();
        this.bgImg.onload = () => this._onImageLoad();
        this.bgImg.onerror = () => this._onImageLoad();
        this.bgImg.src = 'assets/bg-opt.jpg';

        this.groundImg = new Image();
        this.groundImgLoaded = false;
        this.groundImg.onload = () => { this.groundImgLoaded = true; };
        this.groundImg.onerror = () => { this.groundImgLoaded = false; };
        this.groundImg.src = 'assets/ground-opt.png';
        this.groundScrollX = 0;

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

    _onImageLoad() {
        this.imagesLoaded++;
        if (this.imagesLoaded >= this.imagesTotal) {
            this.allImagesReady = true;
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

    showMedal(score) {
        const medalDisplay = document.getElementById('medal-display');
        const medalIcon = document.getElementById('medal-icon');
        const medalName = document.getElementById('medal-name');
        if (!medalDisplay) return;

        const medals = [
            { min: 100, icon: '\uD83C\uDFC6', name: 'Platinum', color: '#e5e4e2' },
            { min: 40,  icon: '\uD83E\uDD47', name: 'Gold',     color: '#ffd700' },
            { min: 20,  icon: '\uD83E\uDD48', name: 'Silver',   color: '#c0c0c0' },
            { min: 10,  icon: '\uD83E\uDD49', name: 'Bronze',   color: '#cd7f32' }
        ];

        const medal = medals.find(m => score >= m.min);
        if (medal) {
            medalIcon.textContent = medal.icon;
            medalName.textContent = medal.name;
            medalDisplay.style.borderColor = medal.color;
            medalDisplay.classList.remove('hidden');
            // Trigger confetti on gold medal or higher
            if (score >= 40) {
                this.spawnConfetti();
            }
        } else {
            medalDisplay.classList.add('hidden');
        }
    }

    showNewBest() {
        let el = document.getElementById('new-best-flash');
        if (!el) {
            el = document.createElement('div');
            el.id = 'new-best-flash';
            el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translate(-50%,-50%) scale(0);font-family:var(--heading,"Syne",sans-serif);font-size:32px;font-weight:800;color:#fbbf24;text-shadow:0 0 30px rgba(251,191,36,0.6);pointer-events:none;z-index:200;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s;opacity:0;white-space:nowrap;';
            document.body.appendChild(el);
        }
        el.textContent = 'NEW BEST!';
        el.style.transform = 'translate(-50%,-50%) scale(1.2)';
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.transform = 'translate(-50%,-50%) scale(0.8)';
            el.style.opacity = '0';
        }, 1200);
    }

    spawnConfetti() {
        const colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd'];
        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.style.cssText = `position:fixed;top:-10px;left:${Math.random()*100}%;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'0'};z-index:99999;pointer-events:none;animation:confettiFall ${1.5+Math.random()*2}s linear forwards`;
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 4000);
        }
        if (!document.getElementById('confetti-style')) {
            const s = document.createElement('style');
            s.id = 'confetti-style';
            s.textContent = '@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}';
            document.head.appendChild(s);
        }
    }

    startGame() {
        if (typeof GameAds !== 'undefined') GameAds.removeRewardButton('#gameover-screen');
        this.showScreen('game');
        // Resize canvas AFTER screen is visible (prevents height=0 bug)
        this.resizeCanvas();

        this._newBestShown = false;
        this.score = 0;
        this.level = 1;
        this.difficultyMultiplier = 1;
        this.pipes = [];
        this.coins = [];
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

        // Update particles & effects
        this.updateParticles();
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
                if (typeof Haptic !== 'undefined') Haptic.light();
                this.playSound('score');
                this.spawnScoreParticles(this.bird.x, this.bird.y);
                this.addFloatingText('+1', this.bird.x, this.bird.y - 30);

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

        // Update moving pipes
        for (const pipe of this.pipes) {
            if (pipe.moving) {
                pipe.gapY = pipe.baseGapY + Math.sin(Date.now() / pipe.moveSpeed) * pipe.moveRange;
            }
        }

        // Update coins
        if (this.coins) {
            for (let i = this.coins.length - 1; i >= 0; i--) {
                this.coins[i].x -= speed;
                if (this.coins[i].x < -20) { this.coins.splice(i, 1); continue; }
                const dx = this.bird.x - this.coins[i].x;
                const dy = this.bird.y - this.coins[i].y;
                if (dx * dx + dy * dy < 22 * 22) {
                    this.score += 2;
                    this.playSound('score');
                    if (typeof Haptic !== 'undefined') Haptic.medium();
                    this.addFloatingText('+2', this.coins[i].x, this.coins[i].y - 15);
                    this.spawnScoreParticles(this.coins[i].x, this.coins[i].y);
                    this.coins.splice(i, 1);
                }
            }
        }

        // Generate new pipe when spawn point enters the view
        if (this.nextPipeX < this.canvas.width) {
            const gapY = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
            const isMoving = this.score >= 10 && Math.random() < 0.35;
            this.pipes.push({
                x: this.nextPipeX,
                gapY: gapY,
                baseGapY: gapY,
                scored: false,
                moving: isMoving,
                moveSpeed: 400 + Math.random() * 300,
                moveRange: 20 + Math.random() * 15
            });
            // Spawn coin in gap (40% chance)
            if (Math.random() < 0.4) {
                if (!this.coins) this.coins = [];
                this.coins.push({
                    x: this.nextPipeX + this.pipeWidth / 2,
                    y: gapY + this.pipeGap / 2
                });
            }
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

    spawnScoreParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                radius: 3 + Math.random() * 3,
                color: `hsl(${50 + Math.random() * 30}, 100%, 60%)`
            });
        }
    }

    spawnCollisionParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.02,
                radius: 2 + Math.random() * 4,
                color: `hsl(${0 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`
            });
        }
    }

    addFloatingText(text, x, y) {
        this.floatingTexts.push({ text, x, y, life: 1, decay: 0.02 });
    }

    triggerShake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.vy += 0.1;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 1.5;
            ft.life -= ft.decay;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
        if (this.shakeDuration > 0) {
            this.shakeDuration--;
            if (this.shakeDuration <= 0) this.shakeAmount = 0;
        }
    }

    drawParticles() {
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    drawFloatingTexts() {
        for (const ft of this.floatingTexts) {
            this.ctx.globalAlpha = ft.life;
            this.ctx.fillStyle = '#FFE066';
            this.ctx.font = 'bold 28px -apple-system, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.textAlign = 'start';
        }
        this.ctx.globalAlpha = 1;
    }

    gameOver() {
        if (typeof Haptic !== 'undefined') Haptic.heavy();
        this.state = 'gameover';
        this.playSound('collision');
        this.spawnCollisionParticles(this.bird.x, this.bird.y);
        this.triggerShake(8, 15);

        // Update final scores
        this.finalScoreDisplay.textContent = this.score;
        this.finalBestScoreDisplay.textContent = this.bestScore;

        // Medal system
        this.showMedal(this.score);

        // Check if new record
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.newRecordItem.classList.remove('hidden');
            if (!this._newBestShown) {
                this._newBestShown = true;
                this.showNewBest();
                this.spawnConfetti();
            }
        } else {
            this.newRecordItem.classList.add('hidden');
        }

        if (typeof DailyStreak !== 'undefined') DailyStreak.report(this.score);

        // Track games played and report achievements
        const flappyGamesPlayed = (parseInt(localStorage.getItem('flappy_gamesPlayed')) || 0) + 1;
        localStorage.setItem('flappy_gamesPlayed', flappyGamesPlayed);
        if (typeof GameAchievements !== 'undefined') {
            GameAchievements.report({ bestScore: this.bestScore, gamesPlayed: flappyGamesPlayed });
        }

        const showGameOverAndReward = () => {
            this.showScreen('gameover');
            if (typeof GameAds !== 'undefined') {
                GameAds.injectRewardButton({
                    container: '#gameover-screen',
                    label: 'Watch Ad for 2x Score',
                    onReward: () => {
                        this.score *= 2;
                        this.finalScoreDisplay.textContent = this.score;
                        if (this.score > this.bestScore) {
                            this.bestScore = this.score;
                            this.saveBestScore();
                            this.finalBestScoreDisplay.textContent = this.bestScore;
                        }
                    }
                });
            }
        };

        if (typeof GameAds !== 'undefined') {
            GameAds.showInterstitial({ onComplete: () => showGameOverAndReward() });
        } else {
            showGameOverAndReward();
        }
    }

    draw() {
        this.ctx.save();

        // Screen shake offset
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount;
            const sy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(sx, sy);
        }

        // Background
        if (this.bgImg.complete && this.bgImg.naturalWidth > 0) {
            // Parallax scrolling background
            if (this.state === 'playing' && !this.isPaused) {
                this.bgScrollX -= 0.5;
            }
            const imgW = this.bgImg.naturalWidth;
            const imgH = this.bgImg.naturalHeight;
            const scale = Math.max(this.canvas.width / imgW, this.canvas.height / imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const drawY = (this.canvas.height - drawH) / 2;
            const offset = ((this.bgScrollX % drawW) + drawW) % drawW;
            this.ctx.drawImage(this.bgImg, -offset, drawY, drawW, drawH);
            this.ctx.drawImage(this.bgImg, -offset + drawW, drawY, drawW, drawH);
        } else {
            // Fallback solid dark background
            this.ctx.fillStyle = '#0a0a1a';
            this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);
            this.drawStars();
        }

        // Draw pipes
        this.drawPipes();

        // Draw ground strip (scrolling, faster than bg for parallax)
        if (this.groundImgLoaded && this.groundImg.naturalWidth > 0) {
            const gW = this.groundImg.naturalWidth;
            const gH = 64;
            const groundY = this.canvas.height - gH;
            if (this.state === 'playing' && !this.isPaused) {
                this.groundScrollX -= this.pipesSpeed * this.difficultyMultiplier;
            }
            const offset = ((this.groundScrollX % gW) + gW) % gW;
            for (let tx = -offset; tx < this.canvas.width; tx += gW) {
                this.ctx.drawImage(this.groundImg, tx, groundY, gW, gH);
            }
        }

        // Draw coins with 3D spinning effect
        if (this.coins) {
            const t = Date.now() / 600;
            for (const coin of this.coins) {
                const pulse = Math.sin(t * 2) * 1.5;
                const r = 10 + pulse;
                const spin = Math.cos(t + coin.x * 0.1); // 3D spin factor (-1 to 1)
                const scaleX = Math.abs(spin);

                this.ctx.save();
                this.ctx.translate(coin.x, coin.y);
                this.ctx.scale(scaleX * 0.7 + 0.3, 1); // squash horizontally for spin

                // Glow
                this.ctx.shadowColor = '#fbbf24';
                this.ctx.shadowBlur = 10;

                // Base coin
                const cg = this.ctx.createRadialGradient(-2, -2, 0, 0, 0, r);
                cg.addColorStop(0, '#fff8dc');
                cg.addColorStop(0.4, '#fbbf24');
                cg.addColorStop(1, '#d97706');
                this.ctx.fillStyle = cg;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                this.ctx.fill();

                // Edge ring
                this.ctx.strokeStyle = '#b45309';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();

                // Highlight stripe (moves with spin)
                if (spin > 0) {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    this.ctx.beginPath();
                    this.ctx.arc(spin * 3, -2, r * 0.55, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.shadowBlur = 0;

                // Star icon
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${8 + pulse}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('\u2605', 0, 3);

                this.ctx.restore();
            }
        }

        // Draw bird
        this.drawBird();

        // Draw particles & floating texts
        this.drawParticles();
        this.drawFloatingTexts();

        // Draw score (during gameplay)
        if (this.state === 'playing') {
            this.drawScore();
        }

        this.ctx.restore();
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
        const usePipeImg = this.pipeImg.complete && this.pipeImg.naturalWidth > 0;

        for (const pipe of this.pipes) {
            const w = this.pipeWidth;
            const capH = 20;
            const capExtra = 6;

            if (usePipeImg) {
                const imgW = this.pipeImg.naturalWidth;
                const imgH = this.pipeImg.naturalHeight;

                // Top pipe body — draw image flipped vertically, tile if needed
                const topBodyH = pipe.gapY - capH;
                if (topBodyH > 0) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.rect(pipe.x, 0, w, topBodyH);
                    this.ctx.clip();
                    // Tile pipe texture vertically (flipped for top pipe)
                    this.ctx.translate(pipe.x, topBodyH);
                    this.ctx.scale(1, -1);
                    const scaleX = w / imgW;
                    const tileH = imgH * scaleX;
                    for (let ty = 0; ty < topBodyH; ty += tileH) {
                        this.ctx.drawImage(this.pipeImg, 0, ty, w, tileH);
                    }
                    this.ctx.restore();
                }

                // Top pipe cap
                const capColor = pipe.moving ? '#e74c3c' : '#2ecc71';
                this.ctx.fillStyle = capColor;
                this.ctx.beginPath();
                this.ctx.roundRect(pipe.x - capExtra, pipe.gapY - capH, w + capExtra * 2, capH, [0, 0, 4, 4]);
                this.ctx.fill();

                // Bottom pipe body
                const bottomY = pipe.gapY + this.pipeGap;
                const bottomBodyStart = bottomY + capH;
                const bottomBodyH = this.canvas.height - bottomBodyStart;
                if (bottomBodyH > 0) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.rect(pipe.x, bottomBodyStart, w, bottomBodyH);
                    this.ctx.clip();
                    const scaleX = w / imgW;
                    const tileH = imgH * scaleX;
                    for (let ty = 0; ty < bottomBodyH; ty += tileH) {
                        this.ctx.drawImage(this.pipeImg, pipe.x, bottomBodyStart + ty, w, tileH);
                    }
                    this.ctx.restore();
                }

                // Bottom pipe cap
                this.ctx.fillStyle = capColor;
                this.ctx.beginPath();
                this.ctx.roundRect(pipe.x - capExtra, bottomY, w + capExtra * 2, capH, [4, 4, 0, 0]);
                this.ctx.fill();
            } else {
                // Fallback: canvas-drawn gradient pipes
                const pipeColor1 = pipe.moving ? '#e74c3c' : '#2ecc71';
                const pipeColor2 = pipe.moving ? '#c0392b' : '#27ae60';
                const pipeColor3 = pipe.moving ? '#a93226' : '#1e8449';
                // Top pipe body
                const topGrad = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + w, 0);
                topGrad.addColorStop(0, pipeColor1);
                topGrad.addColorStop(0.5, pipeColor2);
                topGrad.addColorStop(1, pipeColor3);
                this.ctx.fillStyle = topGrad;
                this.ctx.fillRect(pipe.x, 0, w, pipe.gapY - capH);

                // Top pipe cap
                this.ctx.fillStyle = pipeColor1;
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
                this.ctx.fillStyle = pipeColor1;
                this.ctx.beginPath();
                this.ctx.roundRect(pipe.x - capExtra, bottomY, w + capExtra * 2, capH, [4, 4, 0, 0]);
                this.ctx.fill();

                // Bottom pipe highlight
                this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
                this.ctx.fillRect(pipe.x + 4, bottomY + capH, 6, bottomH - capH);
            }
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

        if (this.birdImg.complete && this.birdImg.naturalWidth > 0) {
            // Draw bird sprite centered on origin
            const size = r * 2;
            this.ctx.drawImage(this.birdImg, -size / 2, -size / 2, size, size);
        } else {
            // Fallback: canvas-drawn bird
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
        }

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
    if (typeof GameAds !== 'undefined') GameAds.init();
    if (typeof DailyStreak !== 'undefined') {
      DailyStreak.init({ gameId: 'flappy-bird', bestScoreKey: 'sky-flap-best-score', minTarget: 3 });
    }

    if (typeof GameAchievements !== 'undefined') {
      GameAchievements.init({
        gameId: 'flappy-bird',
        defs: [
          { id: 'score_5', stat: 'bestScore', target: 5, icon: '\uD83D\uDC26', name: 'Fledgling' },
          { id: 'score_15', stat: 'bestScore', target: 15, icon: '\uD83D\uDC26', name: 'Aviator' },
          { id: 'score_30', stat: 'bestScore', target: 30, icon: '\uD83D\uDC26', name: 'Sky Master' },
          { id: 'score_50', stat: 'bestScore', target: 50, icon: '\uD83D\uDC26', name: 'Legend' },
          { id: 'score_100', stat: 'bestScore', target: 100, icon: '\uD83E\uDD85', name: 'Eagle' },
          { id: 'games_10', stat: 'gamesPlayed', target: 10, icon: '\uD83C\uDFAE', name: 'Persistent' },
          { id: 'games_50', stat: 'gamesPlayed', target: 50, icon: '\uD83C\uDFAE', name: 'Dedicated' },
        ]
      });
    }

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
