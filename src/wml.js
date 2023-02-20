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
    const name = document.getElementById('soundfont');

    build.innerText = new Date(SoundFont.build).toLocaleString();

    let url;

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
      url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      name.innerText = import.meta.env.VITE_S3_BUCKET_KEY;
    } else {
      url = qs.soundfont
        ? qs.soundfont
        : import.meta.env.VITE_SOUNDFONT_URL || 'MSXspirit.sf2';
      name.innerText = url.match(/^http/)
        ? new URL(url).pathname.substring(url.lastIndexOf('/') + 1)
        : url;
    }
    await wml.setup(url);
  },
  false
);

if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
  ((w, d, s, l, i) => {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const f = d.getElementsByTagName(s)[0];
    const j = d.createElement(s);
    const dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(
    window,
    document,
    'script',
    'dataLayer',
    import.meta.env.VITE_GOOGLE_ANALYTICS_ID
  );
}
