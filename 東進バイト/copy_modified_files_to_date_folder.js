function copyModifiedFilesToDateFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const basicLogSheet   = ss.getSheetByName('基礎定着_修正済みフォルダ_ログ');
  const courseLogSheet  = ss.getSheetByName('高等対応_修正済みフォルダ_ログ');

  const dateOutputSheet     = ss.getSheetByName('date_folder_output');
  const dateOutputLogSheet  = ss.getSheetByName('date_folder_output_log');
  const courseIdentifySheet = ss.getSheetByName('高等対応_識別表');

  // 親フォルダID
  const BASIC_PARENT_ID       = "11fDYRsGL3MKSDT7YX4hJbRxiBwkVjOTZ";
  const COURSE_1A2B_PARENT_ID = "1iI4qL6gMfeb_q0OYPDgnamknLszok5H5";
  const COURSE_3C_PARENT_ID   = "1f6c1IpM2aEG0HHoCae8LaQlzvGyeP7Vh";

  // 最新フォルダID
  const BASIC_LATEST_Q_ID = "1T2BaSREXJ9TKSFcH0-bQfMPLJ7C93Jwg";
  const BASIC_LATEST_E_ID = "1XmfesPCFf353bollQU4lKMdRHkOVDS_N";

  const C1A2B_LATEST_Q_ID = "1sdrLc8WfLQBWHSEgSVDnNhbxh90IU0Wm";
  const C1A2B_LATEST_E_ID = "1byuC5n-pBbaQPFRUUj56B4SOcNoZ4m2Z";

  const C3C_LATEST_Q_ID = "12QsZyuKUw85cPHCCwR6eabMD3jjlByjM";
  const C3C_LATEST_E_ID = "16iB-nLJjZS9ez_6eqQ43q56EdMRgKPmE";

  // 昨日の日付
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const previousDay = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd');

  // date_folder_output の内容を取得
  const outputValues = dateOutputSheet.getRange(2,1,dateOutputSheet.getLastRow()-1,5).getValues();

  // 高等対応識別表
  const identifyMap = buildCourseIdentifyMap(courseIdentifySheet);  // { daimondId: "1A2B" or "3C" }

  let basicCopied = false;
  let courseCopied = false;

  // === 1行ずつ処理 ===
  outputValues.forEach(row => {
    const kind   = row[0];  // "基礎" / "1A2B" / "3C"
    const date   = row[1];
    const dateFolderId = row[2];
    const qFolderId    = row[3];
    const qPngFolderId = row[4];

    if (date !== previousDay) return;  // 昨日以外は対象外

    // 最新フォルダを種別で切り替える
    let latestQFolderId, latestEFolderId, logSheet;

    if (kind === "基礎") {
      latestQFolderId = BASIC_LATEST_Q_ID;
      latestEFolderId = BASIC_LATEST_E_ID;
      logSheet = basicLogSheet;

    } else if (kind === "1A2B") {
      latestQFolderId = C1A2B_LATEST_Q_ID;
      latestEFolderId = C1A2B_LATEST_E_ID;
      logSheet = courseLogSheet;

    } else if (kind === "3C") {
      latestQFolderId = C3C_LATEST_Q_ID;
      latestEFolderId = C3C_LATEST_E_ID;
      logSheet = courseLogSheet;
    }

    const qFolder = DriveApp.getFolderById(qFolderId);
    const eFolder = getSubfolderByName(dateFolderId, "解答"); // 日付フォルダ内の解答フォルダ取得

    const pngFolder = DriveApp.getFolderById(qPngFolderId);

    // === ログシートの処理 ===
    const lastRow = logSheet.getLastRow();
    const logValues = logSheet.getRange(3,1,lastRow-2, logSheet.getLastColumn()).getValues();

    for (let i = 0; i < logValues.length; i++) {
      const row = logValues[i];

      // すでに done の行はスキップ
      if (row[15] === "done") continue;

      const problemId = row[1];  // 問題番号
      const daimondId = row[2];  // 大問ID（高等対応のみ有効）

      // === 高等対応の場合は種別を判定 ===
      if (kind !== "基礎") {
        const courseType = identifyMap[daimondId];
        if (courseType !== kind) continue;  // 1A2Bの行には1A2Bだけ、3Cには3Cだけ
      }

      // Q/E ファイルID取得
      const qFileId = utilityFunction.getFileIdFromUrl(row[5]);
      const eFileId = utilityFunction.getFileIdFromUrl(row[7]);

      const qFile = DriveApp.getFileById(qFileId);
      const eFile = DriveApp.getFileById(eFileId);

      const qName = problemId + "Q.pdf";
      const eName = problemId + "E.pdf";

      // --- 重複削除 ---
      deleteDuplicateFile(qFolder, qName);
      deleteDuplicateFile(eFolder, eName);

      // --- 日付フォルダにコピー ---
      qFile.makeCopy(qName, qFolder);
      eFile.makeCopy(eName, eFolder);

      // --- 最新フォルダ上書き ---
      const latestQ = DriveApp.getFolderById(latestQFolderId);
      const latestE = DriveApp.getFolderById(latestEFolderId);

      deleteDuplicateFile(latestQ, qName);
      deleteDuplicateFile(latestE, eName);

      qFile.makeCopy(qName, latestQ);
      eFile.makeCopy(eName, latestE);

      // --- PNG 作成 ---
      createPngFile(qFolderId, qPngFolderId);

      if (kind === "基礎") {
        basicCopied = true;
      } else if (kind === "1A2B" || kind === "3C") {
        courseCopied = true;
      }

      // --- done フラグ ---
      logSheet.getRange(i+3, 16).setValue("done");
    }
  });

  // === 転記処理 ===
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  const allOutputValues = dateOutputSheet.getRange(2,1,dateOutputSheet.getLastRow()-1,5).getValues();

  allOutputValues.forEach(row => {
    dateOutputLogSheet.appendRow([
      row[0], row[1], row[2], row[3], row[4], today
    ]);
  });

  // === date_folder_output のクリア ===
  if (dateOutputSheet.getLastRow() > 1) {
    dateOutputSheet.getRange(2,1,dateOutputSheet.getLastRow()-1,5).clear();
  }

  const mention = `<@${SLACK_MEMBERS.YUMA_IKEO}>`;
  if (basicCopied) {
    utilityFunction.sendSlackContent({
      message: `${mention} ${previousDay} の基礎定着の日付ファイルが完成しました。`,
      channelId: "C0754RRCJ2V"
    });
  }
  if (courseCopied) {
    utilityFunction.sendSlackContent({
      message: `${mention} ${previousDay} の高等対応の日付ファイルが完成しました。`,
      channelId: "C06EAFT9DFA"
    });
  };
}

// 以下、ヘルパー
// 同名ファイル削除
function deleteDuplicateFile(folder, name){
  const files = folder.getFilesByName(name);
  if (files.hasNext()) files.next().setTrashed(true);
}

// 日付フォルダ内のサブフォルダを名前で取得
function getSubfolderByName(parentId, name){
  const parent = DriveApp.getFolderById(parentId);
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  throw new Error("サブフォルダが見つかりません: " + name);
}

// 高等対応の識別表から map を作る
function buildCourseIdentifyMap(sheet){
  const values = sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues();
  const map = {};
  values.forEach(row => {
    const daimondId = row[1];
    const type = row[2];
    if (daimondId && type) map[daimondId] = type;
  });
  return map;
}
