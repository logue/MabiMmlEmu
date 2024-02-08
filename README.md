# Mabinogi Web MML Emulator

This project is a project to play Mabinogi's MML online with almost the same sound as the actual client's sound.

Please fork and replace it with your own MML.

See the [files directory according to the instructions](public/files/README.md) in the mmls directory for more information.

## Usage

If you're not sure, download the latest release and put the zipped MML file in the [files directory according to the instructions](public/files/README.md).

1. Clone this project.
2. Go project directory and type `yarn install`.
3. Add your Zip archived MML files to `public/mmls` directory.
4. Modify `index.json`.
5. Type `yarn dev`.

## Limitation

Many of the sound sources added after 2014 (electric guitar, drums, etc.) cannot be played correctly. I think it's probably due to a problem with [sf2synth.js](https://github.com/logue/sf2synth.js) that I can't parse the global definition for each instrument in the SoundFont file, but I can't afford to fix it.

I would appreciate it if you could cooperate with the development of [sf2synth.js](https://github.com/logue/sf2synth.js).

## Related project

- [smfplayer.js](https://github.com/logue/smfplayer.js)
- [sf2synth.js](https://github.com/logue/sf2synth.js)
- [Reverb.js](https://github.com/logue/Reverb.js)
- [PSGConverter](https://github.com/logue/PSGConverter)

## License

&copy; 2006-2013, 2015, 2018, 2019, 2022, 2024 by Logue

[MIT](LICENSE)
