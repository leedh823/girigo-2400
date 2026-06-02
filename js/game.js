/**
 * 기리고 — Web Game
 * Engine: PIXI.js v7  |  Audio: Web Audio API
 */
(function () {
    'use strict';

    // ================================================================
    //  CONSTANTS
    // ================================================================
    const PALETTE = {
        BLACK:      0x000000,
        BLOOD:      0x580000,
        DEEP_RED:   0x8B0000,
        CRIMSON:    0xC41E3A,
        EMBER:      0xFF6B35,
        WARM_WHITE: 0xF5E6D3,
    };

    const rand  = (min, max) => Math.random() * (max - min) + min;
    const randI = (min, max) => Math.floor(rand(min, max + 1));

    // ================================================================
    //  SCREEN MANAGER  (HTML overlay)
    // ================================================================
    class ScreenManager {
        constructor() {
            this.screens  = {};
            this.current  = null;
            this._pending = null;
            document.querySelectorAll('.screen').forEach(el => {
                const name = el.id.replace('screen-', '');
                this.screens[name] = el;
                if (el.classList.contains('active')) this.current = name;
            });
        }

        // clearTimeout guard prevents double-active when called in rapid succession
        show(name, delay = 0) {
            clearTimeout(this._pending);
            const prev = this.current;
            this.current = name;
            if (prev && this.screens[prev]) this.screens[prev].classList.remove('active');
            const target = this.screens[name];
            if (!target) return;
            this._pending = setTimeout(() => target.classList.add('active'), delay);
        }
    }

    // ================================================================
    //  AUDIO MANAGER  (Web Audio API — atmospheric drone)
    // ================================================================
    class AudioManager {
        constructor() {
            this._ctx    = null;
            this._master = null;
            this._nodes  = [];   // stored so stop() can clean them up
            this._ready  = false;
        }

        start() {
            if (this._ready) return;
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
                this._master = this._ctx.createGain();
                this._master.gain.setValueAtTime(0, this._ctx.currentTime);
                this._master.gain.linearRampToValueAtTime(0.12, this._ctx.currentTime + 5);
                this._master.connect(this._ctx.destination);
                this._buildDrones();
                this._ready = true;
            } catch (_) { /* audio not critical */ }
        }

        stop() {
            this._nodes.forEach(n => { try { n.stop(); } catch (_) {} });
            this._nodes = [];
            this._ctx?.close();
            this._ready = false;
        }

        _buildDrones() {
            [[40, 0.55], [80.3, 0.28], [121, 0.12]].forEach(([freq, vol]) => {
                const osc     = this._ctx.createOscillator();
                const gain    = this._ctx.createGain();
                const lfo     = this._ctx.createOscillator();
                const lfoGain = this._ctx.createGain();

                lfo.frequency.value  = 0.08;
                lfoGain.gain.value   = freq * 0.006;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);

                osc.type            = 'sine';
                osc.frequency.value = freq;
                gain.gain.value     = vol;
                osc.connect(gain);
                gain.connect(this._master);

                lfo.start();
                osc.start();
                this._nodes.push(osc, lfo);  // track all nodes for stop()
            });
        }
    }

    // ================================================================
    //  EMBER / ASH PARTICLE
    // ================================================================
    class Ember {
        constructor(container, scatter = false) {
            this.gfx = new PIXI.Graphics();
            container.addChild(this.gfx);
            this._spawn(scatter);
        }

        _spawn(scatter = false) {
            const w = window.innerWidth, h = window.innerHeight;
            this.isAsh     = Math.random() < 0.32;
            this.x         = rand(0, w);
            this.y         = scatter ? rand(0, h) : (this.isAsh ? rand(-60, -10) : h + rand(10, 50));
            this.vx        = rand(-0.45, 0.45);
            this.vy        = this.isAsh ? rand(0.12, 0.5) : rand(-1.2, -0.25);
            this.size      = rand(0.7, this.isAsh ? 2.2 : 2.8);
            this.maxLife   = randI(100, 260);
            this.life      = this.maxLife;
            this.phase     = rand(0, Math.PI * 2);
            this.phaseSpd  = rand(0.028, 0.065);
            this.sway      = rand(0.25, 0.95);
        }

        update() {
            this.phase += this.phaseSpd;
            this.x += this.vx + Math.sin(this.phase) * this.sway;
            this.y += this.vy;
            this.life--;

            const t = Math.max(0, this.life / this.maxLife);
            const alpha = t < 0.25 ? (t / 0.25) * 0.75 : 0.75;
            const color = this.isAsh
                ? PALETTE.DEEP_RED
                : (t > 0.55 ? PALETTE.EMBER : PALETTE.DEEP_RED);

            this.gfx.clear();
            this.gfx.beginFill(color, alpha);
            this.gfx.drawCircle(this.x, this.y, this.size * Math.max(t, 0.25));
            this.gfx.endFill();

            if (!this.isAsh && t > 0.5) {
                this.gfx.beginFill(PALETTE.EMBER, alpha * 0.18);
                this.gfx.drawCircle(this.x, this.y, this.size * 3.5);
                this.gfx.endFill();
            }

            const w = window.innerWidth, h = window.innerHeight;
            const out = this.isAsh
                ? (this.y > h + 30  || this.x < -20 || this.x > w + 20)
                : (this.y < -30     || this.x < -20 || this.x > w + 20);

            if (this.life <= 0 || out) this._spawn();
        }

        destroy() { this.gfx.destroy(); }
    }

    // ================================================================
    //  BLOOD DRIP
    // ================================================================
    class Drip {
        constructor(container) {
            this.gfx = new PIXI.Graphics();
            container.addChild(this.gfx);
            this._reset();
        }

        _reset() {
            this.x      = rand(0, window.innerWidth);
            this.y      = rand(-window.innerHeight * 0.6, -40);
            this.speed  = rand(0.08, 0.32);
            this.len    = rand(40, 130);
            this.alpha  = rand(0.04, 0.13);
            this.thick  = rand(0.5, 1.8);
        }

        update() {
            this.y += this.speed;
            if (this.y > window.innerHeight + 160) this._reset();

            this.gfx.clear();
            this.gfx.lineStyle(this.thick, PALETTE.CRIMSON, this.alpha);
            this.gfx.moveTo(this.x, this.y);
            this.gfx.lineTo(this.x, this.y + this.len);
            this.gfx.lineStyle(0);
            this.gfx.beginFill(PALETTE.CRIMSON, this.alpha * 1.9);
            this.gfx.drawCircle(this.x, this.y + this.len, this.thick * 2);
            this.gfx.endFill();
        }

        destroy() { this.gfx.destroy(); }
    }

    // ================================================================
    //  MOON — drawn at local origin (0,0); positioned dynamically
    //         so window resize is handled automatically in update()
    // ================================================================
    class Moon {
        constructor(stage) {
            this.container = new PIXI.Container();
            stage.addChild(this.container);
            this._time = 0;
            this._build();
        }

        _build() {
            // Radius computed once at init; position is set per-frame in update()
            const r = Math.min(window.innerWidth, window.innerHeight) * 0.135;

            // Outer halos at local origin (0, 0)
            for (let i = 7; i >= 1; i--) {
                const halo = new PIXI.Graphics();
                halo.beginFill(PALETTE.BLOOD, 0.025 + 0.008 * i);
                halo.drawCircle(0, 0, r * (1 + i * 0.28));
                halo.endFill();
                this.container.addChild(halo);
            }

            // Body
            const body = new PIXI.Graphics();
            body.beginFill(PALETTE.BLOOD, 0.88);
            body.drawCircle(0, 0, r);
            body.endFill();
            // Inner highlight
            body.beginFill(PALETTE.DEEP_RED, 0.38);
            body.drawCircle(-r * 0.18, -r * 0.2, r * 0.66);
            body.endFill();
            // Rim
            body.lineStyle(1.2, PALETTE.CRIMSON, 0.25);
            body.drawCircle(0, 0, r);
            this.container.addChild(body);
        }

        update(delta) {
            this._time += delta * 0.016;
            // Re-center every frame — correctly follows any viewport resize
            this.container.x = window.innerWidth  * 0.5;
            this.container.y = window.innerHeight * 0.34;
            this.container.scale.set(1 + Math.sin(this._time * 0.38) * 0.018);
        }
    }

    // ================================================================
    //  BACKGROUND — rebuilt on resize to keep geometry correct
    // ================================================================
    class Background {
        constructor(stage) {
            this._stage     = stage;
            this._container = null;
            this._build();
            window.addEventListener('resize', this._onResize.bind(this));
        }

        _build() {
            const c = new PIXI.Container();
            const w = window.innerWidth, h = window.innerHeight;

            // Base black fill
            const base = new PIXI.Graphics();
            base.beginFill(0x000000);
            base.drawRect(0, 0, w, h);
            base.endFill();
            c.addChild(base);

            // Atmospheric red glow centered on moon position
            const glow = new PIXI.Graphics();
            const cx = w * 0.5, cy = h * 0.34;
            for (let i = 10; i >= 1; i--) {
                glow.beginFill(PALETTE.BLOOD, 0.022 * (1 - i / 10));
                glow.drawCircle(cx, cy, h * 0.95 * (i / 10));
                glow.endFill();
            }
            c.addChild(glow);

            // Subtle horizontal scanlines
            const lines = new PIXI.Graphics();
            lines.lineStyle(1, 0x000000, 0.055);
            for (let y = 0; y < h; y += 3) {
                lines.moveTo(0, y);
                lines.lineTo(w, y);
            }
            c.addChild(lines);

            // Always insert at index 0 so it stays below Moon and scenes
            this._stage.addChildAt(c, 0);
            this._container = c;
        }

        _onResize() {
            if (this._container) {
                this._stage.removeChild(this._container);
                this._container.destroy({ children: true });
                this._container = null;
            }
            this._build();
        }
    }

    // ================================================================
    //  SCENE MANAGER  (PIXI layers)
    //  Each scene is a PIXI.Container added/removed from the stage.
    // ================================================================
    class PixiSceneManager {
        constructor(stage) {
            this._stage   = stage;
            this._scenes  = {};
            this._current = null;
        }

        register(name, container) {
            this._scenes[name] = container;
        }

        switch(name) {
            if (this._current) this._stage.removeChild(this._current);
            this._current = this._scenes[name] ?? null;
            if (this._current) this._stage.addChild(this._current);
        }
    }

    // ================================================================
    //  TITLE SCENE  (PIXI visual layer for the title screen)
    // ================================================================
    class TitleScene {
        constructor() {
            this.container = new PIXI.Container();
            this._drips    = [];
            this._embers   = [];

            const dripLayer  = new PIXI.Container();
            const emberLayer = new PIXI.Container();
            this.container.addChild(dripLayer, emberLayer);

            for (let i = 0; i < 10;  i++) this._drips.push(new Drip(dripLayer));
            for (let i = 0; i < 150; i++) this._embers.push(new Ember(emberLayer, true));
        }

        update() {
            for (const d of this._drips)  d.update();
            for (const e of this._embers) e.update();
        }

        destroy() {
            this._drips  = [];
            this._embers = [];
            // destroy({children:true}) recursively cleans all gfx objects
            this.container.destroy({ children: true });
        }
    }

    // ================================================================
    //  GAME SCENE  (placeholder — populated in future sessions)
    // ================================================================
    class GameScene {
        constructor() {
            this.container = new PIXI.Container();
            // TODO: round logic, player elements, judgment mechanics
        }

        update() {}
        destroy() { this.container.destroy({ children: true }); }
    }

    // ================================================================
    //  MAIN GAME
    // ================================================================
    class Game {
        constructor() {
            this._app         = null;
            this._bg          = null;
            this._screens     = new ScreenManager();
            this._audio       = new AudioManager();
            this._pixiScenes  = null;
            this._moon        = null;
            this._activeScene = null;
            this._state       = 'booting';
            this._boot();
        }

        async _boot() {
            this._app = new PIXI.Application({
                view:            document.getElementById('game-canvas'),
                width:           window.innerWidth,
                height:          window.innerHeight,
                backgroundColor: 0x000000,
                antialias:       true,
                resolution:      Math.min(window.devicePixelRatio || 1, 2),
                autoDensity:     true,
                powerPreference: 'high-performance',
            });

            window.addEventListener('resize', () => {
                this._app.renderer.resize(window.innerWidth, window.innerHeight);
            });

            // Build persistent layers (Background stores itself for resize)
            this._bg   = new Background(this._app.stage);
            this._moon = new Moon(this._app.stage);

            // Pixi scene manager sits above background
            this._pixiScenes = new PixiSceneManager(this._app.stage);

            // Register scenes
            const titleScene = new TitleScene();
            const gameScene  = new GameScene();
            this._pixiScenes.register('title', titleScene.container);
            this._pixiScenes.register('game',  gameScene.container);
            this._titleScene = titleScene;
            this._gameScene  = gameScene;

            // Main loop
            this._app.ticker.add(d => this._tick(d));

            // Load → Title
            await this._runLoadingBar();
            this._enterTitle();
        }

        async _runLoadingBar() {
            const bar   = document.getElementById('loading-bar');
            const steps = [[18,90],[42,120],[67,100],[85,140],[100,220]];
            for (const [pct, delay] of steps) {
                await new Promise(r => setTimeout(r, delay));
                bar.style.width = pct + '%';
            }
            await new Promise(r => setTimeout(r, 520));
        }

        _enterTitle() {
            this._state = 'title';
            this._pixiScenes.switch('title');
            this._screens.show('title', 200);
            this._activeScene = this._titleScene;
            this._bindTitleEvents();
        }

        _enterGame() {
            this._state = 'game';
            this._pixiScenes.switch('game');
            this._screens.show('game', 500);
            this._activeScene = this._gameScene;
        }

        _bindTitleEvents() {
            const start = document.getElementById('btn-start');
            const onStart = () => {
                this._audio.start();
                start.removeEventListener('click', onStart);
                this._enterGame();
            };
            start?.addEventListener('click', onStart);
            // story / settings handlers will be wired up in future sessions
        }

        _tick(delta) {
            if (this._moon)        this._moon.update(delta);
            if (this._activeScene) this._activeScene.update(delta);
        }
    }

    // ================================================================
    //  BOOT
    // ================================================================
    window.addEventListener('load', () => {
        window.GIRIGAME = new Game();
    });

})();
