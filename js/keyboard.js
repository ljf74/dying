;
export class Keyboard {
    constructor() {
        this.anyPressed = false;
        this.isAnyPressed = () => this.anyPressed;
        this.states = new Map();
        this.prevent = new Array();
        this.actions = new Map();
        window.addEventListener("keydown", (e) => {
            this.keyEvent(true, e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
        });
        window.addEventListener("keyup", (e) => {
            this.keyEvent(false, e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
        });
        window.addEventListener("contextmenu", (e) => e.preventDefault());
        window.addEventListener("mousemove", (_) => window.focus());
        window.addEventListener("mousedown", (_) => window.focus());
    }
    keyEvent(down, key) {
        if (down) {
            if (this.states.get(key) === 1 /* KeyState.Down */)
                return;
            this.states.set(key, 3 /* KeyState.Pressed */);
            this.anyPressed = true;
            return;
        }
        if (this.states.get(key) === 0 /* KeyState.Up */)
            return;
        this.states.set(key, 2 /* KeyState.Released */);
    }
    update() {
        for (let k of this.states.keys()) {
            if (this.states.get(k) === 3 /* KeyState.Pressed */)
                this.states.set(k, 1 /* KeyState.Down */);
            else if (this.states.get(k) === 2 /* KeyState.Released */)
                this.states.set(k, 0 /* KeyState.Up */);
        }
        this.anyPressed = false;
    }
    addAction(name, key1, key2 = undefined) {
        this.actions.set(name, [key1, key2]);
        this.prevent.push(key1);
        if (key2 !== undefined)
            this.prevent.push(key2);
        return this;
    }
    getState(name) {
        let state = this.states.get(name);
        if (state == undefined)
            return 0 /* KeyState.Up */;
        return state;
    }
    getActionState(name) {
        let a = this.actions.get(name);
        if (a === undefined)
            return 0 /* KeyState.Up */;
        let state = this.getState(a[0]);
        if (state == 0 /* KeyState.Up */ && a[1] !== undefined) {
            return this.getState(a[1]);
        }
        return state;
    }
}
