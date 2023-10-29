import { Menu, MenuButton } from "./menu.js";
const TEXT = `WOULD YOU LIKE TO\nENABLE AUDIO? YOU\nCAN CHANGE THIS\nLATER.`;
export class StartScreen {
    constructor() {
        this.menu = new Menu([
            new MenuButton("YES", (event) => {
                event.audio.toggle(true);
                this.goToStartIntro(event);
            }),
            new MenuButton("NO", (event) => {
                event.audio.toggle(false);
                this.goToStartIntro(event);
            })
        ], true);
    }
    goToStartIntro(event) {
        event.changeScene("intro");
    }
    init(param, event) { }
    update(event) {
        this.menu.update(event);
    }
    redraw(canvas) {
        canvas.clear(85, 170, 255);
        let font = canvas.getBitmap("font");
        canvas.setFillColor(0, 0, 85)
            .fillRect(6 + 4, 16 + 4, canvas.width - 16, 64)
            .fillRect(canvas.width / 2 - 14, canvas.height / 2 + 30, 34, 26)
            .setFillColor(0, 85, 170)
            .fillRect(6, 16, canvas.width - 16, 64)
            .fillRect(canvas.width / 2 - 18, canvas.height / 2 + 26, 34, 26)
            .drawText(font, TEXT, 12, 24, 0, 2);
        this.menu.draw(canvas, 0, 40, false);
    }
}
