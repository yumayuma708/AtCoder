// 日付フォルダを作成する関数
function createDateFolders() {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  // 内部ロジック用（検証日比較・フォルダ名）
  const yesterdayKeyStr = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy-MM-dd');

  // シート表示用の日付（「日付フォルダ(YYYY/MM/DD)」など）
  const yesterdayDisplayStr = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy/MM/dd');

  // フラグ用タイムスタンプ（〇〇フラグ列用）
  const flagTimestampStr = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM/dd/HH:mm:ss');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('modify_progress_log');

  const lastRow = logSheet.getLastRow();
  if (lastRow < 2) {
    console.log('modify_progress_log にデータ行がありません。');
    return;
  }

  // ログシートの全データを取得（ヘッダ行を除く）
  const logValues = logSheet.getRange(2, 1, lastRow - 1, 15).getValues();

  // コースごとの親フォルダID
  const BASIC_PARENT_ID       = '11fDYRsGL3MKSDT7YX4hJbRxiBwkVjOTZ';
  const COURSE_1A2B_PARENT_ID = '1iI4qL6gMfeb_q0OYPDgnamknLszok5H5';
  const COURSE_3C_PARENT_ID   = '1f6c1IpM2aEG0HHoCae8LaQlzvGyeP7Vh';

  const parentFolderMap = {
    '基礎': BASIC_PARENT_ID,
    '高等1A2B': COURSE_1A2B_PARENT_ID,
    '高等3C': COURSE_3C_PARENT_ID,
  };

  // コースごとに作成 / 取得した日付フォルダとサブフォルダをキャッシュ
  const courseFolderInfoMap = {}; // course -> { dateFolderId, mondaiFolderId, pngFolderId }

  for (let i = 0; i < logValues.length; i++) {
    const row = logValues[i];

    const course = row[0];           // A列: course
    const verifiedDate = row[4];     // E列: 検証日 (文字列想定)
    const createdFlag = row[5];      // F列: 日付フォルダ作成フラグ（タイムスタンプ）

    // 検証日が昨日と一致しない or すでに日付フォルダ作成済みならスキップ
    if (verifiedDate !== yesterdayKeyStr || createdFlag) {
      continue;
    }

    const parentId = parentFolderMap[course];
    if (!parentId) {
      console.log('親フォルダIDが設定されていないコースです: ' + course);
      continue;
    }

    // まだこのコースのフォルダ情報を作っていなければ作成 or 取得
    if (!courseFolderInfoMap[course]) {
      const parentFolder = DriveApp.getFolderById(parentId);

      // 「yyyy-MM-dd」という名前の日付フォルダを取得 or 作成
      let dateFolder;
      const it = parentFolder.getFoldersByName(yesterdayKeyStr);
      if (it.hasNext()) {
        dateFolder = it.next();
        console.log(course + '：既存の日付フォルダを利用します: ' + yesterdayKeyStr + ' (ID=' + dateFolder.getId() + ')');
      } else {
        dateFolder = parentFolder.createFolder(yesterdayKeyStr);
        console.log(course + '：新しい日付フォルダを作成しました: ' + yesterdayKeyStr + ' (ID=' + dateFolder.getId() + ')');
      }

      // サブフォルダ「問題」「解答」「問題png」を取得 or 作成
      const mondaiFolder = getOrCreateSubfolder(dateFolder, '問題');
      getOrCreateSubfolder(dateFolder, '解答'); // 解答フォルダはIDをログには保持しない
      const pngFolder = getOrCreateSubfolder(dateFolder, '問題png');

      courseFolderInfoMap[course] = {
        dateFolderId: dateFolder.getId(),
        mondaiFolderId: mondaiFolder.getId(),
        pngFolderId: pngFolder.getId(),
      };
    }

    const info = courseFolderInfoMap[course];

    // F列: 日付フォルダ作成フラグ（タイムスタンプ）
    row[5] = flagTimestampStr;
    // G列: 日付フォルダ（表示用の日付 = 昨日, "YYYY/MM/DD"）
    row[6] = yesterdayDisplayStr;
    // H列: 日付フォルダID
    row[7] = info.dateFolderId;
    // I列: 問題フォルダID
    row[8] = info.mondaiFolderId;
    // J列: 問題pngフォルダID
    row[9] = info.pngFolderId;

    logValues[i] = row;
  }

  // 変更されたログをまとめて書き戻す
  logSheet.getRange(2, 1, logValues.length, 15).setValues(logValues);

  console.log('createDateFolders: modify_progress_log をもとに日付フォルダの作成・更新を完了しました。');
}

function getOrCreateSubfolder(parentFolder, name) {
  const it = parentFolder.getFoldersByName(name);
  if (it.hasNext()) {
    return it.next();
  }
  return parentFolder.createFolder(name);
}
