import { clamp } from "./math.js";
;
export class Sample {
    constructor(ctx, sequence, baseVolume = 1.0, type = "square", ramp = 2 /* Ramp.Exponential */, fadeVolumeFactor = 0.5) {
        this.ctx = ctx;
        this.gain = ctx.createGain();
        this.baseSequence = sequence.map(s => Array.from(s));
        this.baseVolume = baseVolume;
        this.type = type;
        this.ramp = ramp;
        this.fadeVolumeFactor = fadeVolumeFactor;
    }
    play(volume) {
        let time = this.ctx.currentTime;
        let timer = 0.0;
        let osc = this.ctx.createOscillator();
        osc.type = this.type;
        volume *= this.baseVolume;
        // Not working on Firefox, or after Closure, possibly because not
        // part of es2020 standard
        // this.gain.gain.cancelAndHoldAtTime(time);
        try {
            if (typeof (this.gain.gain["cancelAndHoldAtTime"]) == "function") {
                this.gain.gain["cancelAndHoldAtTime"](time);
            }
        }
        catch (e) { }
        osc.frequency.setValueAtTime(this.baseSequence[0][0], time);
        this.gain.gain.setValueAtTime(clamp(volume, 0.01, 1.0), time);
        timer = 0;
        for (let s of this.baseSequence) {
            switch (this.ramp) {
                case 0 /* Ramp.Instant */:
                    osc.frequency.setValueAtTime(s[0], time + timer);
                    break;
                case 1 /* Ramp.Linear */:
                    osc.frequency.linearRampToValueAtTime(s[0], time + timer);
                    break;
                case 2 /* Ramp.Exponential */:
                    osc.frequency.exponentialRampToValueAtTime(s[0], time + timer);
                    break;
                default:
                    break;
            }
            timer += 1.0 / 60.0 * s[1];
        }
        this.gain.gain.exponentialRampToValueAtTime(volume * this.fadeVolumeFactor, time + timer);
        osc.connect(this.gain).connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + timer);
        osc.onended = () => {
            osc.disconnect();
        };
    }
}
