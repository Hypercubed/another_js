const CreateChannel = () => {
    return {
        pos: 0,
        playing: false,
        sample: null,
        speed: 0,
        loops: 0
    }
}

class SfxRawProcessor extends AudioWorkletProcessor {
    _ready = false
    _playing = false
    _channels = new Array(4).fill(null).map(() => CreateChannel())
    _mixingRate = 0

    constructor() {
        super()
        this.port.onmessage = this.handleMessage.bind(this)
    }

    handleMessage(event) {
        switch(event.data.message) {
            case 'init':
                console.log('[soundProcessor] setting mixingRate to', event.data.mixingRate)
                this._ready = true
                this._mixingRate = event.data.mixingRate
                break

            case 'play': {
                const { sample, channel } = event.data
                this.play(sample, channel)
                this._playing = true
                break
            }

            case 'stop': {
                const { channel } = event.data
                debugger
            }
        }
    }

    play(sample, channel) {
        const chan = this._channels[channel]
        chan.playing = true
        chan.sample = sample.sample
        chan.pos = 0
        chan.speed = sample.freq / this._mixingRate
        chan.loops = sample.loops
        chan.volume = sample.volume
    }

    mixChannels(out, len) {
        for (let j = 0; j < len; ++j) {
            for (let i = 0; i < this._channels.length; ++i) {
                const chan = this._channels[i]
                if (chan.playing) {
                    const dest = i & 1
                    const sample = chan.sample[Math.floor(chan.pos)] * chan.volume / 63.0
                    out[dest][j] += sample / 128.0
                    chan.pos += chan.speed
                    if (chan.pos > chan.sample.length - 1) {
                        if (chan.loops === -1)
                            chan.pos = chan.sample.length - chan.pos
                        else 
                            chan.playing = false
                    }
                }
            }
        }
    }

    process(inputs, outputs, params) {
        if (this._ready) {
            this.mixChannels(outputs[0], outputs[0][0].length)
        }

        return true
    }
}

registerProcessor('sfxraw-processor', SfxRawProcessor)
