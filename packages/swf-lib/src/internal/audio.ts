export const Audio = new AudioContext();

export const globalVolumeNode = Audio.createGain();

globalVolumeNode.connect(Audio.destination);
