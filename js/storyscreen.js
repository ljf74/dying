const STORY = [
    [
        "YOU ARE HAVING\nTHE SAME\nDREAM AGAIN.",
        "THE DREAM WHERE\nEVERYONE MUST\nDIE."
    ],
    [
        "YOU WAKE UP.",
        "EVERYONE AROUND\nYOU IS DEAD.",
        "EVERYONE YOU\nEVER CARED\nABOUT.",
        "DID YOU KILL\nTHEM OR WERE\nTHEY KILLED BY\nYOUR DREAM?",
        "THAT YOU WILL\nNEVER KNOW."
    ]
];
const isWhitespace = (c) => ["\n", " ", "\t"].includes(c);
export class StoryScreen {
    constructor() {
        this.textIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.ready = false;
        this.rectTimer = 0;
        this.maxLength = 0;
        this.height = 0;
        this.phase = 0;
        this.isEnding = false;
    }
    init(param, event) {
        this.textIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.ready = false;
        this.phase = Number(param);
        let arr = STORY[this.phase][0].split("\n");
        this.maxLength = Math.max(...arr.map(s => s.length));
        this.height = arr.length;
    }
    update(event) {
        const RECT_SPEED = 0.15;
        const CHAR_TIME = 4;
        let arr;
        if (event.transition.isActive() || this.isEnding)
            return;
        this.rectTimer = (this.rectTimer + RECT_SPEED * event.step) % (Math.PI * 2);
        this.ready = this.charIndex >= STORY[this.phase][this.textIndex].length;
        if (!this.ready) {
            if (event.keyboard.isAnyPressed()) {
                this.charIndex = STORY[this.phase][this.textIndex].length;
                this.ready = true;
            }
            else if ((this.charTimer += event.step) >= CHAR_TIME ||
                isWhitespace(STORY[this.phase][this.textIndex])) {
                ++this.charIndex;
                this.charTimer = 0;
            }
        }
        else {
            if (event.keyboard.isAnyPressed()) {
                if (++this.textIndex == STORY[this.phase].length) {
                    if (this.phase == 0) {
                        event.changeScene("game", 1);
                        event.transition.activate(false, 2 /* TransitionType.Circle */, 1.0 / 30.0, () => { });
                    }
                    else {
                        this.isEnding = true;
                        event.transition.activate(false, 1 /* TransitionType.Fade */, 1.0 / 120.0, () => { }, 6);
                    }
                }
                else {
                    this.charIndex = 0;
                    this.charTimer = 0;
                    arr = STORY[this.phase][this.textIndex].split("\n");
                    this.maxLength = Math.max(...arr.map(s => s.length));
                    this.height = arr.length;
                    this.ready = false;
                }
                event.audio.playSample(event.assets.getSample("choose"), 0.60);
            }
        }
    }
    redraw(canvas) {
        const XOFF = 0;
        const YOFF = 2;
        let font = canvas.getBitmap("font");
        canvas.clear(0);
        if (this.isEnding) {
            canvas.drawText(font, "THE END", canvas.width / 2, canvas.height / 2 - 4, XOFF, 0, 1 /* TextAlign.Center */);
            return;
        }
        let dx = canvas.width / 2 - (this.maxLength * (8 + XOFF)) / 2;
        let dy = canvas.height / 2 - this.height * (8 + YOFF) / 2;
        if ((this.textIndex > 0 || this.charIndex > 0) &&
            this.textIndex < STORY[this.phase].length) {
            canvas.drawText(font, STORY[this.phase][this.textIndex].substring(0, this.charIndex), dx, dy, XOFF, YOFF);
        }
        let rectY = Math.round(Math.sin(this.rectTimer)) * 2;
        if (this.ready) {
            canvas.setFillColor(255)
                .fillRect(dx + this.maxLength * (8 + XOFF) + 4, dy + this.height * (8 + YOFF) + 4 + rectY, 6, 6);
        }
    }
}
