// MabiMML 2 FLMML Converter
// Copyright (c)2008-2009,2013 Logue <http://logue.be/> All rights reserved.

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// Lorelei JSMML Player based on JSMML(http://coderepos.org/share/wiki/JSMML)

// DLSの音色番号に対応した楽器設定
var dls2flmml = {
	0  :'@3 @W32 @E1,0,24,80,16 @F1,32,72,24',	// Lute
	1  :'@3 @W16 @E1,0,24,96,16 @F1,32,64,48',	// Ukulele
	2  :'@3 @W24 @E1,0,48,36,12 @F1,32,64,64',	// Mandorin
	3  :'@0      @E1,4,24,64,4  @F1,36,80,18 @L16,36,0,128,0,0',	// Whistle
	4  :'@3 @W56 @E1,4,36,64,6  @F1,36,72,18 @L32,36,0,128,0,0',	// Roncadora
	5  :'@2      @E1,8,48,80,24 @F1,36,80,18 @L16,36,0,128,0,0',	// Flute
	6  :'@1      @E1,8,24,64,16 @F1,24,80,48 @L16,36,0,128,0,0',	// Chalumeau
	18 :'@3 @W30 @E1,4,36,70,12 @F1,36,72,48 @L16,36,0,128,0,0',	// Tuba
	19 :'@3 @W48 @E1,0,48,32,0  @F1,24,56,64',	// Lyre
	20 :'@3 @W6  @E1,0,200,0,15 ',	// E.Guitar
	21 :'@3 @W80 @E1,0,170,0,12 @F1,24,64,24 @E2,0,30,0,0',	// Piano
	22 :'@1      @E1,8,20,110,12',	// Viollin
	23 :'@1      @E1,8,20,110,12',	// Chello
	66 :'@4 @N64 @E1,0,127,0,0  @F1,64,12,127',	// Bass Drum
	67 :'@4 @N90 @E1,0,64,0,0   @F1,64,48,12',	// Drum
	68 :'@4 @N0  @E1,0,50,0,0   @F1,64,127,0',	// Cymbal
	77 :'@3 @W80 @E1,0,40,30,4  @F1,36,56,18'	// Xylophone
};

// FM音源版（未使用）
var fm_inst = [
	// Lute
	'#FMGAIN 0',
	'#OPN@0 {',
	'/* AL FB */',
	'    1 7',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   31 10  8  4  2 34  2 13  0  0',
	'   31  9  7  4  2 36  0  2  0  0',
	'   31  9  8  4  2 38  0  1  0  0',
	'   31  4  2  8  2  0  1  1  0  0',
	'}',
	// Chalumeau
	'#OPN@6{',
	'/* AL FB */',
	'   3 7',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   31  0  0  7  0 40  0  8  0  0',
	'   27 17  0  4  4 45  0  8  0  0',
	'   31  0  0  8  0 37  0  4  0  0',
	'   18  7  0  8  1  0  0  1  0  0',
	'}',
	// Tuba
	'#OPN@18 {',
	'/* AL FB */',
	'    4  5',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   20 15  0 10  3 16  0  1  7  0',
	'   30  0  0 10  0  0  0  1  7  0',
	'   20 15  0 10  3 16  0  1  3  0',
	'   30  0  0 10  0  0  0  1  3  0',
	'}',
	// Piano
	'#OPN@19 {',
	'/* AL FB */',
	'    1  3',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   31  9  0  0 15 40  2  6  3  0',
	'   31 11  0  8 15 30  2  1  7  0',
	'   31  8  0  0 15 40  2  1  0  0',
	'   31  8  0  8 14  0  2  1  0  0',
	'}',
	// Lyre
	'#OPN@21 {',
	'/* AL FB */',
	'   4 5 ',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   31  5  0  0  0 23  1  1  3  0',
	'   20 10  3  7  8  0  1  1  3  0',
	'   31  3  0  0  0 25  1  1  7  0',
	'   31 12  3  7 10  2  1  1  7  0',
	'}',
	// Xyrophone
	'#OPN@77{',
	'/* AL FB */',
	'    5  3',
	'/* AR DR SR RR SL TL KS ML DT1 AME */',
	'   31 12  0  9  5 38  0 12  0  0',
	'   31 15  4  5 11  9  0  3  0  0',
	'   31 12  4  8 12  9  0  2  3  0',
	'   31  6  4  8 11  9  0  1  7  0',
	'}'
].join("\n");


function mabimml2flmml(param){
	var ret = '',header='/** Setup **/'+"\n", track=0;
	// FM音源用定義を展開
//	header += fm_inst + "\n";
	for (var i = 0; i < param.length; i ++) {	// iの値はパート用番号として流用
		var p = param[i];

		var inst = (p.inst && p.inst >= 0 && p.inst < 128) ? Math.round(p.inst) : 0;
		var pan = (p.pan && p.pan >= 0 && p.pan < 128) ? Math.round(p.pan) : 64;
		var track = i+1;
		if (!p.mml[0] && !p.mml[1] && !p.mml[2]) continue;	// MMLが入っていない場合スキップ
		ret += '/** '+track+' **/'+"\n";
		header += '$track'+track+' = '+dls2flmml[inst]+' @P'+ p.pan + ' v8l4o' + default_octave +";\n";

		if (inst >= 65) {
			// ドラムの場合、メロディ→和音１という順にMMLが再生される。和音２は無視
			var d_mml = p.mml[0] + p.mml[1];
			var isDram = (inst !== 77) ? true : false;
			ret += '$track'+ track + ' '+ flmml_track(d_mml, isDram) + ';'+"\n";
		}else{
			for(var part = 0; part < p.mml.length; part++) {
				ret += '$track'+ track + ' '+  flmml_track(p.mml[part], false) + ';'+"\n";
			}
		}
	}
	return header + ret;
}

var default_octave = 5;
function flmml_track(mml, isDrum){
	var noteRevTable = ['C','C+','D','D+','E','F','F+','G','G+','A','A+','B'];
	var offset = 1; // 1オクターブ高くする。
	
	var part = [];
	mml_notes = mml.match(/[abcdefglnortvABCDEFGLNORTV<>][\+\#-]?[0-9]*\.?&?/g);
	if (mml_notes == null) { return false; }
	var cOctave = default_octave;
	var flmml = [];
	for(var mnid=0; mnid < mml_notes.length; mnid++) {      // 命令ごとのループ
		var mml_note = mml_notes[mnid];
		// 現在のオクターブを取得
		if (isDrum != 0){
			// リズムトラックの音階は削除し、Cに置き換え
			if(mml_note.match(/[oO](0|[1-9][0-9]*)/)) {
				flmml[mnid] = '';
			} else if(mml_note.match(/</)) {
				flmml[mnid] = '';
			} else if(mml_note.match(/>/)) {
				flmml[mnid] = '';
			} else if(mml_note.match(/[nN](0|[1-9][0-9]*)/)) {
				flmml[mnid] = 'c';
			} else if(mml_note.match(/([abcdefgABCDEFG])([\+\#-]?)([1-9][0-9]*|0?)(\.?)(&?)/)) {
				flmml[mnid] = 'c' + RegExp.$3 +  RegExp.$4 +  RegExp.$5;
			}else{
				flmml[mnid] = mml_note;
			}
		}else{
			if (mml_note.match(/[oO](0|[1-9][0-9]*)/)) {
				cOctave = parseInt(RegExp.$1) + offset;
				if(isDrum == 0){
					flmml[mnid] = 'o'+cOctave;
				}else{
					flmml[mnid] = '';
				}
			} else if(mml_note.match(/</)) {
			// 不等号記号の場合、FLMMLの仕様により、記号をひっくり返す。（#OCTAVE REVERSEを使えば済むけどね）
				cOctave = cOctave-1;
				if(isDrum == 0){
					flmml[mnid] = '>';
				}else{
					flmml[mnid] = '';
				}
			} else if(mml_note.match(/>/)) {
				cOctave = cOctave+1;
				if(isDrum == 0){
					flmml[mnid] = '<';
				}else{
					flmml[mnid] = '';
				}
			} else if(mml_note.match(/[nN](0|[1-9][0-9]*)/)) {
				// 音階絶対指定命令
				var nValue = parseInt(RegExp.$1);
				var Octave = Math.floor(nValue/12) + offset;    // ノート値を12で割った値がオクターブ
				var note = noteRevTable[nValue%12];     // あまりがノート値
				// 上で取得したオクターブが等しければオクターブ命令を省略。
				if (cOctave == Octave){
					flmml[mnid] = note;
				}else{
					if (cOctave == Octave+1){
						flmml[mnid] = ('>'+note+'<');
					}else if (cOctave == Octave-1){
						flmml[mnid] = ('<'+note+'>');
					}else{
						flmml[mnid] = ('o'+Octave+note+'o'+cOctave);
					}
				}
			}else{
				// それ以外の命令は変換しない
				flmml[mnid] = mml_note;
			}
		}
	}
	return flmml.join("");
}