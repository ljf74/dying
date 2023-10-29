import { Assets } from "./assets.js";
import { AudioPlayer } from "./audioplayer.js";
import { Canvas } from "./canvas.js";
import { Keyboard } from "./keyboard.js";
import { Transition } from "./transition.js";
export class CoreEvent {
    constructor(keyboard, audio, canvas, transition, assets, core) {
        this.step = 1.0;
        this.keyboard = keyboard;
        this.audio = audio;
        this.canvas = canvas;
        this.transition = transition;
        this.assets = assets;
        this.core = core;
    }
    get screenWidth() {
        return this.canvas.width;
    }
    get screenHeight() {
        return this.canvas.height;
    }
    changeScene(name, param = 0) {
        this.core.changeScene(name, param);
    }
}
export class Core {
    constructor(canvasWidth, canvasHeight) {
        this.activeScene = undefined;
        this.timeSum = 0.0;
        this.oldTime = 0.0;
        this.assets = new Assets();
        this.canvas = new Canvas(canvasWidth, canvasHeight, true, this.assets);
        this.keyboard = new Keyboard();
        this.audio = new AudioPlayer();
        this.transition = new Transition();
        this.event = new CoreEvent(this.keyboard, this.audio, this.canvas, this.transition, this.assets, this);
        this.scenes = new Map();
    }
    loop(ts) {
        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.event.step;
        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;
        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount--) > 0) {
            if (this.activeScene != undefined &&
                this.assets.hasLoaded()) {
                this.activeScene.update(this.event);
            }
            this.keyboard.update();
            this.transition.update(this.event);
            this.timeSum -= FRAME_WAIT;
        }
        if (!this.assets.hasLoaded()) {
            this.canvas.clear(0);
        }
        else {
            if (this.activeScene != undefined)
                this.activeScene.redraw(this.canvas);
            this.transition.draw(this.canvas);
        }
        window.requestAnimationFrame(ts => this.loop(ts));
    }
    run(initialScene, onstart = () => { }) {
        this.activeScene = this.scenes.get(initialScene);
        if (this.activeScene != undefined) {
            this.activeScene.init(null, this.event);
        }
        onstart(this.event);
        this.loop(0);
    }
    addScene(name, scene) {
        this.scenes.set(name, scene);
        return this;
    }
    changeScene(name, param = 0) {
        let newScene = this.scenes.get(name);
        if (newScene == undefined) {
            throw "No scene with name: " + name;
        }
        newScene.init(param, this.event);
        this.activeScene = newScene;
    }
}
