import { createBackgroundBitmap } from "./background.js";
import { generateFont, generateRGB222LookupTable } from "./bitmapgen.js";
import { Core } from "./core.js";
import { Game } from "./game.js";
import { PALETTE1 } from "./palettedata.js";
import { StartIntro } from "./startintro.js";
import { StartScreen } from "./startscreen.js";
import { StoryScreen } from "./storyscreen.js";
import { TitleScreen } from "./titlescreen.js";
const constructSamples = (event) => {
    event.assets.addSample("die", event.audio.createSample([[192, 4], [144, 8], [128, 12]], 0.70, "square", 2 /* Ramp.Exponential */, 0.20));
    event.assets.addSample("climb", event.audio.createSample([[160, 4]], 0.70, "square", 0 /* Ramp.Instant */));
    event.assets.addSample("toggle1", event.audio.createSample([[160, 4], [192, 12]], 0.70, "square", 0 /* Ramp.Instant */, 0.35));
    event.assets.addSample("toggle2", event.audio.createSample([[192, 4], [160, 12]], 0.70, "square", 0 /* Ramp.Instant */, 0.35));
    event.assets.addSample("rumble", event.audio.createSample([[224, 4], [160, 4], [192, 4], [160, 4], [128, 12]], 0.80, "sawtooth", 1 /* Ramp.Linear */, 0.20));
    event.assets.addSample("boulder", event.audio.createSample([[144, 8]], 1.0, "triangle", 2 /* Ramp.Exponential */, 0.20));
    event.assets.addSample("victory", event.audio.createSample([[128, 12], [144, 12], [160, 12], [176, 12], [192, 12], [208, 60]], 0.60, "sawtooth", 0 /* Ramp.Instant */, 0.10));
    event.assets.addSample("choose", event.audio.createSample([[160, 6]], 0.70, "square", 0 /* Ramp.Instant */));
    event.assets.addSample("select", event.audio.createSample([[192, 10]], 0.70, "square", 0 /* Ramp.Instant */, 0.30));
    event.assets.addSample("pause", event.audio.createSample([[128, 4], [144, 6]], 0.70, "square", 2 /* Ramp.Exponential */));
};
const constructBitmaps = (event) => {
    let lookup = generateRGB222LookupTable();
    event.assets.addBitmap("background", createBackgroundBitmap(event.assets, 160, 160, 8));
    event.assets.addBitmap("fontBig", generateFont("bold 24px Arial", 32, 32, 2, 8, 127, [170, 255, 0], true));
    event.assets.loadBitmapRGB222("base", "b.png", lookup, PALETTE1);
    event.assets.loadBitmapRGB222("font", "f.png", lookup, (new Array(16 * 6)).fill([-1, 0, 0, 0b111111]));
    event.assets.loadBitmapRGB222("fontYellow", "f.png", lookup, (new Array(16 * 6)).fill([-1, 0, 0, 0b111100]));
};
window.onload = () => (new Core(160, 144))
    .addScene("game", new Game())
    .addScene("titlescreen", new TitleScreen())
    .addScene("story", new StoryScreen())
    .addScene("intro", new StartIntro())
    .addScene("start", new StartScreen())
    .run("start", (event) => {
    constructBitmaps(event);
    constructSamples(event);
    event.keyboard
        .addAction("right", "ArrowRight", "KeyD")
        .addAction("up", "ArrowUp", "KeyW")
        .addAction("left", "ArrowLeft", "KeyA")
        .addAction("down", "ArrowDown", "KeyS")
        .addAction("undo", "Backspace", "KeyZ")
        .addAction("restart", "KeyR")
        .addAction("start", "Enter")
        .addAction("pause", "Enter")
        .addAction("select", "Space");
    event.audio.setGlobalVolume(0.50);
});
