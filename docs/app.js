System.register("core", ["pixi.js"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function isIUpdatable(obj) {
        return ('update' in obj);
    }
    exports_1("isIUpdatable", isIUpdatable);
    function isIResizable(obj) {
        return ('resize' in obj);
    }
    exports_1("isIResizable", isIResizable);
    function isIVisible(obj) {
        return ('view' in obj);
    }
    exports_1("isIVisible", isIVisible);
    var PIXI, Composite, Grid;
    return {
        setters: [
            function (PIXI_1) {
                PIXI = PIXI_1;
            }
        ],
        execute: function () {
            Composite = class Composite {
                constructor() {
                    this.view = new PIXI.Container;
                    this.layers = [];
                    this._width = 0;
                    this._height = 0;
                }
                addLayer(layer) {
                    this.layers.push(layer);
                    if (isIVisible(layer))
                        this.view.addChild(layer.view);
                }
                get width() { return (this._width); }
                get height() { return (this._height); }
                resize(w, h) {
                    if ((w === this._width) && (h === this._height))
                        return;
                    this._width = w;
                    this._height = h;
                    for (const layer of this.layers) {
                        if (isIResizable(layer))
                            layer.resize(w, h);
                        if (isIVisible(layer)) {
                            if (!layer.view.filterArea) {
                                layer.view.filterArea = new PIXI.Rectangle();
                            }
                            layer.view.filterArea.width = w;
                            layer.view.filterArea.height = h;
                        }
                    }
                }
                update() {
                    for (const layer of this.layers) {
                        if (isIUpdatable(layer))
                            layer.update();
                    }
                }
            };
            exports_1("Composite", Composite);
            // for testing visual effects and measurements
            Grid = class Grid {
                constructor(spacing = 16, color = 0xFFFFFF, alpha = 0.25) {
                    this.spacing = spacing;
                    this.color = color;
                    this.alpha = alpha;
                    this._width = 0;
                    this._height = 0;
                    this.view = new PIXI.Sprite();
                    this._graphics = new PIXI.Graphics();
                    this.view.addChild(this._graphics);
                }
                get width() { return (this._width); }
                get height() { return (this._height); }
                resize(w, h) {
                    if ((w === this._width) && (h === this._height))
                        return;
                    this._width = w;
                    this._height = h;
                    this._redraw(this._graphics);
                }
                _redraw(g) {
                    g.clear();
                    g.lineStyle(1, this.color, this.alpha);
                    for (let x = 0; x < this.width; x += this.spacing) {
                        g.moveTo(x, 0);
                        g.lineTo(x, this.height);
                    }
                    for (let y = 0; y < this.height; y += this.spacing) {
                        g.moveTo(0, y);
                        g.lineTo(this.width, y);
                    }
                }
            };
            exports_1("Grid", Grid);
        }
    };
});
System.register("bottom", ["pixi.js"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var PIXI, Bottom;
    return {
        setters: [
            function (PIXI_2) {
                PIXI = PIXI_2;
            }
        ],
        execute: function () {
            Bottom = class Bottom {
                constructor() {
                    this._width = 0;
                    this._height = 0;
                    this.view = new PIXI.Container();
                    this._texture = this._makeTexture(512);
                }
                get width() { return (this._width); }
                get height() { return (this._height); }
                resize(w, h) {
                    if ((w === this.width) && (h === this.height))
                        return;
                    this._width = w;
                    this._height = h;
                    if ((!this._tiling) ||
                        (w > this._tiling.width) || (h > this._tiling.height)) {
                        if (this._tiling)
                            this.view.removeChild(this._tiling);
                        const tw = this._texture.width;
                        const th = this._texture.height;
                        this._tiling = new PIXI.extras.TilingSprite(this._texture, Math.ceil(w / tw) * tw, Math.ceil(h / th) * th);
                        this.view.addChild(this._tiling);
                    }
                }
                _makeTexture(size = 256) {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    const imageData = ctx.getImageData(0, 0, size, size);
                    const pixels = imageData.data;
                    // fill red channel with random data
                    pixels[0] = 128;
                    this._fillSquare(pixels, size, 0, 0, size, size);
                    // transfer red channel to other channels
                    let i = 0;
                    let v;
                    for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                            v = pixels[i] - 128;
                            pixels[i++] = v < 0 ? -v * 0.25 : 0;
                            pixels[i++] = v > 0 ? v * 0.25 : 0;
                            pixels[i++] = 32;
                            pixels[i++] = 32 + Math.abs(v);
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                    return (PIXI.Texture.fromCanvas(canvas));
                }
                _fillSquare(pixels, size, x0, y0, x1, y1) {
                    const idx = (x, y) => ((y % size) * size * 4) + ((x % size) * 4);
                    // exit if size is zero
                    if ((x1 <= x0 + 1) || (y1 <= y0 + 1))
                        return;
                    // sample the corners
                    const tl = pixels[idx(x0, y0)];
                    const tr = pixels[idx(x1, y0)];
                    const bl = pixels[idx(x0, y1)];
                    const br = pixels[idx(x1, y1)];
                    // fill in midpoints
                    const interp = (a, b, w) => ((a * (1 - w)) + (b * w)) + ((Math.random() - 0.5) * 32);
                    const mx = Math.round((x0 + x1) / 2);
                    const my = Math.round((y0 + y1) / 2);
                    const wx = (mx - x0) / (x1 - x0);
                    const wy = (my - y0) / (y1 - y0);
                    const mt = interp(tl, tr, wx);
                    const mb = interp(bl, br, wx);
                    const insert = (x, y, v) => {
                        const i = idx(x, y);
                        if (pixels[i] == 0)
                            pixels[i] = v;
                    };
                    insert(mx, y0, mt);
                    insert(mx, y1, mb);
                    insert(x0, my, interp(tl, bl, wy));
                    insert(x1, my, interp(tr, br, wy));
                    insert(mx, my, interp(mt, mb, wy));
                    // recurse
                    this._fillSquare(pixels, size, x0, y0, mx, my);
                    this._fillSquare(pixels, size, mx, y0, x1, my);
                    this._fillSquare(pixels, size, x0, my, mx, y1);
                    this._fillSquare(pixels, size, mx, my, x1, y1);
                }
            };
            exports_2("Bottom", Bottom);
        }
    };
});
System.register("ripple", ["pixi.js", "pixi-filters"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var PIXI, filter, Ripple;
    return {
        setters: [
            function (PIXI_3) {
                PIXI = PIXI_3;
            },
            function (filter_1) {
                filter = filter_1;
            }
        ],
        execute: function () {
            Ripple = class Ripple {
                constructor() {
                    this._chops = [];
                    this.speed = 256; // pixels per second
                    this.duration = 4; // seconds
                    this._disturbances = new Set();
                    this._canvas = document.createElement('canvas');
                    this._texture = PIXI.Texture.fromCanvas(this._canvas);
                    this.view = new PIXI.Container();
                    // make a sprite to add an illumination effect to the ripples    
                    this.visibleSprite = new PIXI.Sprite(this._texture);
                    this.visibleSprite.alpha = 0.05;
                    this.visibleSprite.filters = [new filter.BlurFilter()];
                    this.visibleSprite.blendMode = PIXI.BLEND_MODES.SCREEN;
                    this.visibleSprite.tint = 0xFFFFCC;
                    // make a sprite to add a refraction effect to the ripples
                    this.filterSprite = new PIXI.Sprite(this._texture);
                    this.view.addChild(this.visibleSprite);
                    this.view.addChild(this.filterSprite);
                    this.filter = new PIXI.filters.DisplacementFilter(this.filterSprite, 32);
                    // make some randomized background chop
                    for (let i = 0; i < 4; i++) {
                        this._chops.push({
                            angle: Math.random() * (Math.PI / 2),
                            amplitude: 0.5 + (Math.random() * 0.5),
                            phase: Math.random(),
                            stops: 16 + Math.ceil(Math.random() * 16)
                        });
                    }
                }
                disturb(x, y) {
                    this._disturbances.add({
                        x, y,
                        t: window.performance.now(),
                        phase: 0.0
                    });
                }
                get width() { return (this._canvas.width); }
                get height() { return (this._canvas.height); }
                resize(w, h) {
                    if ((w === this.width) && (h === this.height))
                        return;
                    this._canvas.width = w;
                    this._canvas.height = h;
                    this.update();
                }
                update() {
                    this._canvas.width = this._canvas.width;
                    this._redraw(this._canvas.getContext('2d'));
                    this._texture.update();
                }
                _redraw(ctx) {
                    const now = window.performance.now();
                    this._drawChop(ctx, now);
                    this._drawDisturbances(ctx, now);
                }
                // draw background chop
                _drawChop(ctx, now) {
                    const cx = this.width / 2;
                    const cy = this.height / 2;
                    const walk = (min, n, max, d) => Math.min(Math.max(min, n + ((Math.random() - 0.5) * d)), max);
                    for (const c of this._chops) {
                        const minRadius = Math.sqrt((cx * cx) + (cy * cy));
                        const diameter = minRadius * 2.5;
                        const phaseShift = diameter * (2 / (c.stops - 1));
                        const dx = Math.cos(c.angle);
                        const dy = Math.sin(c.angle);
                        const p = phaseShift * c.phase;
                        const r1 = minRadius + p;
                        const r2 = diameter - r1;
                        const g = ctx.createLinearGradient(cx - (dx * r1), cy - (dy * r1), cx + (dx * r2), cy + (dy * r2));
                        const amp = c.amplitude * 0.1;
                        for (let i = 0; i < c.stops; i++) {
                            const pos = i / (c.stops - 1);
                            const v = (i % 2 == 0) ? '255' : '0';
                            g.addColorStop(pos, 'rgba(' + v + ', ' + v + ', ' + v + ', ' + amp + ')');
                        }
                        ctx.fillStyle = g;
                        ctx.fillRect(0, 0, this.width, this.height);
                        c.amplitude = walk(0.5, c.amplitude, 1.0, 0.01);
                        c.angle = walk(0, c.angle, Math.PI / 2, 0.02);
                        c.phase = (c.phase + 0.02) % 1.0;
                    }
                }
                // draw disturbances
                _drawDisturbances(ctx, now) {
                    for (const d of this._disturbances) {
                        // compute the current radii of the disturbance
                        const elapsed = (now - d.t) / 1000;
                        const ir = elapsed * (this.speed * 0.3);
                        const or = elapsed * this.speed;
                        const amp = Math.pow(2, Math.max(0.0, 1.0 - (elapsed / this.duration))) / 2;
                        // see if the disturbance is no longer visible
                        const ih = ir / 1.414213562; // half size of square inscribed in inner circle
                        if ((amp < 0.02) ||
                            ((d.x - ih < 0) && (d.x + ih > this.width) &&
                                (d.y - ih < 0) && (d.y + ih > this.height))) {
                            this._disturbances.delete(d);
                            continue;
                        }
                        // draw ripples for the disturbance
                        const g = ctx.createRadialGradient(d.x, d.y, ir, d.x, d.y, or);
                        const peaks = 5;
                        const stops = (peaks * 2) - 1;
                        // move the peaks within the wave packet
                        const phase = d.phase * 2;
                        g.addColorStop(0, 'rgba(0, 0, 0, 0)');
                        for (let i = -1; i < stops + 1; i++) {
                            // compute the peak's position
                            const pos = (i + phase) / (stops + 1);
                            if ((pos <= 0.01) || (pos >= 0.99))
                                continue;
                            // alternate high and low peaks
                            const v = ((i + 2) % 2 == 0) ? '255' : '0';
                            // shape the amplitude of the wave packet into half a sine wave
                            const a = Math.sin(pos * Math.PI) * amp * 0.25;
                            g.addColorStop(pos, 'rgba(' + v + ', ' + v + ', ' + v + ', ' + a + ')');
                        }
                        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                        ctx.fillStyle = g;
                        ctx.fillRect(d.x - or, d.y - or, 2 * or, 2 * or);
                        d.phase = (d.phase + 0.01) % 1;
                    }
                }
            };
            exports_3("Ripple", Ripple);
        }
    };
});
System.register("interaction", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var Interaction;
    return {
        setters: [],
        execute: function () {
            Interaction = class Interaction {
                constructor(app) {
                    this.app = app;
                    this._lastDropTime = 0.0;
                    app.stage.interactive = true;
                    app.stage.addListener('mousedown', this.onMouseDown.bind(this));
                    app.stage.addListener('mousemove', this.onMouseMove.bind(this));
                    app.stage.addListener('mouseup', this.onMouseUp.bind(this));
                    app.stage.addListener('click', this.onClick.bind(this));
                }
                onMouseDown(e) {
                }
                onMouseMove(e) {
                    const p = e.data.getLocalPosition(this.app.stage);
                    const now = window.performance.now() / 1000;
                    const elapsed = now - this._lastDropTime;
                    if (elapsed > 0.25) {
                        this.app.ripple.disturb(p.x, p.y);
                        this._lastDropTime = now;
                    }
                }
                onMouseUp(e) {
                }
                onClick(e) {
                    const p = e.data.getLocalPosition(this.app.stage);
                    this.app.ripple.disturb(p.x, p.y);
                }
            };
            exports_4("Interaction", Interaction);
        }
    };
});
System.register("app", ["core", "bottom", "ripple", "interaction"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var core_1, bottom_1, ripple_1, interaction_1, App;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (bottom_1_1) {
                bottom_1 = bottom_1_1;
            },
            function (ripple_1_1) {
                ripple_1 = ripple_1_1;
            },
            function (interaction_1_1) {
                interaction_1 = interaction_1_1;
            }
        ],
        execute: function () {
            App = class App extends core_1.Composite {
                constructor(stage) {
                    super();
                    this.stage = stage;
                    this.interaction = new interaction_1.Interaction(this);
                    this.ripple = new ripple_1.Ripple();
                    this.underwater = new core_1.Composite();
                    this.underwater.addLayer(new bottom_1.Bottom());
                    //this.underwater.addLayer(new Grid());
                    this.addLayer(this.underwater);
                    this.addLayer(this.ripple);
                    this.underwater.view.filters = [this.ripple.filter];
                    this.stage.addChild(this.view);
                }
            };
            exports_5("App", App);
        }
    };
});
System.register("index", ["pixi.js", "app"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var PIXI, app_1, renderer, stage, app, container, resizeApp, onReady, counter, onUpdate;
    return {
        setters: [
            function (PIXI_4) {
                PIXI = PIXI_4;
            },
            function (app_1_1) {
                app_1 = app_1_1;
            }
        ],
        execute: function () {
            renderer = PIXI.autoDetectRenderer({
                antialias: false,
                backgroundColor: 0x000020
            });
            stage = new PIXI.Container();
            app = new app_1.App(stage);
            // dynamically resize the app to track the size of the browser window
            container = document.getElementById('container');
            container.style.overflow = 'hidden';
            resizeApp = () => {
                const r = container.getBoundingClientRect();
                renderer.resize(r.width, r.height);
                app.resize(r.width, r.height);
            };
            resizeApp();
            window.addEventListener('resize', resizeApp);
            // startup
            onReady = () => {
                // remove the loading animation
                const loading = document.getElementById('loading');
                if (loading) {
                    loading.style.opacity = '0';
                    // clear it from the display list after the animation,
                    //  in case the browser still renders it at zero opacity
                    setTimeout(() => loading.style.display = 'none', 1000);
                }
                // attach the stage to the document and fade it in
                container.appendChild(renderer.view);
                container.style.opacity = '1';
                // start the game loop
                PIXI.ticker.shared.add(onUpdate);
            };
            // game loop
            counter = 0;
            onUpdate = () => {
                if (counter++ % 2 == 0) {
                    app.update();
                    renderer.render(stage);
                }
            };
            onReady();
        }
    };
});
