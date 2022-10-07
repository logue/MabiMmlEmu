import QueryString from 'query-string';
import SMF from '@logue/smfplayer';
import { Tab, Tooltip } from 'bootstrap';
import Encoding from 'encoding-japanese';
import streamSaver from 'streamsaver';
import './style.scss';

formLock(true);

// Bootstrapのツールチップ
const tooltipTriggerList = document.querySelectorAll('*[title]');
[...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl));

// インターバル関数用。準備完了フラグ
let isReady = false;

// QueryStrings
const params = QueryString.parse(window.location.hash);

// SMF Player
const player = new SMF.Player('#wml');

// 利用可能な拡張子
const availableExts = [
  '.mml',
  '.mms',
  '.mmi',
  '.mp2mml',
];

/**
 * メイン処理
 */
document.addEventListener('DOMContentLoaded', async () => {
  // smfplayer.jsの初期化
  player.setLoop(document.getElementById('playerloop').checked);
  player.setTempoRate(document.getElementById('tempo').value);
  player.setMasterVolume(document.getElementById('volume').value * 16383);
  // WebMidiLink設定
  player.setWebMidiLink(import.meta.env.VITE_WML_URL || './wml.html', 'wml');

  /** @type {HTMLButtonElement[]} */
  const triggerTabList = [].slice.call(
    document.querySelectorAll('#control-tab button')
  );
  triggerTabList.forEach(triggerEl => {
    const tabTrigger = new Tab(triggerEl);

    triggerEl.addEventListener('click', event => {
      event.preventDefault();
      tabTrigger.show();
    });
  });

  /** @type {HTMLSelectElement} */
  const zips = document.getElementById('zips');

  const mmls = await fetch(`${import.meta.env.BASE_URL}files/index.json`).then(
    response => response.json()
  );

  mmls.forEach((k, i) => {
    const option = document.createElement('option');
    option.innerHTML = Object.keys(k);
    option.value = `${import.meta.env.BASE_URL}files/${Object.values(k)}`;
    if (i === 0) {
      option.selected = 'selected';
    }
    zips.appendChild(option);
  });

  // Zipファイルの取得
  document
    .getElementById('files')
    .addEventListener('change', () => handleSelect());

  zips.addEventListener('change', e => loadSample(e.target.value));

  if (params.zip && !initialized) {
    // クエリからZipファイルを選択
    zips.value = params.zip;
  } else {
    randomArchive();
  }
  loadSample(zips.value);

  const playerCard = document.getElementById('player');

  // MIDIファイルのドラッグアンドドロップ
  playerCard.addEventListener(
    'drop',
    event => {
      const dt = event.dataTransfer;
      console.log(dt);
      if (dt.files.length) {
        event.preventDefault();
        event.stopPropagation();
        handleFile(dt.files[0]);
      }
      playerCard.classList.remove('bg-info');
    },
    false
  );
  playerCard.addEventListener(
    'dragover',
    event => {
      event.preventDefault();
      event.stopPropagation();
      playerCard.classList.add('bg-info');
    },
    false
  );
  playerCard.addEventListener(
    'dragleave',
    event => {
      event.preventDefault();
      event.stopPropagation();
      playerCard.classList.remove('bg-info');
    },
    false
  );

  // テンポ設定
  document.getElementById('tempo').addEventListener('change', e => {
    const value = e.target.value;
    player.setTempoRate(value);
    document.getElementById('tempo_value').innerText = value;
  });

  // マスターボリューム
  document.getElementById('volume').addEventListener('change', e => {
    const value = e.target.value;
    player.setMasterVolume(value * 16383);
    document.getElementById('volume_value').innerText = value;
  });

  // 前に戻るボタン
  document.getElementById('prev').addEventListener('click', () => {
    // 現在選択中の項目を取得
    const select = document.getElementById('files');
    const selected = select.selectedIndex;
    if (selected === select.options.length) {
      // 末尾の場合、最後の曲へ
      select.selectedIndex = select.options.length;
    } else {
      // 選択されている項目の前の項目を選択
      select.selectedIndex = selected - 1;
    }
    handleSelect();
  });

  // 次に進むボタン
  document.getElementById('next').addEventListener('click', () => {
    const select = document.getElementById('files');
    const selected = select.selectedIndex;
    if (selected === select.options.length) {
      // 末尾の場合最初に戻る
      select.selectedIndex = 0;
    } else {
      // 今選択されてる項目の次の項目を選択
      select.selectedIndex = selected + 1;
    }
    handleSelect();
  });

  // 再生／一時停止ボタン
  document.getElementById('play').addEventListener('click', () => {
    if (player.pause) {
      // 再生
      player.play();
    } else {
      // 停止
      player.stop();
    }
  });

  // 停止ボタン
  document.getElementById('stop').addEventListener('click', () => {
    handleSelect();
    // ハッシュを削除
    history.pushState('', document.title, window.location.pathname);
    setTimeout(() => {
      player.stop();
    }, 51); // よく分からんが非同期で止めるらしい
  });

  // パニックボタン
  document
    .getElementById('panic')
    .addEventListener('click', () => player.sendAllSoundOff());

  // GMリセットボタン
  // document
  //   .getElementById('reset')
  //   .addEventListener('click', () => player.sendGmReset());

  // MIDIファイルのダウンロード
  document.getElementById('download').addEventListener('click', () => {
    // 選択状態を取得
    const select = document.getElementById('files');
    const option = select.querySelectorAll('option')[select.selectedIndex];
    const filename = option.dataset.midiplayerFilename;

    /** シーケンスデーター */
    const bytes = new Uint8Array(select.zip.decompress(filename));

    const fileStream = streamSaver.createWriteStream(
      Encoding.convert(filename, 'UNICODE', 'AUTO'),
      {
        size: bytes.byteLength,
      }
    );

    const writer = fileStream.getWriter();
    writer.write(bytes);
    writer.close();
  });

  // シンセサイザ変更
  // document.getElementById('synth').addEventListener('change', e => {
  //   player.stop();
  //   player.setWebMidiLink(e.target.value, 'wml');
  // });

  formLock(false);
});

/**
 * ファイルを読み込む
 */
function handleFile(file) {
  /** @type {HTMLDivElement} */
  const info = document.getElementById('info');
  info.innerText = 'Now Loading...';

  /** @type {HTMLDivElement} */
  const progressOuter = document.createElement('div');
  progressOuter.className = 'progress';
  /** @type {HTMLDivElement} */
  const progress = document.createElement('div');
  progress.className = 'progress-bar progress-warning';

  progressOuter.appendChild(progress);
  info.appendChild(progressOuter);

  /** @type {FileReader} */
  const reader = new FileReader();
  player.sendGmReset();

  reader.onload = e => {
    const input = new Uint8Array(e.target.result);
    handleInput(file.name, input);
    info.removeChild(progressOuter);
    info.innerHtml = `Now Playing "${Encoding.convert(
      file.name,
      'UNICODE',
      'AUTO'
    )}".`;
    info.classList.remove('alert-warning');
    info.classList.add('alert-success');
  };
  reader.onloadstart = () => info.classList.remove('alert-success');
  info.classList.add('alert-warning');

  reader.onprogress = e => {
    if (e.lengthComputable) {
      const percentLoaded = (e.loaded / e.total) | (0 * 100);
      progress.style.width = percentLoaded + '%';
      progress.innerText = percentLoaded + ' %';
    }
  };
  reader.readAsArrayBuffer(file);
}
let initialized = false;

/**
 * Zipファイルの内容を取得し、selectタグに割り当てる
 *
 * @param {Srting} zipfile - Zipファイル名
 */
async function loadSample(zipfile) {
  formLock(true);

  /** @type {HTMLSelectElement} ファイルリスト */
  const select = document.getElementById('files');

  /**
   * 読み込まれたときの処理
   *
   * @param {ArrayBuffer} stream
   */
  const ready = stream => {
    const input = new Uint8Array(stream);

    // ファイルリストの子要素を一括削除
    while (select.firstChild) select.removeChild(select.firstChild);

    // Zipファイルを展開
    // eslint-disable-next-line no-undef
    select.zip = new Zlib.Unzip(input);

    // ファイル名一覧を取得
    const filenames = select.zip.getFilenames().sort();
    // セレクトボックスに流し込む
    filenames.forEach((name, i) => {
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase();

      if (ext === '/' || !availableExts.includes(ext)) {
        return;
      }

      const option = document.createElement('option');
      // 項目名
      option.textContent = Encoding.convert(name, 'UNICODE', 'AUTO');
      // 実際のファイル名
      option.value = name;
      // selectタグに流し込む
      select.appendChild(option);
    });

    // 初期値が一番上の項目になるとつまらないのでランダム化
    const prev = select.selectedIndex;
    let next = prev;
    while (prev == next) {
      next = ~~(select.length * Math.random());
    }
    select.selectedIndex = next;

    formLock(false);

    if (params.file && !initialized) {
      // クエリにファイル名が含まれている場合、それを選択
      select.value = params.file;
      handleSelect();
    }
    initialized = true;
  };

  /** @type {CacheStorage} */
  const cache = await window.caches.open('zips');
  /** @type {Response} */
  const cached = await cache.match(select.value);

  if (cached) {
    ready(await cached.arrayBuffer());
    return;
  }

  /** @type {Response} キャッシュがない場合Fetchで取得 */
  const response = await fetch(zipfile, {
    method: 'GET',
    mode: 'no-cors',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Network response was not ok.');
  }

  const clonedResponse = response.clone();

  if (cache) {
    cache.put(zipfile, clonedResponse);
  }
  ready(await response.arrayBuffer());
  formLock(false);
}
/**
 * 選択されたファイルを解凍
 */
function handleSelect() {
  /** @type {HTMLSelectElement} */
  const select = document.getElementById('files');
  /** @type {string} */
  const filename = select.value;

  if (filename) {
    handleInput(filename, select.zip.decompress(filename));

    const f = Encoding.convert(filename, 'UNICODE', 'AUTO');
    document.getElementById('info').innerHTML = `Now playing "${f}".`;

    // ページのタイトルを反映
    document.title = `${f} - ${document.getElementById('zips').value
      } / Standard MIDI Player for Web`;

    const hash = `#zip=${encodeURIComponent(
      document.getElementById('zips').value
    )}&file=${encodeURIComponent(filename)}`;

    // メタ情報のタイトル
    document.getElementById('music_title').value = Encoding.convert(
      player.getSequenceName(1),
      'UNICODE',
      'AUTO'
    );
    // メタ情報の著作権表記
    document.getElementById('copyright').value = Encoding.convert(
      player.getCopyright(),
      'UNICODE',
      'AUTO'
    );

    // pushstateを使用
    if (window.history && window.history.pushState) {
      window.history.pushState(document.title, null, hash);
      return false;
    }
    document
      .querySelector('link[rel="canonical"]')
      .setAttribute('href', `${location.href}/${hash}`);

    if (params.zip && params.file) {
      player.play();
    }
  }
}
/**
 * MIDI/MLDファイルを読み込ませる
 *
 * @param string filename ファイル名
 * @param array buffer ファイルの中身
 */
function handleInput(filename, buffer) {
  // 再生中のMIDIを停止。
  player.stop();
  // 音を停止
  player.sendAllSoundOff();
  // GMリセットを送信
  player.sendGmReset();

  // テキストを初期化
  document.getElementById('music_title').value = '';
  document.getElementById('copyright').value = '';
  document.getElementById('text_event').value = '';
  document.title = 'SMF Player';

  switch (filename.split('.').pop().toLowerCase()) {
    case 'midi':
    case 'mid':
      // Load MIDI file
      player.loadMidiFile(buffer);
      break;
    case 'mld':
      // Load Polyphonic Ringtone File
      player.loadMldFile(buffer);
      break;
    case 'ms2mml':
      // Load Maple Story 2 MML File
      player.loadMs2MmlFile(buffer);
      break;
    case 'mms':
      // Load MakiMabi Sequence MML File
      player.loadMakiMabiSequenceFile(buffer);
      break;
    case 'mml':
      // Load 3MLE MML File
      player.load3MleFile(buffer);
      break;
    case 'mmi':
      // Load Mabicco MML File
      player.loadMabiIccoFile(buffer);
      break;
  }

  // マスターボリュームが低いままになるので
  player.setMasterVolume(document.getElementById('volume').value * 16383);
  player.play();
}

/**
 * ランダム再生
 */
function randomPlay() {
  const select = document.getElementById('files');
  select.selectedIndex = ~~(select.length * Math.random());
  handleSelect();
}

/**
 * フォームのロック／アンロック
 *
 * @param {boolean} lock
 */
function formLock(lock = true) {
  document
    .querySelectorAll('input, button, select')
    .forEach(e => (e.disabled = lock));
}

/**
 * Zipファイルのランダム選択
 */
function randomArchive() {
  const select = document.getElementById('zips');
  select.selectedIndex = ~~(select.length * Math.random());
  handleSelect();
}

/**
 * IFRAMEから送られてくるwindow.postMessageを監視
 */
window.onmessage = (/** @type {MessageEvent} */ e) => {
  // console.log(e);
  const event = e.data; // Should work.
  const selected = document.getElementById('files').selectedIndex || 0;
  const playButton = document.getElementById('play');
  const info = document.getElementById('info');

  switch (event) {
    case 'endoftrack':
      // 曲が終了したとき
      player.stop();
      // 曲は終了しても、player.pauseの値が変化しないので、ここで、再生ボタンにする。
      playButton.innerHTML = '<em class="bi bi-play-fill"></em>';
      playButton.classList.add('btn-primary');
      playButton.classList.remove('btn-success');
      if (document.getElementById('random').chcked) {
        randomPlay();
      } else {
        const files = document.getElementById('files');
        if (selected !== 0) {
          // ループで最初に戻った場合（player.positionがリセットされた場合）
          // 次の曲を選択
          if (selected == files.options.length) {
            // 末尾の場合最初に戻る
            files.selectedIndex = 0;
          } else {
            files.selectedIndex = selected + 1;
          }
          // 曲を変更
          handleSelect();
        }
      }
      break;
    case 'progress':
      info.innerText = 'Loading soundfont...';
      break;
    case 'link,ready':
      // WMLが読み込まれた時
      isReady = true;
      if (document.getElementById('random').checked) {
        handleSelect();
      }
      info.classList.add('alert-success');
      info.classList.remove('alert-warning');
      info.innerText = 'Ready.';
      document
        .querySelectorAll('input, button, select')
        .forEach(e => (e.disabled = ''));
      break;
  }
};

let parentTextEvent = '';
/**
 * インターバル関数
 */
setInterval(() => {
  const progressBar = document
    .getElementById('music-progress')
    .querySelector('.progress-bar');

  const playButton = document.getElementById('play');

  if (isReady) {
    // player.pauseの値で再生/一時停止ボタンを変化させる
    // ただし、smfplayer.jsのバグでplayer.loadMidiFile()が実行された直後、
    // 再生していない状態でもplayer.pauseの値がtrueになってしまうので、
    // もう一工夫いる。
    if (player.pause) {
      playButton.innerHTML = '<em class="bi bi-play"></em>';
      playButton.classList.remove('btn-success');
      playButton.classList.add('btn-primary');
    } else {
      playButton.innerHTML = '<em class="bi bi-pause"></em>';
      playButton.classList.remove('btn-primary');
      playButton.classList.add('btn-success');
    }
    const percentage = ((player.getPosition() / player.getLength()) * 100) | 0;
    progressBar.style.width = percentage + '%';
    progressBar.innerText = percentage + '%';

    document.getElementById('time-now').innerText = player.getTime();
    document.getElementById('time-total').innerText = player.getTotalTime();
    document.getElementById('current-tempo').innerText = player.getTempo();

    if (parentTextEvent !== player.getTextEvent()) {
      document.getElementById('text_event').value = Encoding.convert(
        player.getTextEvent(),
        'UNICODE',
        'AUTO'
      );
    }

    parentTextEvent = player.getTextEvent();

    if (percentage === 100) {
      // 次の曲

      /** @type {HTMLSelectElement} */
      const files = document.getElementById('files');
      if (files.selectedIndex == files.options.length) {
        // 末尾の場合最初に戻る
        files.selectedIndex = 0;
      } else {
        // 今選択されてる項目の次の項目を選択
        files.selectedIndex = files.selectedIndex + 1;
      }
      handleSelect();
    }
  }
}, 600);

if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
  // Global site tag (gtag.js) - Google Analytics
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
