import { Sample } from "./sample.js";
export class AudioPlayer {
    constructor(globalVolume = 1.0) {
        this.errorLogged = false;
        this.createSample = (sequence, baseVolume = 1.0, type = "square", ramp = 2 /* Ramp.Exponential */, fadeVolumeFactor = 0.5) => (new Sample(this.ctx, sequence, baseVolume, type, ramp, fadeVolumeFactor));
        this.isEnabled = () => this.enabled;
        this.getStateString = () => "AUDIO: " + ["OFF", "ON "][Number(this.enabled)];
        this.ctx = new AudioContext();
        this.enabled = false;
        this.globalVolume = globalVolume;
    }
    playSample(s, volume = 1.0) {
        if (!this.enabled || s == undefined)
            return;
        try {
            s.play(volume * this.globalVolume);
        }
        catch (e) {
            if (!this.errorLogged) {
                console.log("Audio error: " + e);
                this.errorLogged = true;
            }
        }
    }
    toggle(state = !this.enabled) {
        return (this.enabled = state);
    }
    setGlobalVolume(vol) {
        this.globalVolume = vol;
    }
}
