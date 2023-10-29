import { negMod } from "./math.js";
export class MenuButton {
    constructor(text, callback) {
        this.getText = () => this.text;
        this.evaluateCallback = (event) => this.callback(event);
        this.text = text;
        this.callback = callback;
    }
    clone() {
        return new MenuButton(this.text, this.callback);
    }
    changeText(newText) {
        this.text = newText;
    }
}
export class Menu {
    constructor(buttons, makeActive = false) {
        this.cursorPos = 0;
        this.active = false;
        this.isActive = () => this.active;
        this.buttons = buttons.map((_, i) => buttons[i].clone());
        this.maxLength = Math.max(...this.buttons.map(b => b.getText().length));
        this.active = makeActive;
    }
    activate(cursorPos = this.cursorPos) {
        this.cursorPos = cursorPos % this.buttons.length;
        this.active = true;
    }
    update(event) {
        if (!this.active)
            return;
        let oldPos = this.cursorPos;
        if (event.keyboard.getActionState("up") == 3 /* KeyState.Pressed */) {
            --this.cursorPos;
        }
        else if (event.keyboard.getActionState("down") == 3 /* KeyState.Pressed */) {
            ++this.cursorPos;
        }
        if (oldPos != this.cursorPos) {
            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            event.audio.playSample(event.assets.getSample("choose"), 0.60);
        }
        let activeButton = this.buttons[this.cursorPos];
        if (activeButton != null && (event.keyboard.getActionState("select") == 3 /* KeyState.Pressed */ ||
            event.keyboard.getActionState("start") == 3 /* KeyState.Pressed */)) {
            activeButton.evaluateCallback(event);
            event.audio.playSample(event.assets.getSample("select"), 0.60);
        }
    }
    draw(canvas, x = 0, y = 0, box = true) {
        const BOX_OFFSET = 4;
        const XOFF = 0;
        const YOFF = 10;
        if (!this.active)
            return;
        let font;
        let w = this.maxLength * (8 + XOFF);
        let h = this.buttons.length * YOFF;
        let dx = x + canvas.width / 2 - w / 2;
        let dy = y + canvas.height / 2 - h / 2;
        if (box) {
            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect(dx - BOX_OFFSET, dy - BOX_OFFSET, w + BOX_OFFSET * 2, h + BOX_OFFSET * 2);
        }
        for (let i = 0; i < this.buttons.length; ++i) {
            font = canvas.getBitmap(i == this.cursorPos ? "fontYellow" : "font");
            canvas.drawText(font, this.buttons[i].getText(), dx, dy + i * YOFF, XOFF, 0);
        }
    }
    deactivate() {
        this.active = false;
    }
    changeButtonText(index, text) {
        this.buttons[index].changeText(text);
    }
}
