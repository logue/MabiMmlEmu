/*!
 * PSGConverter.js
 * v2.0
 * Copyright (c)2007-2013,2018 Logue <http://logue.be/> All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function (definition) {
	// CommonJS
	if (typeof exports === "object") {
		module.exports = definition();

		// RequireJS
	} else if (typeof define === "function" && define.amd) {
		define(definition);

		// <script>
	} else {
		PSGConverter = definition();
	}
})(function () {
	'use strict';
	var PSGConverter = function (isGM = true) {
		var lang = navigator.language || navigator.userLanguage;
		this.MESSAGES = this.messages[lang] ? this.messages[lang] : this.messages['en'];
		this.INSTSUMENTALS = this.Instrumentals;

		this.isGM = isGM;

		this.NOTE_TABLE = {
			'c': 0,
			'd': 2,
			'e': 4,
			'f': 5,
			'g': 7,
			'a': 9,
			'b': 11
		};

		this.GM_RESET = String.fromCharCode(
			0xF0, 0x05, 0x7E, 0x7F, 0x09, 0x01, 0xF7 // GM Reset F0 7E 7F 09 01 F7
		);

		// MIDIトラック　スタート
		this.TRACK_START = String.fromCharCode(
			0x4d, 0x54, 0x72, 0x6b
		);
		// MIDIトラック　終わり
		this.TRACK_END = String.fromCharCode(
			0xFF, 0x2F, 0x00
		);

		this.MIME = 'audio/midi';
		// 解像度
		this.DIVISION_LENGTH = 96;
		// 1小節
		this.SEMIBREVE = this.DIVISION_LENGTH * 4;
		// １拍（Tick連動）
		this.MINIM = this.DIVISION_LENGTH * 2;

		// MMLのチャンネルごとのマッチパターン
		this.MML_PATTERN = /[A-GLNORTV<>][\+\#-]?[0-9]*\.?&?/ig;
	}

	// 楽器の定義
	// 楽器名:{inst:GM音源のマッピング, max:最高音, min:最低音, mms:mmSeqの楽器番号, dls:MSXSplitの楽器番号}
	// minの値とmaxの値が等しい場合、ドラムパートとしてみなす。
	// 同一音がなる楽器はサポートせず
	PSGConverter.prototype.Instrumentals = {
		// 25.  Acoustic Guitar (nylon)
		0: {
			name: 'Lute',
			no: 24,
			max: 88,
			min: 16,
			flmml: '@3 @W32 @E1,0,24,80,16 @F1,32,72,24'
		},
		// 29.  Electric Guitar (muted)
		1: {
			name: 'Ukulele',
			no: 28,
			max: 88,
			min: 16,
			fm: '@3 @W16 @E1,0,24,96,16 @F1,32,64,48'
		},
		// 106. Banjo
		2: {
			name: 'Mandorin',
			no: 105,
			max: 88,
			min: 16,
			fm: '@3 @W24 @E1,0,48,36,12 @F1,32,64,64'
		},
		// 73.  Piccolo
		3: {
			name: 'Whistle',
			no: 72,
			max: 88,
			min: 60,
			fm: '@0 @E1,4,24,64,4 @F1,36,80,18 @L16,36,0,128,0,0'
		},
		// 78.  Shakuhachi
		4: {
			name: 'Roncadora',
			no: 77,
			max: 83,
			min: 48,
			fm: '@3 @W56 @E1,4,36,64,6 @F1,36,72,18 @L32,36,0,128,0,0'
		},
		// 74.  Flute
		5: {
			name: 'Flute',
			no: 73,
			max: 83,
			min: 48,
			fm: '@2 @E1,8,48,80,24 @F1,36,80,18 @L16,36,0,128,0,0'
		},

		// 72.  Clarinet
		6: {
			name: 'Chalumeau',
			no: 71,
			max: 59,
			min: 24,
			fm: '@1 @E1,8,24,64,16 @F1,24,80,48 @L16,36,0,128,0,0'
		},
		// 59.  Tuba
		18: {
			name: 'Tuba',
			no: 58,
			max: 59,
			min: 24,
			fm: '@3 @W30 @E1,4,36,70,12 @F1,36,72,48 @L16,36,0,128,0,0'
		},
		// 47.  Orchestral Harp
		19: {
			name: 'Lyre',
			no: 46,
			max: 88,
			min: 16,
			fm: '@3 @W48 @E1,0,48,32,0 @F1,24,56,64'
		},
		// 31.  Electric Guitar (distortion)
		20: {
			name: 'E.Guitar',
			no: 30,
			max: 88,
			min: 16,
			fm: '@3 @W6 @E1,0,200,0,15'
		},
		// 1.   Acoustic Grand Piano
		21: {
			name: 'Piano',
			no: 0,
			max: 88,
			min: 16,
			fm: '@3 @W80 @E1,0,170,0,12 @F1,24,64,24 @E2,0,30,0,0'
		},
		// 41.  Viollin
		22: {
			name: 'Viollin',
			no: 40,
			max: 88,
			min: 16,
			fm: '@1 @E1,8,20,110,12'
		},
		// 43.  Chello
		23: {
			name: 'Chello',
			no: 40,
			max: 88,
			min: 16,
			fm: '@1 @E1,8,20,110,12'
		},
		// 49.  Orchestra Kit (Concert SD)
		65: {
			name: 'Snare',
			no: 48,
			max: 38,
			min: 38,
			fm: '@4 @N90 @E1,0,64,0,0   @F1,64,48,12'
		},
		// 49.  Orchestra Kit (Gran Casa)
		66: {
			name: 'Bass Drum',
			no: 48,
			max: 35,
			min: 35,
			fm: '@4 @N64 @E1,0,127,0,0  @F1,64,12,127'
		},
		// 49.  Orchestra Kit (Concert SD)
		67: {
			name: 'Drum',
			no: 48,
			max: 40,
			min: 40,
			fm: '@4 @N90 @E1,0,64,0,0 @F1,64,48,12'
		},
		// 49.  Orchestra Kit (Hand Cymbal)
		68: {
			name: 'Cymbal',
			no: 48,
			max: 57,
			min: 57,
			fm: '@4 @N0 @E1,0,50,0,0 @F1,64,127,0'
		},
		// 14.  Xylophone
		77: {
			name: 'Xylophone',
			no: 15,
			max: 88,
			min: 16,
			fm: '@3 @W80 @E1,0,40,30,4 @F1,36,56,18'
		},
	};


	PSGConverter.prototype.messages = {
		'en': {
			'Rank': 'Rank',
			'Inst': 'Instrument',
			'Melody': 'Melody',
			'Chord1': 'Chord 1',
			'Chord2': 'Chord 2',

			'rewind': 'Rewind',
			'play': 'Play',
			'pause': 'Pause',
			'copy': 'Copy',
			'e_rewind': 'Rewind (Ensemble)',
			'e_play': 'Play (Ensemble)',
			'e_pause': 'Pause (Ensemble)',
			'export': 'Export',
			'msg_copied': 'Copied MML to clipboard.',

			'Lute': 'Lute',
			'Ukulele': 'Ukulele',
			'Mandorin': 'Mandorin',
			'Whistle': 'Whistle',
			'Flute': 'Flute',
			'Roncadora': 'Roncadora',
			'Chalumeau': 'Chalumeau',
			'Tuba': 'Tuba',
			'Lyre': 'Lyre',
			'E.Guitar': 'Electric Guitar',
			'Piano': 'Piano',
			'Viollin': 'Viollin',
			'Chello': 'Chello',
			'Snare': 'Snare',
			'Drum': 'Drum',
			'Bass Drum': 'Bass Drum',
			'Cymbal': 'Cymbal',
			'Xylophone': 'Xylophone'
		},
		ja: {
			'Rank': 'ランク',
			'Inst': '楽器',
			'Melody': 'メロディ',
			'Chord1': '和音１',
			'Chord2': '和音２',

			'rewind': '巻き戻し',
			'play': '再生',
			'pause': '一時停止',
			'copy': 'コピー',
			'e_rewind': '巻き戻し（合奏）',
			'e_play': '再生（合奏）',
			'e_pause': '一時停止（合奏）',
			'export': 'エクスポート',
			'msg_copied': 'クリップボードにコピーしました。',

			'Lute': 'リュート',
			'Ukulele': 'ウクレレ',
			'Mandorin': 'マンドリン',
			'Whistle': 'ホイッスル',
			'Flute': 'フルート',
			'Roncadora': 'ロンカドーラ',
			'Chalumeau': 'シャリュモー',
			'Tuba': 'チューバ',
			'Lyre': 'リラ',
			'E.Guitar': 'エレキギター',
			'Piano': 'ピアノ',
			'Viollin': 'バイオリン',
			'Chello': 'チェロ',
			'Snare': 'スネア',
			'Drum': '小太鼓',
			'Bass Drum': '大太鼓',
			'Cymbal': 'シンバル',
			'Xylophone': 'シロフォン'
		},
		ko: {
			'Rank': '순위',
			'Inst': '악기',
			'Melody': '멜로디',
			'Chord1': '화음 1',
			'Chord2': '화음 2',

			'rewind': '되감기',
			'play': '재생',
			'pause': '일시 정지',
			'copy': '복사',
			'e_rewind': '되감기 (합주)',
			'e_play': '재생 (합주)',
			'e_pause': '일시 정지 (합주)',
			'export': '내보내기',
			'msg_copied': '클립 보드에 복사되었습니다.',

			'Lute': '류트',
			'Ukulele': '우쿨렐레',
			'Mandorin': '만돌린',
			'Whistle': '휘슬',
			'Flute': '플루트',
			'Roncadora': '론카도라',
			'Chalumeau': '샬루모',
			'Tuba': '피시스 튜바',
			'Lyre': '리라',
			'Snare': '스네어 드럼',
			'Drum': '작은 북',
			'Bass Drum': '큰 북',
			'Cymbal': '심벌즈',
			'Xylophone': '실로폰',
			'E.Guitar': '일렉트릭 기타'
		},
		zh: {
			'Rank': '等级',
			'Inst': '仪器',
			'Melody': '旋律',
			'Chord1': '和弦 1',
			'Chord2': '和弦 2',

			'rewind': '回卷',
			'play': '播放',
			'pause': '暂停',
			'copy': '复制',
			'e_rewind': '回卷 (合奏)',
			'e_play': '播放 (合奏)',
			'e_pause': '暂停 (合奏)',
			'export': '输出',
			'msg_copied': '复制的MML到剪贴板。',

			'Lute': '鲁特琴',
			'Ukulele': '夏威夷四弦琴',
			'Mandorin': '曼陀林',
			'Whistle': '短笛',
			'Flute': '长笛',
			'Roncadora': '哆啦',
			'Chalumeau': '单簧管',
			'Tuba': '大號',
			'Lyre': '七弦琴',
			'Snare': '军鼓',
			'Drum': '小鼓',
			'Bass Drum': '低音鼓',
			'Cymbal': '钹',
			'Xylophone': '木琴',
			'E.Guitar': '电吉他'
		}
	};

	// トラックごとの処理
	PSGConverter.prototype.genTrack = function (mml, chid, inst, pan, effect, Min, Max, track, trackName, isMelodyTrack) {
		var isDrum = (Min == Max) ? true : false;
		var cLength = this.DIVISION_LENGTH; // デフォルトの音長
		var cOctave = 4; // デフォルトのオクターブ
		var cVolume = 8; // デフォルトの音量
		var cNote = 0; // "&"記号処理用
		var tieEnabled = false; // "&"記号処理用
		var time = this.SEMIBREVE; // 先頭を１小節あける。（ノイズがでるため）
		var isDrum = false;

		if (this.isGM && Min == Max) {
			// GM音源だった場合リズムトラックで打楽器を鳴らす
			chid = 9;
			isDrum = true;
		}
		var part_msgs = [];

		// トラック名
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x03, trackName.length) + trackName
		});
		// PrCh 楽器変更
		part_msgs.push({
			time: 96,
			msg: String.fromCharCode(0xc0 + chid, inst)
		});
		// パンポット
		part_msgs.push({
			time: 192,
			msg: String.fromCharCode(0xb0 + chid, 10, pan)
		});
		// エフェクト
		part_msgs.push({
			time: 288,
			msg: String.fromCharCode(0xb0 + chid, 91, effect)
		});

		var notes = '';
		try {
			notes = mml.match(/[A-GLNORTV<>][\+\#-]?[0-9]*\.?&?/ig);
		} catch (e) {
			return '';
		}

		for (var mnid = 0; mnid < notes.length; mnid++) {
			// 音長(L)、オクターブ(O<>)、テンポ（T）、ボリューム（V）をパース
			if (notes[mnid].match(/([LOTV<>])([1-9][0-9]*|0?)(\.?)(&?)/i)) {
				if (tieEnabled == 1 && RegExp.$4 != '&') {
					// タイ記号
					tieEnabled = 0;
					part_msgs.push({
						'time': time,
						'msg': String.fromCharCode(0x80 + chid, cNote, this.MINIM)
					});
				}
				switch (RegExp.$1) {
					case 'L':
					case 'l':
						// 音長設定 Ln[.] (n=1～192)
						if (RegExp.$2 >= 1 && RegExp.$2 <= this.MINIM) {
							cLength = Math.floor(this.SEMIBREVE / RegExp.$2);
							if (RegExp.$3 == '.') {
								cLength = Math.floor(cLength * 1.5);
							}
						}
						break;
					case 'O':
					case 'o':
						// オクターブ設定 On (n=1～8)
						if (RegExp.$2 >= 1 && RegExp.$2 <= 8) {
							cOctave = parseInt(RegExp.$2);
						}
						break;
					case 'T':
					case 't':
						// テンポ設定 Tn (n=32～255)
						if (RegExp.$2 >= 32 && RegExp.$2 <= 255) {
							part_msgs.push({
								time: time,
								msg: String.fromCharCode(0xff, 0x51, 0x03) + this.getBytes(Math.floor(60000000 / RegExp.$2), 3)
							});
						}
						break;
					case 'V':
					case 'v':
						//ボリューム調整
						if (RegExp.$2 != '' && RegExp.$2 >= 0 && RegExp.$2 <= 15) {
							cVolume = parseInt(RegExp.$2);
						}
						break;

					// 簡易オクターブ設定 {<>}
					case '<':
						cOctave = (cOctave <= 1) ? 1 : (cOctave - 1);
						break;
					case '>':
						cOctave = (cOctave >= 8) ? 8 : (cOctave + 1);
						break;
				}
			}
			// ノート命令（CDEFGAB）、絶対音階指定（N）をパース
			if (notes[mnid].match(/([A-GN])([\+\#-]?)([0-9]*)(\.?)(&?)/i)) {
				var note = 0;
				var tick = cLength;
				var val = RegExp.$3;
				switch (RegExp.$1) {
					case 'n':
					case 'N':
						// Nn, [A-G]数字なし -> Lで指定した長さに設定
						if ((12 <= val) && (val <= 95)) note = val;
						break;
					default:
						// [A-G] 音名表記
						// 音符の長さ指定: n分音符→128分音符×tick数
						if (1 <= val && val <= this.MINIM) tick = Math.floor(this.SEMIBREVE / val); // L1 -> 384tick .. L64 -> 6tick
						if (RegExp.$4 == ".") tick = Math.floor(tick * 1.5); // 付点つき -> 1.5倍

						if (!isDrum) {
							// 音名→音階番号変換(C1 -> 12, C4 -> 48, ..)
							note = 12 * cOctave + this.NOTE_TABLE[RegExp.$1.toLowerCase()];

							// 調音記号の処理
							switch (RegExp.$2) {
								case '+':
								case '#':
									note++;
									break;
								case '-':
									note--;
									break;
							}
						}
						break;
				}

				if (!isDrum) {
					// オクターブ調整（楽器の音域エミュレーション）
					while (note < Min) note = note + 12;
					while (note > Max) note = note - 12;
					note += 12; // 1オクターブ低く演奏される不具合を修正 060426
				} else {
					// ドラムパートの場合ノートを強制的に指定
					note = Max;
				}

				// c&dなど無効なタイの処理
				if (tieEnabled == true && note != cNote) {
					tieEnabled = false;
					// NoteOff
					part_msgs.push({
						time: time,
						msg: String.fromCharCode(0x80 + chid, cNote, 8 * cVolume)
					});
				}

				// 前回タイ記号が無いときのみノートオン
				if (tieEnabled == false)
					// NoteOn
					part_msgs.push({
						time: time,
						msg: String.fromCharCode(0x90 + chid, note, 8 * cVolume)
					});

				time += tick; // タイムカウンタを音符の長さだけ進める

				// ノートオフ命令の追加
				if (RegExp.$5 == '&') { // タイ記号の処理
					tieEnabled = true;
					cNote = note; // 直前の音階を保存
				} else {
					tieEnabled = false;
					// 発音と消音が同じ時間の場合、そこのノートが再生されないため、消音時にtimeを-1する。
					// NoteOff
					part_msgs.push({
						time: time - 1,
						msg: String.fromCharCode(0x80 + chid, note, 8 * cVolume)
					});
				}
			} else if (tieEnabled == true) { // 無効なタイの処理
				tieEnabled = false;
				// NoteOff
				part_msgs.push({
					time: time - 1,
					msg: String.fromCharCode(0x80 + chid, cNote, 8 * cVolume)
				});
			}

			// 休符設定 R[n][.] (n=1～64)
			if (notes[mnid].match(/[rR]([0-9]*)(\.?)/)) {
				tick = cLength; // 数字なし -> Lで指定した長さに設定
				var len = RegExp.$1;
				if (1 <= len && len <= this.MINIM) tick = Math.floor(this.SEMIBREVE / len); // L1 -> 128tick .. L64 -> 2tick
				if (RegExp.$2 == ".") tick = Math.floor(tick * 1.5); // 付点つき -> 1.5倍
				time += tick; // タイムカウンタを休符の長さだけ進める
			}
		}
		//part_msgs.sort(function(a, b) {return a["time"] < b["time"] ? 1 : -1;});

		// TrkEnd
		part_msgs.push({
			time: time,
			msg: String.fromCharCode(0xff, 0x2f, 0x00)
		});

		var track_data = '';
		var last_time = 0;
		for (let i in part_msgs) {
			var dt = part_msgs[i].time - last_time;
			last_time = part_msgs[i].time;
			track_data += this.writeVarLen(dt) + part_msgs[i].msg;
		}

		var ret = [
			this.TRACK_START,						// MTrk
			this.getBytes(track_data.length, 4),	// Block Length
			track_data,								// Midi data
			//			this.TRACK_END							// Trk End
		].join('');
		return ret;
	}

	PSGConverter.prototype.getMasterTrack = function (trackName) {
		var part_msgs = [];
		// トラック名
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x03, trackName.length) + trackName
		});
		// TimeSig 4/4 24 8
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08)
		})
		// Tempo 120
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x51, 0x03) + this.getBytes(500000, 3)
		})
		// SMPTE 96 0 0 0 0
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x54, 0x05, this.DIVISION_LENGTH, 0x00, 0x00, 0x00, 0x00)
		});
		// GMリセット
		part_msgs.push({
			time: 0,
			msg: this.GM_RESET
		});
		// TrkEnd
		part_msgs.push({
			time: 0,
			msg: String.fromCharCode(0xff, 0x2f, 0x00)
		});

		var track_data = '';
		var last_time = 0;
		for (let i in part_msgs) {
			var dt = part_msgs[i].time - last_time;
			last_time = part_msgs[i].time;
			track_data += this.writeVarLen(dt) + part_msgs[i].msg;
		}

		var ret = [
			// MTrk
			this.TRACK_START,
			// Block Length
			this.getBytes(track_data.length, 4),
			// Midi data
			track_data,
			// Trk End
			//			this.TRACK_END
		].join('');
		return ret;
	}

	// MML>MIDI変換コアルーチン
	PSGConverter.prototype.toString = function (mmls = {}, isDataUri = true) {
		var nMin = 16,
			nMax = 88;

		var track = 0;
		var ret = [];

		for (var i = 0; i < mmls.length; i++) { // iの値はパート用番号として流用
			var p = mmls[i];
			var pan = (p.pan && p.pan >= 0 && p.pan < 128) ? Math.round(p.pan) : 64;
			var effect = (p.effect && p.effect >= 0 && p.effect < 128) ? Math.round(p.effect) : 40;
			var instrumental = this.Instrumentals[p.inst];
			var nInst = p.inst;
			var notes = '';

			//console.log(p.inst, instrumental);

			if (this.isGM) {
				nMin = instrumental.min;
				nMax = instrumental.max;
				nInst = instrumental.no;
			}

			// MMLをサニタイズして配列化
			var track_mml = this.sanitize(p.mml);

			if (track_mml === undefined) continue;

			if (p.inst >= 65) {
				// ドラムの場合、メロディ→和音１という順にMMLが再生される。和音２は無視
				var d_mml = track_mml[0] + track_mml[1];
				notes = this.genTrack(d_mml, i, nInst, pan, effect, nMin, nMax, track, instrumental.name, true);
				if (notes == '') continue;
				ret.push(notes);
				track++;
			} else {
				for (var part = 0; part < p.mml.length; part++) {
					notes = this.genTrack(track_mml[part], i, nInst, pan, effect, nMin, nMax, track, instrumental.name, ((part == 0) ? true : false));
					if (notes == '') continue;
					ret.push(notes);
					track++;
				}
			}

		}
		ret.unshift(this.getMasterTrack('PSGConverter'));
		track++;
		ret.unshift(String.fromCharCode(
			0x4D, 0x54, 0x68, 0x64, // chunk ID "MThd"
			0x00, 0x00, 0x00, 0x06, // chunk size
			0x00, 0x01, // format type (Midi format1)
			0x00, track, // number of tracks
			0x00, this.DIVISION_LENGTH // ticks per beat
		));

		// ヘッダーとともに内容を返す
		var stream = ret.join("");

		return isDataUri ? 'data:' + this.MIME + ';base64,' + this.base64encode(stream) : stream;
	}

	// MabiMMLをFLMMLに変換
	PSGConverter.prototype.toFlmml = function (mmls = {}) {
		for (var i = 0; i < mmls.length; i++) {	// iの値はパート用番号として流用
			var p = mmls[i];

			var inst = (p.inst && p.inst >= 0 && p.inst < 128) ? Math.round(p.inst) : 0;
			var pan = (p.pan && p.pan >= 0 && p.pan < 128) ? Math.round(p.pan) : 64;
			var track = i + 1;
			if (!p.mml[0] && !p.mml[1] && !p.mml[2]) continue;	// MMLが入っていない場合スキップ
			ret += '/** ' + track + ' **/' + "\n";
			header += '$track' + track + ' = ' + this.INSTSUMENTALS[inst].flmml + ' @P' + p.pan + ' v8l4o' + default_octave + ";\n";

			if (inst >= 65) {
				// ドラムの場合、メロディ→和音１という順にMMLが再生される。和音２は無視
				var d_mml = p.mml[0] + p.mml[1];
				var isDram = (inst !== 77) ? true : false;
				ret += '$track' + track + ' ' + this.flmmlTrack(d_mml, isDram) + ';' + "\n";
			} else {
				for (var part = 0; part < p.mml.length; part++) {
					ret += '$track' + track + ' ' + this.flmmlTrack(p.mml[part], false) + ';' + "\n";
				}
			}
		}
		return header + ret;
	}

	PSGConverter.prototype.flmmlTrack = function (mml, isDrum) {
		var default_octave = 5;
		var noteRevTable = ['C', 'C+', 'D', 'D+', 'E', 'F', 'F+', 'G', 'G+', 'A', 'A+', 'B'];
		var offset = 1; // 1オクターブ高くする。

		var part = [];
		mml_notes = mml.match(/[abcdefglnortvABCDEFGLNORTV<>][\+\#-]?[0-9]*\.?&?/g);
		if (mml_notes == null) { return false; }
		var cOctave = default_octave;
		var flmml = [];
		for (var mnid = 0; mnid < mml_notes.length; mnid++) {      // 命令ごとのループ
			var mml_note = mml_notes[mnid];
			// 現在のオクターブを取得
			if (isDrum != 0) {
				if (mml_note.match(/[oO](0|[1-9][0-9]*)/)) {
					flmml[mnid] = '';
				} else if (mml_note.match(/</)) {
					flmml[mnid] = '';
				} else if (mml_note.match(/>/)) {
					flmml[mnid] = '';
				} else if (mml_note.match(/[nN](0|[1-9][0-9]*)/)) {
					flmml[mnid] = 'c';
				} else if (mml_note.match(/([abcdefgABCDEFG])([\+\#-]?)([1-9][0-9]*|0?)(\.?)(&?)/)) {
					flmml[mnid] = 'c' + RegExp.$3 + RegExp.$4 + RegExp.$5;
				} else {
					flmml[mnid] = mml_note;
				}
			} else {
				if (mml_note.match(/[oO](0|[1-9][0-9]*)/)) {
					cOctave = parseInt(RegExp.$1) + offset;
					if (isDrum == 0) {
						flmml[mnid] = 'o' + cOctave;
					} else {
						flmml[mnid] = '';
					}
				} else if (mml_note.match(/</)) {
					// 不等号記号の場合、FLMMLの仕様により、記号をひっくり返す。（#OCTAVE REVERSEを使えば済むけどね）
					cOctave = cOctave - 1;
					if (isDrum == 0) {
						flmml[mnid] = '>';
					} else {
						flmml[mnid] = '';
					}
				} else if (mml_note.match(/>/)) {
					cOctave = cOctave + 1;
					if (isDrum == 0) {
						flmml[mnid] = '<';
					} else {
						flmml[mnid] = '';
					}
				} else if (mml_note.match(/[nN](0|[1-9][0-9]*)/)) {
					// 音階絶対指定命令
					var nValue = parseInt(RegExp.$1);
					var Octave = Math.floor(nValue / 12) + offset;    // ノート値を12で割った値がオクターブ
					var note = noteRevTable[nValue % 12];     // あまりがノート値
					// 上で取得したオクターブが等しければオクターブ命令を省略。
					if (cOctave == Octave) {
						flmml[mnid] = note;
					} else {
						if (cOctave == Octave + 1) {
							flmml[mnid] = ('>' + note + '<');
						} else if (cOctave == Octave - 1) {
							flmml[mnid] = ('<' + note + '>');
						} else {
							flmml[mnid] = ('o' + Octave + note + 'o' + cOctave);
						}
					}
				} else {
					// それ以外の命令は変換しない
					flmml[mnid] = mml_note;
				}
			}
		}
		return flmml.join("");
	}


	//MMLを正規化
	PSGConverter.prototype.sanitize = function (str) {
		var mml = str.replace(/\r\n|\n\r|\n|\r|\s|\t|/g, ''); // Remove line break and space
		var ret = mml.match(/^MML\@([0-9A-GLNORTV#<>.&+-]*)?,([0-9A-GLNORTV#<>.&+-]*)?,([0-9A-GLNORTV#<>.&+-]*)?;$/i);
		if (ret !== null && typeof (ret) == 'object') {
			ret.shift(); // 一番先頭の配列は削除
			return ret;
		}
		return '';
	}

	//// Utilities
	// int to bytes (length: len)
	PSGConverter.prototype.getBytes = function (n, len) {
		var buf = parseInt(n);
		var str = '';
		for (var i = 0; i < len; i++) {
			str = String.fromCharCode(buf & 0xff) + str;
			buf >>>= 8;
		}
		return str;
	}
	// int to variable length string
	PSGConverter.prototype.writeVarLen = function (value) {
		var buf = parseInt(value);
		var str = String.fromCharCode(buf & 0x7f);
		buf >>>= 7;
		while (buf > 0) {
			str = String.fromCharCode(0x80 + (buf & 0x7f)) + str;
			buf >>>= 7;
		}
		return str;
	}

	// BASE64 (RFC2045) Encode/Decode for string in JavaScript
	// Version 1.2 Apr. 8 2004 written by MIZUTANI Tociyuki
	// Copyright 2003-2004 MIZUTANI Tociyuki
	// http://tociyuki.cool.ne.jp/archive/base64.html
	PSGConverter.prototype.base64encode = function (s) {
		try {
			// Browser native function
			return btoa(s);
		} catch (e) {
			var base64list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
			var t = '',
				p = -6,
				a = 0,
				i = 0,
				v = 0,
				c;
			while ((i < s.length) || (p > -6)) {
				if (p < 0) {
					if (i < s.length) {
						c = s.charCodeAt(i++);
						v += 8;
					} else {
						c = 0;
					}
					a = ((a & 255) << 8) | (c & 255);
					p += 8;
				}
				t += base64list.charAt((v > 0) ? (a >> p) & 63 : 64)
				p -= 6;
				v -= 6;
			}
			return t;
		}
	}
	// Export the class into the global namespace or for CommonJs
	return PSGConverter;
});