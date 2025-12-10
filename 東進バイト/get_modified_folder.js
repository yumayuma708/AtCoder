// 修正済みフォルダの情報をスプシに書き出す。
// 問題解答フォルダの名前とtexファイルとpdfファイルをスプシに出力している。
function getModifiedFolder(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const basicModifiedSheet = ss.getSheetByName("基礎定着_修正済みフォルダ");
  const basicModifiedFolder = DriveApp.getFolderById("1RDIVOs-gPoNE_Zm-aGa3smsklb63GUOT"); 
  const basicModifiedFolderList = basicModifiedFolder.getFolders();

  const courseModifiedSheet = ss.getSheetByName("高等対応_修正済みフォルダ");
  const courseModifiedFolder = DriveApp.getFolderById("1crfwtqXHazlUtp-GLtqxQAkx-YNGVtDk"); 
  const courseModifiedFolderList = courseModifiedFolder.getFolders();

  clearModifiedSheet(basicModifiedSheet);
  clearModifiedSheet(courseModifiedSheet);

  writeModifiedFolderInfo(basicModifiedSheet, basicModifiedFolderList);
  writeModifiedFolderInfo(courseModifiedSheet, courseModifiedFolderList);
}

// 修正済みフォルダのスナップショットを元に modify_progress_log を更新する
// （時間主導トリガーから呼び出す想定）
function updateModifyProgressLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicModifiedSheet = ss.getSheetByName('基礎定着_修正済みフォルダ');
  const courseModifiedSheet = ss.getSheetByName('高等対応_修正済みフォルダ');

  if (basicModifiedSheet) {
    updateModifyProgressLogFromSheet(basicModifiedSheet, '基礎定着');
  }
  if (courseModifiedSheet) {
    updateModifyProgressLogFromSheet(courseModifiedSheet, '高等対応');
  }
}

function clearModifiedSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if(lastRow < 3) return; // データが無ければ何もしない

  sheet.getRange(2, 3, lastRow - 1, 7).clear(); // C〜I列
  sheet.getRange(2, 12, lastRow -1, 2).clear(); // L,M列
  sheet.getRange(2, 15, lastRow - 1, 2).clear(); // O,P列
}

function writeModifiedFolderInfo(sheet, folderIterator) {
  let outputList = [];

  while (folderIterator.hasNext()) {
    const folder = folderIterator.next();
    const folderInfo = getFolderInfo(folder);
    const lastUpdated = adjustLastUpdated(folder.getLastUpdated());

    // 配列の初期化
    const row = new Array(7);

    row[0] = folder.getName();
    row[1] = folder.getUrl();
    row[6] = Utilities.formatDate(lastUpdated, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

    // --- Q系のファイル ---
    if (folderInfo[FILE_INFO_KEYS.Q_TEX_COUNT] === 1) {
      row[2] = folderInfo[FILE_INFO_KEYS.Q_TEX_LIST][0].getUrl();
    }
    if (folderInfo[FILE_INFO_KEYS.Q_PDF_COUNT] === 1) {
      row[3] = folderInfo[FILE_INFO_KEYS.Q_PDF_LIST][0].getUrl();
    }

    // --- E系のファイル ---
    if (folderInfo[FILE_INFO_KEYS.E_TEX_COUNT] === 1) {
      row[4] = folderInfo[FILE_INFO_KEYS.E_TEX_LIST][0].getUrl();
    }
    if (folderInfo[FILE_INFO_KEYS.E_PDF_COUNT] === 1) {
      row[5] = folderInfo[FILE_INFO_KEYS.E_PDF_LIST][0].getUrl();
    }

    outputList.push(row);
    console.log("フォルダ名: " + row[0]);
  }

  // データをスプシに一括で書き込む
  if (outputList.length > 0) {
    sheet.getRange(2, 3, outputList.length, outputList[0].length).setValues(outputList);
  }
}

// 更新時刻を -6 時間補正する処理
function adjustLastUpdated(date) {
  const d = new Date(date);
  d.setHours(d.getHours() - 6);
  return d;
}

function updateModifyProgressLogFromSheet(sheet, courseName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('modify_progress_log');

  let courseTypeMap = null; // DAIMONID -> "1A2B" | "3C"

  if (courseName === '高等対応') {
    const identifySheet = ss.getSheetByName('高等対応_識別表');
    courseTypeMap = buildCourseTypeMapByDaimonId(identifySheet);
  }

  const logLastRow = logSheet.getLastRow();
  let logValues = [];
  if (logLastRow >= 2) {
    logValues = logSheet.getRange(2, 1, logLastRow - 1, 14).getValues();
  }

  const logMap = {};
  for (let i = 0; i < logValues.length; i++) {
    const course = logValues[i][0];     // course
    const daimonId = logValues[i][1];   // DAIMONID
    const verifiedDate = logValues[i][4]; // 検証日（文字列想定）
    if (!course || !daimonId || !verifiedDate) continue;
    const key = course + '|' + daimonId + '|' + verifiedDate;
    logMap[key] = i + 2;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return;

  // 修正済みフォルダシートの2行目以降を対象
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  data.forEach(row => {
    const daimonId = row[1];           // B列: DAIMONID
    const mondaiId = row[2];           // C列: mondaiId
    const folderUrl = row[3];          // D列: 修正済みフォルダ（URL）
    const verifiedDateValue = row[13]; // N列: 検証日

    // 検証日・DAIMONID・フォルダURLがそろっていない行はログ対象外
    if (!daimonId || !folderUrl || !verifiedDateValue) {
      return; // forEach の次の行へ
    }

    // course列に入れるラベルを決定（「基礎」 or 「高等1A2B」 or 「高等3C」）
    let courseLabel = '';
    if (courseName === '基礎定着') {
      courseLabel = '基礎';
    } else if (courseName === '高等対応') {
      const type = courseTypeMap && courseTypeMap[daimonId]; // "1A2B" or "3C"
      if (!type) {
        console.log('コース種別が識別できませんでした: DAIMONID=' + daimonId);
        return; // この行はスキップ
      }
      if (type === '1A2B') {
        courseLabel = '高等1A2B';
      } else if (type === '3C') {
        courseLabel = '高等3C';
      } else {
        console.log('未知のコース種別です: ' + type + ' (DAIMONID=' + daimonId + ')');
        return; // この行はスキップ
      }
    } else {
      // 想定外の courseName の場合はログだけ出してスキップ
      console.log('想定外の courseName: ' + courseName);
      return;
    }

    const verifiedDateStr = verifiedDateValue ? Utilities.formatDate(new Date(verifiedDateValue), 'Asia/Tokyo', 'yyyy-MM-dd') : '';

    const folderId = folderUrl ? folderUrl.match(/[-\w]{25,}/) ? folderUrl.match(/[-\w]{25,}/)[0] : '' : '';

    const key = courseLabel + '|' + daimonId + '|' + verifiedDateStr;
    
    // keyがない時だけ、ログを追加
    if (!(key in logMap)) {
      const rowArray = [
        courseLabel,        // course ("基礎" / "高等1A2B" / "高等3C")
        daimonId,           // DAIMONID
        mondaiId || '',     // mondaiId
        folderId,           // 修正済みフォルダID
        verifiedDateStr,    // 検証日
        '',                 // 日付フォルダ作成フラグ
        '',                 // 日付フォルダ
        '',                 // 日付フォルダID
        '',                 // 問題フォルダID
        '',                 // 問題pngフォルダID
        '',                 // 日付フォルダにコピーフラグ
        '',                 // pngファイル作成フラグ
        '',                 // 最新フォルダ更新フラグ
        '',                 // バージョン管理シート更新フラグ
      ];
      logSheet.appendRow(rowArray);
    } else {
      // 既存行の更新などの処理があればここに追加
    }
  });
}


// 高等対応_識別表 から DAIMONID -> コース種別("1A2B" / "3C") のマップを作る
function buildCourseTypeMapByDaimonId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const map = {};

  values.forEach(row => {
    const daimondId = row[1]; // B列: DAIMONID
    const type = row[2];      // C列: "1A2B" or "3C"
    if (daimondId && type) {
      map[daimondId] = type;
    }
  });

  return map;
}
