import queryString from 'querystring';
import SMF from '@logue/smfplayer';
import $ from 'jquery/dist/jquery.slim';
import { Tab } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as Zlib from 'zlibjs/bin/unzip.min';
import Encoding from 'encoding-japanese';

// インターバル関数用。準備完了フラグ
let isReady = false;

// QueryStrings
const params = queryString.parse(window.location.hash);

// SMF Player
const player = new SMF.Player('#wml');

// 利用可能な拡張子
const availableExts = [
  '.mid',
  '.midi',
  '.mld',
  '.mml',
  '.mms',
  '.mmi',
  '.mp2mml',
];

// スマフォの場合、軽量版にする上、UIを隠す
const wml = './wml.html';

window.requestFileSystem =
  window.requestFileSystem || window.webkitRequestFileSystem;

/**
 * メイン処理
 */
document.addEventListener('DOMContentLoaded', async () => {
  $(':input').attr('disabled', 'disabled');
  // AudioContextが使用可能かのチェック
  window.AudioContext =
    window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
  if (typeof window.AudioContext === 'undefined') {
    $('#info')
      .addClass('alert-danger')
      .removeClass('alert-warning')
      .text(
        'Your browser has not supported AudioContent function. Please use Firefox or Blink based browser. (such as Chrome)'
      );
    return;
  }
  // fileプロトコルは使用不可。（Ajaxを使うため）
  if (location.protocol === 'file:') {
    $('#info')
      .addClass('alert-danger')
      .removeClass('alert-warning')
      .text('This program require runs by server.');
    return;
  }

  // smfplayer.jsの初期化
  player.setLoop($('#playerloop').is(':checked'));
  player.setTempoRate($('#tempo').val());
  player.setMasterVolume($('#volume').val() * 16383);
  // player.setMasterChannel(new TimerMasterChannel(TimerMasterChannel.MODE_DEFAULT));
  // WebMidiLink設定
  player.setWebMidiLink(wml, 'wml');

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

  const mmls = await fetch(`${import.meta.env.BASE_URL}mmls/index.json`).then(
    response => response.json()
  );

  mmls.forEach((k, i) => {
    const option = document.createElement('option');
    option.innerHTML = Object.keys(k);
    option.value = `${import.meta.env.BASE_URL}mmls/${Object.values(k)}`;
    zips.appendChild(option);
  });

  // Zipファイルの取得
  document
    .getElementById('files')
    .addEventListener('change', e => handleSelect(e.target.value));

  zips.addEventListener('change', e => loadSample(e.target.value));

  if (params.zip && !initialized) {
    // クエリからZipファイルを選択
    zips.value = params.zip;
    loadSample(params.zip);
  } else {
    randomArchive();
    loadSample(zips.value);
  }

  // MIDIファイルのドラッグアンドドロップ
  $('#player *')
    .on('drop', e => {
      if (e.originalEvent.dataTransfer) {
        if (e.originalEvent.dataTransfer.files.length) {
          e.preventDefault();
          e.stopPropagation();
          handleFile(e.originalEvent.dataTransfer.files[0]);
        }
      }
      $('#player').removeClass('text-white bg-danger');
    })
    .on('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      $('#player').addClass('text-white bg-danger');
    })
    .on('dragleave', e => {
      e.preventDefault();
      e.stopPropagation();
      $('#player').removeClass('text-white bg-danger');
    });

  // テンポ設定
  $('#tempo').on('change', e => {
    const value = $(this).val();
    player.setTempoRate(value);
    $('#tempo_value').text(value);
  });

  // マスターボリューム
  $('#volume').on('change', function () {
    const value = $(this).val();
    // console.log(value);
    player.setMasterVolume(value * 16383);
    $('#volume_value').text(value);
  });

  // 前に戻るボタン
  $('#prev').on('click', function () {
    // 現在選択中の項目を取得
    const selected = $('#files').prop('selectedIndex');
    if (selected == $('#files option').length) {
      // 末尾の場合、最後の曲へ
      $('#files').prop('selectedIndex', $('#files option').length);
    } else {
      // 選択されている項目の前の項目を選択
      $('#files').prop('selectedIndex', selected - 1);
    }
    handleSelect(document.getElementById('files'));
  });

  // 次に進むボタン
  $('#next').on('click', function () {
    const selected = $('#files').prop('selectedIndex');
    if (selected == $('#files option').length) {
      // 末尾の場合最初に戻る
      $('#files').prop('selectedIndex', 0);
    } else {
      // 今選択されてる項目の次の項目を選択
      $('#files').prop('selectedIndex', selected + 1);
    }
    handleSelect(document.getElementById('files'));
  });

  // 再生／一時停止ボタン
  $('#play').on('click', () => {
    if (player.pause) {
      // 再生
      player.play();
    } else {
      // 停止
      player.stop();
    }
  });

  // 停止ボタン
  $('#stop').on('click', () => {
    handleSelect(document.getElementById('files'));
    // ハッシュを削除
    history.pushState('', document.title, window.location.pathname);
    setTimeout(function () {
      player.stop();
    }, 51); // よく分からんが非同期で止めるらしい
  });

  // パニックボタン
  $('#panic').on('click', () => {
    player.sendAllSoundOff();
  });

  // MIDIファイルのダウンロード
  $('#download').on('click', () => {
    // 選択状態を取得
    const select = document.getElementById('files');
    const option = select.querySelectorAll('option')[select.selectedIndex];
    const filename = option.dataset.midiplayerFilename;

    // arraybufferをbase64に変換
    let binary = '';
    const bytes = new Uint8Array(select.zip.decompress(filename));
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    // この方法は泥臭い
    window.location.href = 'data:audio/midi;base64,' + window.btoa(binary);
  });

  $('#synth').on('change', function (e) {
    player.stop();
    player.setWebMidiLink($(this).val(), 'wml');
  });

  // $('*[title]').tooltip();

  /*
// 曲の位置を変更。将来実装予定・・・。
$('#music-progress').on('click', function(e){
ssvar progress_bar_percentage = e.offsetX / $(this).width();
ssplayer.setPosition( player.getLength() * progress_bar_percentage);
});
*/
});

/**
 * ファイルを読み込む
 */
function handleFile(file) {
  const reader = new FileReader();
  player.sendGmReset();

  reader.onload = function (e) {
    const input = new Uint8Array(e.target.result);
    handleInput(file.name, input);
    $('#info p').text = 'Ready.';
    $('#info').removeClass('alert-warning').addClass('alert-success');
  };
  reader.onloadstart = function (e) {
    $('#info').removeClass('alert-success').addClass('alert-warning');
  };

  reader.onprogress = function (e) {
    if (e.lengthComputable) {
      const percentLoaded = (e.loaded / e.total) | (0 * 100);
      $('#info div div')
        .css('width', percentLoaded + '%')
        .text(percentLoaded + '%');
    }
  };
  reader.readAsArrayBuffer(file);
}
let initialized = false;

/**
 * Zipファイルの内容を取得し、selectタグに割り当てる
 */
function loadSample(zipfile) {
  $(':input').attr('disabled', 'disabled');
  const ready = stream => {
    const input = new Uint8Array(stream);

    // ファイルリストの子要素を一括削除
    const select = document.getElementById('files');
    while (select.firstChild) select.removeChild(select.firstChild);

    // Zipファイルからファイル名一覧を取得
    const zip = (select.zip = new Zlib.Unzip(input));
    console.log(zip);
    const filenames = zip.getFilenames().sort();
    // console.log(filenames);

    $('#info div')
      .removeClass('progress-warning')
      .addClass('progress-info')
      .show();

    // ファイル名一覧をセレクトボックスに流し込む
    filenames.forEach(function (name, i) {
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
      const percentLoaded = Math.round((i / filenames.length) * 10000);

      $('#info p').text('Parsing zip file...');
      $('#info div div')
        .css('width', percentLoaded)
        .text(percentLoaded + '%');

      if (ext === '/' || !availableExts.includes(ext)) {
        return;
      }

      const option = document.createElement('option');
      // 項目名
      option.textContent = Encoding.convert(name, 'UNICODE', 'AUTO');
      // 実際のファイル名
      option.setAttribute('data-midiplayer-filename', name);
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

    $('#info p').text('Ready.');
    $('#info div').removeClass('progress-info').hide();
    $('#info').removeClass('alert-warning').addClass('alert-success');
    $(':input').removeAttr('disabled ');

    if (params.file && !initialized) {
      // クエリにファイル名が含まれている場合、それを選択
      $('#files').val(params.file);
      handleSelect();
    }
    initialized = true;
  };

  window.caches.open('zip').then(cache => {
    cache
      .match(zipfile)
      .then(response => response.arrayBuffer())
      .then(stream => ready(stream))
      .catch(() => {
        // キャッシュ処理
        fetch(zipfile)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok.');
            }
            const copy = response.clone();
            cache.put(zipfile, response);
            return copy.arrayBuffer();
          })
          .then(stream => ready(stream))
          .catch(e =>
            console.error(
              'There has been a problem with your fetch operation: ' + e.message
            )
          );
        // .catch(e => alert('Save to cache. please reselect zip file.'));
      });
  });
  $(':input').attr('disabled', '');
}
/**
 * 選択されたファイルを解凍
 */
function handleSelect() {
  const select = document.getElementById('files');
  const option = select.querySelectorAll('option')[select.selectedIndex];
  const filename = option.dataset.midiplayerFilename;

  if (filename) {
    handleInput(filename, select.zip.decompress(filename));

    // ページのタイトルを反映
    let title = document.getElementById('files').value;
    title = title.substr(0, title.lastIndexOf('.'));
    document.title =
      title + ' ' + document.getElementById('zips').value + ' / SMF.Player';

    const hash =
      '#zip=' +
      encodeURIComponent($('#zips').val()) +
      '&file=' +
      encodeURIComponent(filename);
    $('link[rel="canonical"]').attr('href') + hash;

    // MIDIファイルに埋め込まれたメタデータを取得
    $('#music_title').val(
      Encoding.convert(player.getSequenceName(1), 'UNICODE', 'AUTO')
    );
    $('#copyright').val(
      Encoding.convert(player.getCopyright(), 'UNICODE', 'AUTO')
    );

    // pushstateを使用
    if (window.history && window.history.pushState) {
      window.history.pushState(document.title, null, hash);
      return false;
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
  $('#music_title, #copyright, #text_event').val('');
  document.title = 'Mabinogi MML Emulator';

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
  player.setMasterVolume($('#volume').val() * 16383);
  // $("#time-total").text(player.getTotalTime());
  // よく分からんが非同期で読み込むらしい
  setTimeout(function () {
    player.play();
  }, 1000);
}

/**
 * ランダム再生
 */
function randomPlay() {
  const select = document.getElementById('files');
  select.selectedIndex = ~~(select.length * Math.random());
  handleSelect(select);
}

/**
 * Zipファイルのランダム選択
 */
function randomArchive() {
  const select = document.getElementById('zips');
  select.selectedIndex = ~~(select.length * Math.random());
  handleSelect(select);
}

/**
 * IFRAMEから送られてくるwindow.postMessageを監視
 */
$(window).on('message', function (e) {
  const event = e.originalEvent.data; // Should work.
  const selected = $('#music').prop('selectedIndex');

  switch (event) {
    case 'endoftrack':
      // 曲が終了したとき
      // 曲一覧の現在選択中の項目番号

      player.stop();

      // 曲は終了しても、player.pauseの値が変化しないので、ここで、再生ボタンにする。
      $('#play')
        .html('<em class="bi bi-play-fill"></em>')
        .removeClass('btn-success')
        .addClass('btn-primary');
      if ($('#random').is(':checked')) {
        randomPlay();
      } else {
        if (selected !== 0) {
          // ループで最初に戻った場合（player.positionがリセットされた場合）
          // 次の曲を選択
          if (selected == $('#files option').length) {
            // 末尾の場合最初に戻る
            $('#files').prop('selectedIndex', 0);
          } else {
            $('#files').prop('selectedIndex', selected + 1);
          }
          // 曲を変更
          handleSelect(document.getElementById('files'));
        }
      }
      break;
    case 'progress':
      $('#info p').text('Loading soundfont...');
      break;
    case 'link,ready':
      // WMLが読み込まれた時
      isReady = true;
      if (document.querySelector('#random').checked) {
        handleSelect(document.querySelector('#files'));
      }
      $('#info').addClass('alert-success').removeClass('alert-warning');
      $('#info p').text('Ready.');
      $(':input').prop('disabled', false);
      break;
  }
});

/**
 * インターバル関数
 */
setInterval(function () {
  if (isReady) {
    // player.pauseの値で再生/一時停止ボタンを変化させる
    // ただし、smfplayer.jsのバグでplayer.loadMidiFile()が実行された直後、
    // 再生していない状態でもplayer.pauseの値がtrueになってしまうので、
    // もう一工夫いる。
    if (player.pause) {
      $('#play')
        .html('<em class="bi bi-play-fill"></em>')
        .removeClass('btn-success')
        .addClass('btn-primary');
    } else {
      $('#play')
        .html('<wm class="bi bi-pause-fill"></em>')
        .removeClass('btn-primary')
        .addClass('btn-success');
    }
    const percentage = ((player.getPosition() / player.getLength()) * 100) | 0;
    $('#music-progress .progress-bar')
      .css('width', percentage + '%')
      .text(percentage + '%');
    $('#time-now').text(player.getTime());
    $('#time-total').text(player.getTotalTime());
    $('#current-tempo').text(player.getTempo());

    if (percentage === 100) {
      // 次の曲
      player.sendGmReset();
      const selected = $('#files').prop('selectedIndex');
      if (selected == $('#files option').length) {
        // 末尾の場合最初に戻る
        $('#files').prop('selectedIndex', 0);
      } else {
        // 今選択されてる項目の次の項目を選択
        $('#files').prop('selectedIndex', selected + 1);
      }
      handleSelect();
    }
  }
}, 100);
