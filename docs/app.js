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
System.register("fish", ["pixi.js", "pixi-filters"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var PIXI, filter, TURN_DELTA, Fishies;
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
            TURN_DELTA = 0.005;
            Fishies = class Fishies {
                constructor() {
                    this.view = new PIXI.Sprite();
                    this._fish = new Set();
                    this._width = 0;
                    this._height = 0;
                    this._graphics = new PIXI.Graphics();
                    this.view.addChild(this._graphics);
                    this.view.filters = [
                        new filter.DropShadowFilter({
                            alpha: 1,
                            blur: 8,
                            color: 0x000008,
                            distance: 24,
                            kernels: null,
                            pixelSize: 1,
                            quality: 3,
                            resolution: PIXI.settings.RESOLUTION,
                            rotation: 45,
                            shadowOnly: false
                        })
                    ];
                    //!!!
                    this._fish.add({ x: 600, y: 400, width: 20, length: 120,
                        color: 0x010000,
                        angle: 0, velocity: 0.02,
                        cycle: 0, headAmplitude: 0.8, tailAmplitude: 0.8,
                        angleDelta: 0.001,
                        velocityDelta: 0.00001 });
                }
                get width() { return (this._width); }
                get height() { return (this._height); }
                resize(w, h) {
                    if ((w === this.width) && (h === this.height))
                        return;
                    this._width = w;
                    this._height = h;
                }
                update() {
                    this._graphics.clear();
                    for (const f of this._fish) {
                        this._moveFish(f);
                        this._drawFish(this._graphics, f);
                    }
                }
                _moveFish(f) {
                    const changeFactor = 0.05;
                    const approach = (v, target) => ((v * (1 - changeFactor)) + (target * changeFactor));
                    if (f.angleDelta < -TURN_DELTA) {
                        if (!(f.velocityDelta > 0))
                            f.cycle = approach(f.cycle, 0.25);
                        f.headAmplitude = approach(f.headAmplitude, 4);
                        f.tailAmplitude = approach(f.tailAmplitude, 0);
                    }
                    else if (f.angleDelta > TURN_DELTA) {
                        if (!(f.velocityDelta > 0))
                            f.cycle = approach(f.cycle, 0.75);
                        f.headAmplitude = approach(f.headAmplitude, 4);
                        f.tailAmplitude = approach(f.tailAmplitude, 0);
                    }
                    if (f.velocityDelta > 0) {
                        f.cycle = (f.cycle + f.velocity) % 1;
                        f.headAmplitude = approach(f.headAmplitude, Math.min(f.velocityDelta / 0.001, 1.0));
                        f.tailAmplitude = approach(f.tailAmplitude, f.headAmplitude);
                    }
                    else {
                        f.cycle = (f.cycle + 0.01) % 1;
                        f.headAmplitude = approach(f.headAmplitude, 0.1);
                        f.tailAmplitude = approach(f.tailAmplitude, 0.2);
                    }
                    if (!isNaN(f.angleDelta))
                        f.angle += f.angleDelta;
                    if (!isNaN(f.velocityDelta)) {
                        f.velocity = Math.min(Math.max(0, f.velocity + f.velocityDelta), 0.2);
                    }
                    f.x += f.length * f.velocity * Math.cos(f.angle);
                    f.y += f.length * f.velocity * Math.sin(f.angle);
                    // wrap fish
                    if (f.x <= -this.width * 0.5)
                        f.x += this.width * 2;
                    if (f.y <= -this.height * 0.5)
                        f.y += this.height * 2;
                    if (f.x >= this.width * 1.5)
                        f.x -= this.width * 2;
                    if (f.y >= this.height * 1.5)
                        f.y -= this.height * 2;
                }
                _drawFish(g, f) {
                    const offset = (p, a, len) => ({ x: p.x + (Math.cos(a) * len),
                        y: p.y + (Math.sin(a) * len) });
                    const rightAngle = Math.PI / 2;
                    // set overall parameters
                    const headLen = f.length * 0.3;
                    const tailLen = f.length * 0.7;
                    const tailWidth = f.width * 0.125;
                    const center = offset(f, f.angle + rightAngle, Math.sin(f.cycle * Math.PI * 2) * f.width * 0.2 * f.headAmplitude);
                    const turning = ((f.angleDelta < -TURN_DELTA) ||
                        (f.angleDelta > TURN_DELTA));
                    // compute body bending
                    const bendForCycle = (cycle) => Math.sin(cycle * Math.PI * 2) * 0.2;
                    const bend = bendForCycle(f.cycle);
                    // position head
                    const headAngle = f.angle - (bend * f.headAmplitude);
                    const noseCurve = f.width * 0.3;
                    const nose = offset(center, headAngle, headLen);
                    const noseLeft = offset(nose, headAngle - rightAngle, noseCurve);
                    const noseRight = offset(nose, headAngle + rightAngle, noseCurve);
                    // position midsection
                    const bendFactor = Math.min(Math.abs(bend) / 0.25, 1.0) * 0.25;
                    const midCurve = (headLen + tailLen) * 0.25;
                    const midCurveOuter = midCurve * (0.6 + (bendFactor * 1.75));
                    const midCurveInner = midCurve * (0.6 - bendFactor);
                    const midCurveLeft = bend < 0 ? midCurveOuter : midCurveInner;
                    const midCurveRight = bend > 0 ? midCurveOuter : midCurveInner;
                    const midLeft = offset(center, f.angle - rightAngle, f.width * 0.5);
                    const midRight = offset(center, f.angle + rightAngle, f.width * 0.5);
                    const midLeftFront = offset(midLeft, f.angle, midCurveLeft);
                    const midLeftBack = offset(midLeft, f.angle, -midCurveLeft);
                    const midRightFront = offset(midRight, f.angle, midCurveRight);
                    const midRightBack = offset(midRight, f.angle, -midCurveRight);
                    // position tail
                    const tailAngle = f.angle + Math.PI + (bend * f.tailAmplitude);
                    const tailCurve = tailLen * 0.3;
                    const tailCurveAngle = f.angle - bendForCycle((f.cycle + 0.25) % 1);
                    const tail = offset(center, tailAngle, tailLen);
                    const tailLeft = offset(tail, tailAngle + rightAngle, tailWidth);
                    const tailRight = offset(tail, tailAngle - rightAngle, tailWidth);
                    const tailLeftFront = offset(tailLeft, tailCurveAngle, tailCurve);
                    const tailRightFront = offset(tailRight, tailCurveAngle, tailCurve);
                    const tailLeftBack = offset(tailLeft, tailCurveAngle, -(tailCurve * 0.25));
                    const tailRightBack = offset(tailRight, tailCurveAngle, -(tailCurve * 0.25));
                    // position pectoral fins
                    const pecRadius = f.width * 0.6;
                    const pecCurve = pecRadius * 0.3;
                    const pecLeftAngle = tailCurveAngle - (rightAngle * 1.7);
                    const pecRightAngle = tailCurveAngle + (rightAngle * 1.7);
                    const pecLeft = offset(midLeft, pecLeftAngle, pecRadius);
                    const pecRight = offset(midRight, pecRightAngle, pecRadius);
                    const pecLeftControl = offset(midLeft, f.angle - rightAngle, pecCurve);
                    const pecRightControl = offset(midRight, f.angle + rightAngle, pecCurve);
                    const pecCenter = offset(center, tailAngle, pecRadius * 0.6);
                    // position tail fins
                    const tailfinLen = f.length * 0.25;
                    const tailfinRadius = f.width * 0.6;
                    const tailfinCurve = tailfinLen * 0.6;
                    const tailfinBaseAngle = turning ? tailAngle + bend : headAngle + Math.PI;
                    let tailfinAngle = turning ? tailAngle : f.angle + Math.PI;
                    if (!turning)
                        tailfinAngle += (bendForCycle((f.cycle + 0.2) % 1) * 1.5);
                    const tailfin = offset(tail, tailfinBaseAngle, tailfinLen);
                    const tailfinLeft = offset(tailfin, tailfinAngle + (rightAngle * 0.25), tailfinRadius);
                    const tailfinRight = offset(tailfin, tailfinAngle - (rightAngle * 0.25), tailfinRadius);
                    const tailfinLeftFront = offset(tailfinLeft, tailfinAngle, -tailfinCurve);
                    const tailfinRightFront = offset(tailfinRight, tailfinAngle, -tailfinCurve);
                    const tailfinNotch = offset(tail, tailfinBaseAngle, tailfinLen * 0.5);
                    // draw body
                    g.beginFill(f.color);
                    g.moveTo(nose.x, nose.y);
                    g.bezierCurveTo(noseLeft.x, noseLeft.y, midLeftFront.x, midLeftFront.y, midLeft.x, midLeft.y);
                    g.bezierCurveTo(midLeftBack.x, midLeftBack.y, tailLeftFront.x, tailLeftFront.y, tailLeft.x, tailLeft.y);
                    g.bezierCurveTo(tailLeftBack.x, tailLeftBack.y, tailfinLeftFront.x, tailfinLeftFront.y, tailfinLeft.x, tailfinLeft.y);
                    g.bezierCurveTo(tailfinLeftFront.x, tailfinLeftFront.y, tailfinNotch.x, tailfinNotch.y, tail.x, tail.y);
                    g.bezierCurveTo(tailfinNotch.x, tailfinNotch.y, tailfinRightFront.x, tailfinRightFront.y, tailfinRight.x, tailfinRight.y);
                    g.bezierCurveTo(tailfinRightFront.x, tailfinRightFront.y, tailRightBack.x, tailRightBack.y, tailRight.x, tailRight.y);
                    g.bezierCurveTo(tailRightFront.x, tailRightFront.y, midRightBack.x, midRightBack.y, midRight.x, midRight.y);
                    g.bezierCurveTo(midRightFront.x, midRightFront.y, noseRight.x, noseRight.y, nose.x, nose.y);
                    g.endFill();
                    // draw translucent parts
                    g.beginFill(f.color, 0.75);
                    // tail
                    g.moveTo(tailLeft.x, tailLeft.y);
                    g.bezierCurveTo(tailLeftBack.x, tailLeftBack.y, tailfinLeftFront.x, tailfinLeftFront.y, tailfinLeft.x, tailfinLeft.y);
                    g.lineTo(tailfin.x, tailfin.y);
                    g.lineTo(tailfinRight.x, tailfinRight.y);
                    g.bezierCurveTo(tailfinRightFront.x, tailfinRightFront.y, tailRightBack.x, tailRightBack.y, tailRight.x, tailRight.y);
                    g.lineTo(tailLeft.x, tailLeft.y);
                    // pectoral fins
                    g.moveTo(midLeft.x, midLeft.y);
                    g.quadraticCurveTo(pecLeftControl.x, pecLeftControl.y, pecLeft.x, pecLeft.y);
                    g.lineTo(pecCenter.x, pecCenter.y);
                    g.lineTo(pecRight.x, pecRight.y);
                    g.quadraticCurveTo(pecRightControl.x, pecRightControl.y, midRight.x, midRight.y);
                    g.lineTo(midLeft.x, midLeft.y);
                    g.endFill();
                }
            };
            exports_3("Fishies", Fishies);
        }
    };
});
System.register("ripple", ["pixi.js", "pixi-filters"], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var PIXI, filter, Ripple;
    return {
        setters: [
            function (PIXI_4) {
                PIXI = PIXI_4;
            },
            function (filter_2) {
                filter = filter_2;
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
                            const v = (i % 2 == 0) ? '223' : '32';
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
            exports_4("Ripple", Ripple);
        }
    };
});
System.register("interaction", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var Interaction;
    return {
        setters: [],
        execute: function () {
            Interaction = class Interaction {
                constructor(app) {
                    this.app = app;
                    this._mouseIsDown = false;
                    this._lastDropTime = 0.0;
                    app.stage.interactive = true;
                    app.stage.addListener('mousedown', this.onMouseDown.bind(this));
                    app.stage.addListener('mousemove', this.onMouseMove.bind(this));
                    app.stage.addListener('mouseup', this.onMouseUp.bind(this));
                    app.stage.addListener('click', this.onClick.bind(this));
                }
                onMouseDown(e) {
                    this._mouseIsDown = true;
                }
                onMouseMove(e) {
                    const p = e.data.getLocalPosition(this.app.stage);
                    const now = window.performance.now() / 1000;
                    if (this._mouseIsDown) {
                        const elapsed = now - this._lastDropTime;
                        if (elapsed >= 0.1) {
                            this.app.ripple.disturb(p.x, p.y);
                            this._lastDropTime = now;
                        }
                    }
                }
                onMouseUp(e) {
                    this._mouseIsDown = false;
                }
                onClick(e) {
                    const p = e.data.getLocalPosition(this.app.stage);
                    this.app.ripple.disturb(p.x, p.y);
                }
            };
            exports_5("Interaction", Interaction);
        }
    };
});
System.register("app", ["core", "bottom", "fish", "ripple", "interaction"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var core_1, bottom_1, fish_1, ripple_1, interaction_1, App;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (bottom_1_1) {
                bottom_1 = bottom_1_1;
            },
            function (fish_1_1) {
                fish_1 = fish_1_1;
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
                    this.underwater.addLayer(new fish_1.Fishies());
                    this.addLayer(this.underwater);
                    this.addLayer(this.ripple);
                    this.underwater.view.filters = [this.ripple.filter];
                    this.stage.addChild(this.view);
                }
            };
            exports_6("App", App);
        }
    };
});
System.register("index", ["pixi.js", "app"], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    var PIXI, app_1, renderer, stage, app, container, resizeApp, onReady, counter, onUpdate;
    return {
        setters: [
            function (PIXI_5) {
                PIXI = PIXI_5;
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
