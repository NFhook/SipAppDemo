
const FILES = require('./sounds.json');

const SOUNDS = new Map(
	[
		[ 'ringback', { audio: new Audio(FILES['ringback']), volume: 1.0 } ],
		[ 'ringing',  { audio: new Audio(FILES['ringing']),  volume: 1.0 } ],
		[ 'answered', { audio: new Audio(FILES['answered']), volume: 1.0 } ],
		[ 'rejected', { audio: new Audio(FILES['rejected']), volume: 0.5 } ],
		[ 'hangup',   { audio: new Audio(FILES['hangup']), volume: 1.0 } ]
	]);


export class AudioPlayer {

    static initialized: boolean = false;
    static initialize = () => {
        if (AudioPlayer.initialized) {
		    return;
		}
        SOUNDS.forEach((item) => {
			item.audio.volume = 0;
			item.audio.crossOrigin = 'anonymous';
			try { item.audio.play(); } catch (error) {}
		});
        AudioPlayer.initialized = true;
    };
    /**
	 * Play a sound
	 * @param {String} name - Sound name
	 * @param {[Float]} relativeVolume - Relative volume (0.0 - 1.0)
	 */
    static play = (name: any, relativeVolume: any, complete: Function | null = null) => {
		AudioPlayer.initialize();

		if (typeof relativeVolume !== 'number')
			relativeVolume = 1.0;

		console.debug('play() [name:%s, relativeVolume:%s]', name, relativeVolume);

		let sound = SOUNDS.get(name);

		if (!sound)
			throw new Error(`unknown sound name "${name}"`);

		try {
			sound.audio.pause();
			sound.audio.currentTime = 0.0;
			sound.audio.volume = (sound.volume || 1.0) * relativeVolume;
			sound.audio.play();

			//if(complete) {
			if(complete !== null && typeof complete === 'function') {
				complete();
			}
		}
		catch (error) {
			console.warn('play() | error: %o', error);
		}
	};

    static stop = (name: any) => {

		console.debug('stop() [name:%s]', name);

		let sound = SOUNDS.get(name);

		if (!sound)
			throw new Error(`unknown sound name "${name}"`);

		sound.audio.pause();
		sound.audio.currentTime = 0.0;
	};
}
