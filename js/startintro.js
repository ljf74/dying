export class StartIntro {
    constructor() {
        this.phase = 0;
        this.timer = 0;
    }
    init(param, event) {
        event.transition.activate(false, 1 /* TransitionType.Fade */, 1.0 / 30.0, () => { }, 6);
    }
    update(event) {
        const PHASE_TIME = 60;
        if (event.transition.isActive())
            return;
        if ((this.timer += event.step) >= PHASE_TIME ||
            event.keyboard.isAnyPressed()) {
            this.timer = 0;
            event.transition.activate(true, 1 /* TransitionType.Fade */, 1.0 / 30.0, (event) => {
                if (this.phase == 1) {
                    event.changeScene("titlescreen", 0);
                    event.transition.activate(false, 2 /* TransitionType.Circle */, 1.0 / 30.0, () => { });
                }
                else {
                    ++this.phase;
                }
            }, 6);
        }
    }
    redraw(canvas) {
        let font = canvas.getBitmap("font");
        canvas.clear(0);
        if (this.phase == 0) {
            canvas.drawText(font, "A GAME BY", canvas.width / 2, canvas.height / 2 - 10, 0, 0, 1 /* TextAlign.Center */);
            canvas.drawText(font, "JANI NYK@NEN", canvas.width / 2, canvas.height / 2 + 2, 0, 0, 1 /* TextAlign.Center */);
        }
        else {
            canvas.drawText(font, "MADE FOR JS13K", canvas.width / 2, canvas.height / 2 - 4, 0, 0, 1 /* TextAlign.Center */);
        }
    }
}
