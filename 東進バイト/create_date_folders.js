// 日付フォルダを作成する関数
function createDateFolders() {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayStr = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy-MM-dd');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // シート取得
  const basicMasterSheet   = ss.getSheetByName("基礎定着_マスタ");
  const basicModifiedSheet = ss.getSheetByName("基礎定着_修正済みフォルダ");
  const basicLogSheet      = ss.getSheetByName("基礎定着_修正済みフォルダ_ログ");

  const courseMasterSheet   = ss.getSheetByName("高等対応_マスタ");
  const courseModifiedSheet = ss.getSheetByName("高等対応_修正済みフォルダ");
  const courseLogSheet      = ss.getSheetByName("高等対応_修正済みフォルダ_ログ");

  const courseIdentifySheet = ss.getSheetByName("高等対応識別表");

  // 日付親フォルダ
  const BASIC_PARENT_ID        = "11fDYRsGL3MKSDT7YX4hJbRxiBwkVjOTZ";
  const COURSE_1A2B_PARENT_ID  = "1iI4qL6gMfeb_q0OYPDgnamknLszok5H5";
  const COURSE_3C_PARENT_ID    = "1f6c1IpM2aEG0HHoCae8LaQlzvGyeP7Vh";

  // 基礎定着
  processBasicDateFolder(
    basicMasterSheet,
    BASIC_PARENT_ID,
    yesterdayStr,
    basicModifiedSheet,
    basicLogSheet
  );

  // 高等対応
  processCourseDateFolders(
    courseMasterSheet,
    courseModifiedSheet,
    courseIdentifySheet,
    yesterdayStr,
    COURSE_1A2B_PARENT_ID,
    COURSE_3C_PARENT_ID,
    courseLogSheet
  );
}


// 基礎定着
function processBasicDateFolder(masterSheet, parentFolderId, targetDateStr, modifiedSheet, logSheet) {
  const fileDates = getFormattedDates(masterSheet, "C3:C");

  if (!fileDates.includes(targetDateStr)) return;

  console.log(`基礎定着：${targetDateStr} の日付フォルダを作成します`);

  const parent = DriveApp.getFolderById(parentFolderId);
  const dateFolder = parent.createFolder(targetDateStr);

  const mondaiFolder = dateFolder.createFolder("問題");
  const pngFolder    = dateFolder.createFolder("問題png");
  dateFolder.createFolder("解答");

  console.log("基礎定着：フォルダ作成完了");

  recordDateFolderInfo("基礎定着", targetDateStr, {
    dateFolder: dateFolder.getId(),
    mondaiFolder: mondaiFolder.getId(),
    pngFolder: pngFolder.getId()
  });

  logBasicModifiedData(modifiedSheet, logSheet);
}


// 高等対応
function processCourseDateFolders(
  masterSheet,
  modifiedSheet,
  identifySheet,
  targetDateStr,
  parent1A2BId,
  parent3CId,
  logSheet
) {
  const fileDates = getFormattedDates(masterSheet, "C3:C");

  if (!fileDates.includes(targetDateStr)) {
    console.log("高等対応：昨日の更新なし → 日付フォルダ作成スキップ");
    return;
  }

  console.log(`高等対応：${targetDateStr} の日付フォルダ作成開始`);

  const modifiedData = modifiedSheet.getRange(3, 1, modifiedSheet.getLastRow() - 2, 2).getValues();
  const identifyMap = buildIdentifyMap(identifySheet);

  modifiedData.forEach((row, idx) => {
    const folderId = row[1];
    if (!folderId) return;

    const courseType = identifyMap[folderId];

    if (!courseType) {
      console.log(`識別不可：folderId=${folderId}（行 ${idx + 3}） → スキップ`);
      return;
    }

    let parentFolder;
    if (courseType === "1A2B") {
      parentFolder = DriveApp.getFolderById(parent1A2BId);
    } else if (courseType === "3C") {
      parentFolder = DriveApp.getFolderById(parent3CId);
    }

    const dateFolder = parentFolder.createFolder(targetDateStr); // ← 重要
    console.log(`→ ${courseType} 日付フォルダ作成 ID=${dateFolder.getId()}`);

    recordDateFolderInfo(courseType, targetDateStr, {
      dateFolder: dateFolder.getId(),
      mondaiFolder: "",
      pngFolder: ""
    });
  });

  logCourseModifiedData(modifiedSheet, logSheet);
}


// 以下ヘルパー
function logBasicModifiedData(modifiedSheet, logSheet) {
  writeModifiedDataToLog(modifiedSheet, logSheet, 14, 2);
}

function logCourseModifiedData(modifiedSheet, logSheet) {
  writeModifiedDataToLog(modifiedSheet, logSheet, 14, 2);
}


function writeModifiedDataToLog(modifiedSheet, logSheet, colCount, extraCount) {
  const lastRow = modifiedSheet.getLastRow();
  if (lastRow < 3) return;

  const data = modifiedSheet.getRange(3, 1, lastRow - 2, colCount).getValues();

  const logLastRow = logSheet.getLastRow();
  if (logLastRow > 2) {
    logSheet.getRange(3, 1, logLastRow - 2, colCount).clear();
    logSheet.getRange(3, colCount + 2, logLastRow - 2, extraCount).clear();
  }

  logSheet.getRange(3, 1, data.length, data[0].length).setValues(data);
}


function getFormattedDates(sheet, rangeA1) {
  return sheet
    .getRange(rangeA1)
    .getValues()
    .flat()
    .filter(String)
    .map(date => Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd"));
}


function buildIdentifyMap(sheet) {
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const map = {};
  values.forEach(row => {
    const folderId = row[1];
    const courseType = row[2];
    if (folderId && courseType) {
      map[folderId] = courseType;
    }
  });
  return map;
}


// 出力シートへ追加
function recordDateFolderInfo(courseName, dateStr, ids) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("date_folder_output");

  sheet.appendRow([
    courseName,
    dateStr,
    ids.dateFolder,
    ids.mondaiFolder,
    ids.pngFolder
  ]);
}