;
export class PuzzleState {
    constructor(staticLayer, dynamicLayer, width, height, flip, toggleWallsState = true) {
        this.getFlip = () => this.flip;
        this.getToggleableWallState = () => this.toggleWallsState;
        this.clone = () => new PuzzleState(this.layers[0], this.layers[1], this.width, this.height, this.flip, this.toggleWallsState);
        this.layers = new Array(2);
        this.layers[0] = Array.from(staticLayer);
        this.layers[1] = Array.from(dynamicLayer);
        this.flip = flip;
        this.toggleWallsState = toggleWallsState;
        this.width = width;
        this.height = height;
    }
    getTile(layer, x, y, def = 1) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;
        return this.layers[layer][y * this.width + x];
    }
    getIndexedTile(layer, i, def = 1) {
        if (i < 0 || i >= this.width * this.height)
            return def;
        return this.layers[layer][i];
    }
    setTile(layer, x, y, v) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;
        this.layers[layer][y * this.width + x] = v;
    }
    setIndexedTile(layer, i, v) {
        if (i < 0 || i >= this.width * this.height)
            return;
        this.layers[layer][i] = v;
    }
    setFlip(flip) {
        this.flip = flip;
    }
    setToggleableWallState(state) {
        this.toggleWallsState = state;
    }
    iterate(layer, cb) {
        let i = 0;
        for (let dy = 0; dy < this.height; ++dy) {
            for (let dx = 0; dx < this.width; ++dx) {
                cb(dx, dy, this.layers[layer][i++]);
            }
        }
    }
}
