import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import SoundFont from '@logue/sf2synth';
import QueryString from 'query-string';
import '@logue/sf2synth/dist/style.css';

window.addEventListener(
  'DOMContentLoaded',
  async () => {
    /** @type {QueryString.ParsedQuery} Query string */
    const qs = QueryString.parse(window.location.search);
    /** sf2synth.js Option */
    const option = { placeholder: 'placeholder' };
    if (qs.ui === 'false') {
      option.drawSynth = false;
    }

    /** WebMidiLink */
    const wml = new SoundFont.WebMidiLink(option);
    /** Build information */
    const build = document.getElementById('build');
    /** SoundFont Filename */
    const name = document.getElementById('name');

    build.innerText = new Date(SoundFont.build).toLocaleString();

    if (import.meta.env.VITE_S3_BUCKET_NAME) {
      // Fetch from Amazon S3, Cloudflare R2 etc.
      const s3 = new S3Client({
        credentials: {
          accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.VITE_S3_ACCESS_KEY_SECRET,
        },
        endpoint: import.meta.env.VITE_S3_ENDPOINT,
        region: import.meta.env.VITE_S3_REGION || 'auto',
        signatureVersion: import.meta.env.VITE_S3_SIGNATURE_VERSION || 'v4',
      });
      const command = new GetObjectCommand({
        Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
        Key: import.meta.env.VITE_S3_BUCKET_KEY,
      });
      // Create the presigned URL and fetch the object
      const s3url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      console.log(s3url);
      name.innerText = import.meta.env.VITE_S3_BUCKET_NAME;
      await wml.setup(s3url);
    } else {
      const url = qs.soundfont
        ? qs.soundfont
        : import.meta.env.VITE_SOUNDFONT_URL || 'MSXspirit.sf2';

      name.innerText = url.match(/^http/)
        ? new URL(url).pathname.substring(url.lastIndexOf('/') + 1)
        : url;
      await wml.setup(url);
    }
  },
  false
);
