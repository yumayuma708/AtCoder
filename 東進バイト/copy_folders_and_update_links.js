// 修正済みフォルダシートの各行について
const TEMPORARY_FOLDER_ID = '12ndBvlnwLgIVW3qhfnWyTgZ4aw-BlcMO';

// 基礎定着用
function copyFoldersAndUpdateLinksBasic() {
  copyFoldersAndUpdateLinksForCourse({
    courseName: '基礎定着',
    modifiedSheetName: '基礎定着_修正済みフォルダ',
    versionSheetName: '基礎定着_バージョン管理',
    latestVersionSheetName: '基礎定着_最新データ',
    previousVersionSheetName: '基礎定着_前バージョンのデータ',
    versionParentFolderId: '1GP6082kgx-lGlieC941QddeaHI_6LtEG',
    versionStartColIndex: 11,   // L列 (ver1) → 0-based index
    latestFlagColIndex: 13,     // N列 (最新データのフラグ)
    previousFlagColIndex: 13,   // N列 (前バージョンのフラグ)
  });
}

// 高等1A2B用
function copyFoldersAndUpdateLinksCourse1A2B() {
  copyFoldersAndUpdateLinksForCourse({
    courseName: '高等1A2B',
    modifiedSheetName: '高等対応_修正済みフォルダ',      // 修正済みは共通シート想定
    versionSheetName: '高等1A2B_バージョン管理',
    latestVersionSheetName: '高等1A2B_最新データ',
    previousVersionSheetName: '高等1A2B_前バージョンのデータ',
    versionParentFolderId: '1Idcknl4nKzOj1k8JmqHZhU7NKONOYVZs',
    versionStartColIndex: 14,   // O列 (ver1) → 0-based index
    latestFlagColIndex: 16,     // Q列 (最新データのフラグ)
    previousFlagColIndex: 16,   // Q列 (前バージョンのフラグ)
  });
}

// 高等3C用
function copyFoldersAndUpdateLinksCourse3C() {
  copyFoldersAndUpdateLinksForCourse({
    courseName: '高等3C',
    modifiedSheetName: '高等対応_修正済みフォルダ',      // 修正済みは共通シート想定
    versionSheetName: '高等3C_バージョン管理',
    latestVersionSheetName: '高等3C_最新データ',
    previousVersionSheetName: '高等3C_前バージョンのデータ',
    versionParentFolderId: '1wHNP2_ebschNHOuMC35yzDqpUYc-cycZ',
    versionStartColIndex: 13,   // N列 (ver1) → 0-based index
    latestFlagColIndex: 14,     // O列 (最新データのフラグ)
    previousFlagColIndex: 14,   // O列 (前バージョンのフラグ)
  });
}

function copyFoldersAndUpdateLinksForCourse(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const modifiedSheet        = ss.getSheetByName(config.modifiedSheetName);
  const versionSheet         = ss.getSheetByName(config.versionSheetName);
  const latestVersionSheet   = ss.getSheetByName(config.latestVersionSheetName);
  const previousVersionSheet = ss.getSheetByName(config.previousVersionSheetName);

  const modifiedSheetLastRow = modifiedSheet.getRange("A:A").getValues().filter(String).length + 1;
  const versionSheetLastRow  = versionSheet.getRange("A:A").getValues().filter(String).length;

  // 「修正済みフォルダ」シートの3行目以降を読み込み
  const modifiedRows = modifiedSheet.getRange(
    2, 1,
    modifiedSheetLastRow - 2,
    modifiedSheet.getLastColumn()
  ).getValues();

  // 「バージョン管理」シートの2行目以降を読み込み
  const versionRows = versionSheet.getRange(
    2, 1,
    versionSheetLastRow - 1,
    versionSheet.getLastColumn()
  ).getValues();

  const temporaryFolderId     = TEMPORARY_FOLDER_ID;          // ★共通一時フォルダ
  const versionParentFolderId = config.versionParentFolderId; // コース別 version管理フォルダ

  const previousDay = getPreviousDayString(); // 前日の日付(yyyy-MM-dd)
  const startTime = new Date();

  const modifyNumber = modifiedRows[0][14]; // O3セル: 修正件数

  for (let i = 0; i < modifiedRows.length; i++) {
    const row = modifiedRows[i];

    // この行を処理対象にするか判定（前日検証済み & Q列が空）
    if (!shouldProcessRow(row, previousDay)) {
      continue;
    }

    processModifiedRow({
      rowIndex: i,
      row: row,
      modifiedSheet: modifiedSheet,
      versionSheet: versionSheet,
      latestVersionSheet: latestVersionSheet,
      previousVersionSheet: previousVersionSheet,
      versionRows: versionRows,
      temporaryFolderId: temporaryFolderId,
      versionParentFolderId: versionParentFolderId,
      courseName: config.courseName,
      versionStartColIndex: config.versionStartColIndex,
      latestFlagColIndex: config.latestFlagColIndex,
      previousFlagColIndex: config.previousFlagColIndex,
    });

    // 処理済みフラグ(Q列)
    modifiedSheet.getRange(i + 3, 17).setValue("done");

    if (!timeoutMeasure(startTime, "copyFoldersAndUpdateLinks")) {
      return;
    }
  }

  const count = modifiedSheet.getRange(1, 17).getValue();

  if (count == modifyNumber) {
    console.log(`${config.courseName}: ${modifyNumber}件すべて格納されました`);
  } else {
    console.log(`${config.courseName}: 格納されていないファイルがあります`);
  }
}

/**
 * 旧仕様：ver1〜ver6(N〜S列)の中で、
 * 最初に空いている列のインデックスを返す（0-based）
 * 空きがなければ -1
 */
function findEmptyVersionColumnIndexLegacy(versionRow) {
  // N〜S列 = インデックス 13〜18
  for (let k = 13; k <= 18; k++) {
    if (!versionRow[k]) { // 空欄
      return k;
    }
  }
  return -1;
}

/**
 * 拡張版：
 * 1. まず旧仕様（ver1〜ver6）の中で空きを探す
 * 2. それでも空きがなければ、新しい ver列 を右に追加してそのインデックスを返す
 */
function findEmptyVersionColumnIndexExtended(versionRow, versionSheet, versionStartColIndex) {
  // 既存の ver 列の中で空いている列を探す（versionStartColIndex から右端まで）
  for (let k = versionStartColIndex; k < versionRow.length; k++) {
    if (!versionRow[k]) {
      return k;
    }
  }

  // すべて埋まっている場合は、新しい ver 列を追加
  return addNewVersionColumn(versionRow, versionSheet, versionStartColIndex);
}

/**
 * ver7 以降用の列を右側に追加し、その列インデックスを返す。
 *
 * versionRow.length が現在の列数(0-based)なので、
 * その右に1列追加してヘッダに "verX" を書く。
 */
function addNewVersionColumn(versionRow, versionSheet, versionStartColIndex) {
  const newIndex = versionRow.length;             // 0-based 新しい列インデックス
  const versionNumber = newIndex - versionStartColIndex + 1; // ver1 からの番号

  // ヘッダ行(1行目)に "verX" を設定
  versionSheet.getRange(1, newIndex + 1).setValue('ver' + versionNumber);

  console.log(`新しいバージョン列を追加しました: 列=${newIndex + 1} (ver${versionNumber})`);

  return newIndex;
}

/**
 * 親フォルダID の下から、指定名のサブフォルダIDを取得。
 * 見つからなければ新規作成して、そのIDを返す。
 */
function getSubfolderIdByName(parentFolderId, name) {
  const parent = DriveApp.getFolderById(parentFolderId);
  const it = parent.getFoldersByName(name);

  if (it.hasNext()) {
    return it.next().getId();
  }

  // なければ新規作成
  const created = parent.createFolder(name);
  console.log(`新しいversionフォルダを作成しました: ${name} (ID=${created.getId()})`);
  return created.getId();
}

function processModifiedRow(params) {
  const {
    rowIndex,
    row,
    modifiedSheet,
    versionSheet,
    latestVersionSheet,
    previousVersionSheet,
    versionRows,
    temporaryFolderId,
    versionParentFolderId,
    courseName,
    versionStartColIndex,
    latestFlagColIndex,
    previousFlagColIndex,
  } = params;

  const modifiedFolderUrl = row[3];   // D列: 修正済みフォルダのリンク
  const daimonId = row[1];           // B列: 大問ID

  const modifiedFolderId = utilityFunction.getFolderIdFromUrl(modifiedFolderUrl);

  // 一時フォルダにコピー
  const newFolderUrl = copyFolderToParent(modifiedFolderId, temporaryFolderId);
  const newFolderId = utilityFunction.getFolderIdFromUrl(newFolderUrl);

  console.log(`[${courseName}] 大問ID:`, daimonId);

  // バージョン管理シートで大問IDに対応する行を探す
  const versionRowIndex = findVersionRowIndex(daimonId, versionRows);
  if (versionRowIndex === -1) {
    console.log(`[${courseName}] バージョン管理シートに大問IDが見つかりません:`, daimonId);
    return;
  }

  // ver列のどこに出力するか（ver7 以降にも対応）
  const emptyVersionColIndex = findEmptyVersionColumnIndexExtended(
    versionRows[versionRowIndex],
    versionSheet,
    versionStartColIndex
  );

  const versionNumber = emptyVersionColIndex - versionStartColIndex + 1;
  const versionFolderName = 'ver' + String(versionNumber);
  console.log(`[${courseName}] 出力バージョン:`, versionFolderName);

  // 「バージョン管理」シートにコピー先フォルダURLを書き込む
  versionSheet.getRange(versionRowIndex + 2, emptyVersionColIndex + 1).setValue(newFolderUrl);

  // 「最新のデータ」「前バージョンのデータ」のフラグをクリア
  // ※ これらのシートのフォルダリンク自体はスプレッドシート関数で更新される前提
  if (latestVersionSheet && typeof latestFlagColIndex === 'number') {
    latestVersionSheet
      .getRange(versionRowIndex + 2, latestFlagColIndex + 1)
      .clearContent();
  }

  if (previousVersionSheet && typeof previousFlagColIndex === 'number') {
    previousVersionSheet
      .getRange(versionRowIndex + 2, previousFlagColIndex + 1)
      .clearContent();
  }

  // verX フォルダIDを取得して、コピーしたフォルダを移動
  const versionFolderId = getSubfolderIdByName(versionParentFolderId, versionFolderName);
  utilityFunction.moveFolder(
    DriveApp.getFolderById(newFolderId),
    DriveApp.getFolderById(versionFolderId)
  );
}