function copyModifiedFilesToDateFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const basicModifiedLogSheet = ss.getSheetByName('基礎定着_修正済みフォルダ_ログ');
  const courseModifiedLogSheet = ss.getSheetByName('高等対応_修正済みフォルダ_ログ');

  const dateFolderOutputSheet = ss.getSheetByName('date_folder_output');
  const dateFolderOutputLogSheet = ss.getSheetByName('date_folder_output_log')

  // 日付親フォルダ
  const BASIC_PARENT_ID        = "11fDYRsGL3MKSDT7YX4hJbRxiBwkVjOTZ";
  const COURSE_1A2B_PARENT_ID  = "1iI4qL6gMfeb_q0OYPDgnamknLszok5H5";
  const COURSE_3C_PARENT_ID    = "1f6c1IpM2aEG0HHoCae8LaQlzvGyeP7Vh";

  const BASIC_LATEST_PARENT_ID = "1uZTdzVAWL-nWQgD_hlpYZJU9zN1kS1Da" // 基礎定着の最新フォルダID
  const BASIC_LATEST_Q_FOLDR_ID = "1T2BaSREXJ9TKSFcH0-bQfMPLJ7C93Jwg" // 基礎定着最新問題フォルダID
  const BASIC_LATEST_E_FOLDER_ID = "1XmfesPCFf353bollQU4lKMdRHkOVDS_N" // 基礎定着最新解答フォルダID

  const COURSE_1A2B_LATEST_PARENT_ID = "1dqtzTAb2Y-_vjvME-pQszmdw5ir9EsCg" // 高等対応1A2Bの最新フォルダID
  const COURSE_1A2B_LATEST_Q_FOLDR_ID = "1sdrLc8WfLQBWHSEgSVDnNhbxh90IU0Wm" // 高等対応1A2Bの最新問題フォルダID
  const COURSE_1A2B_LATEST_E_FOLDER_ID = "1byuC5n-pBbaQPFRUUj56B4SOcNoZ4m2Z" // 高等対応1A2Bの最新解答フォルダID

  const COURSE_3C_LATEST_PARENT_ID = "10Ysd09VoQ6eMt8thSigx2nW7scYi4tQN" // 高等対応3Cの最新フォルダID
  const COURSE_3C_LATEST_Q_FOLDR_ID = "12QsZyuKUw85cPHCCwR6eabMD3jjlByjM" // 高等対応3C最新問題フォルダ
  const COURSE_3C_LATEST_E_FOLDER_ID = "16iB-nLJjZS9ez_6eqQ43q56EdMRgKPmE" // 高等対応3C最新解答フォルダ

  const startTime = new Date();
  // プログラム実行前日の日付を取得
  const now = new Date();
  now.setDate(now.getDate()-1);
  const previousDay = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd');

  // 正しく格納されているかチェックするために、格納前のファイル数を記録
  Utilities.sleep(1000);
  const lastRow = modifiedFolderLogSheet.getRange("A:A").getValues().filter(String).length + 1;
  const modifiedLogData = modifiedFolderLogSheet.getRange(3,1,lastRow-2,modifiedFolderLogSheet.getLastColumn()).getValues();
  const modifiedFileCount = modifiedLogData[0][14] // 修正件数。普通に取得する
  console.log("modifiedFileCount:", modifiedFileCount);  

  const dateFolderId = getSubfolderIdByName(parentDateFolderId, previousDay);
  const dateQFolderId = getSubfolderIdByName(dateFolderId, "問題");
  const dateEFolderId = getSubfolderIdByName(dateFolderId, "解答");
  const qFolder = DriveApp.getFolderById(dateQFolderId); // 日付フォルダの中の問題フォルダ
  const eFolder = DriveApp.getFolderById(dateEFolderId); // 日付フォルダの中の解答フォルダ

  // 格納前の問題フォルダ、解答フォルダの中身のファイル数を数える(下の格納チェック用)
  let beforeLatestQFolderCount = 0; // 実行前、最新問題フォルダの中身の数
  let beforeLatestQFolderFiles = latestQFolder.getFiles();
  while (beforeLatestQFolderFiles.hasNext()) {
    beforeLatestQFolderFiles.next();
    beforeLatestQFolderCount++;
  }
    console.log("beforeLatestQFolderCount:", beforeLatestQFolderCount);

  let beforeLatestEFolderCount = 0; // 実行前、最新解答フォルダの中身の数
  let beforeLatestEFolderFiles = latestEFolder.getFiles();
  while (beforeLatestEFolderFiles.hasNext()) {
    beforeLatestEFolderFiles.next();
    beforeLatestEFolderCount++;
  }
  console.log("beforeLatestEFolderCount:", beforeLatestEFolderCount);

  // 「修正済みフォルダ_ログ」シートの中を見て、昨日検証した問題だけコピー
  for (let i = 0; i < modifiedLogData.length; i++) {
    const qFileId = utilityFunction.getFileIdFromUrl(modifiedLogData[i][5]);
    const eFileId = utilityFunction.getFileIdFromUrl(modifiedLogData[i][7]);
    const verificationDate = Utilities.formatDate(new Date(modifiedLogData[i][13]), 'Asia/Tokyo', 'yyyy-MM-dd');
    console.log("verificationDate:", verificationDate);

    // 検証日と前日の日付が一致するかチェック
    if (verificationDate == previousDay && modifiedLogData[i][15] == "") {
      const qFile = DriveApp.getFileById(qFileId);
      const eFile = DriveApp.getFileById(eFileId);

      //重複チェック
      deleteDuplicateFile(qFolder, modifiedLogData[i][1]+"Q.pdf");
      deleteDuplicateFile(eFolder, modifiedLogData[i][1]+"E.pdf");

      //日付フォルダに格納
      qFile.makeCopy(modifiedLogData[i][1]+"Q.pdf", qFolder);
      eFile.makeCopy(modifiedLogData[i][1]+"E.pdf", eFolder);

      //重複チェック
      deleteDuplicateFile(latestQFolder, modifiedLogData[i][1]+"Q.pdf");
      deleteDuplicateFile(latestEFolder, modifiedLogData[i][1]+"E.pdf");

      //最新フォルダに上書き更新
      qFile.makeCopy(modifiedLogData[i][1]+"Q.pdf", latestQFolder);
      eFile.makeCopy(modifiedLogData[i][1]+"E.pdf", latestEFolder);

      modifiedFolderLogSheet.getRange(i+3,16).setValue("done");
    }
    if (!timeoutMeasure(startTime,"copyModifiedFiles")) {
      return;
    }
  }

  // 日付ファイル完成を報告
  // 高等対応：https://w1677405862-fii966051.slack.com/archives/C06EAFT9DFA
  // 基礎定着：https://w1677405862-fii966051.slack.com/archives/C0754RRCJ2V

  if (modifiedFileCount > 0) {
    const message = `<@U068RG19V5X>さん <@U063HS0SP5Y>さん\n${previousDay}の日付ファイルが完成しました。${modifiedFileCount}件格納されています。`;
    const channelId = "C06EAFT9DFA"; // リリース後修正チャンネル(https://w1677405862-fii966051.slack.com/archives/C06EAFT9DFA)
    const result = utilityFunction.sendSlackContent({message: message, channelId: channelId});
    console.log(result);
    // 続けて、png化のコラボを回し、問題pngも日付フォルダの中に格納する
    // TODO
  }
  
  // 正しく格納されているかチェックするために、格納後のファイル数を記録
  const count = modifiedFolderLogSheet.getRange(1,16).getValue(); // P1(フラグ入力済みのセルの数)

  let qFolderCount = 0;
  let qfiles = qFolder.getFiles();
  while (qfiles.hasNext()) {
    qfiles.next();
    qFolderCount++;
    if (!timeoutMeasure(startTime,"copyModifiedFiles")) {
      return;
    }
  }
  console.log("qFolderCount:", qFolderCount);

  let eFolderCount = 0;
  let efiles = eFolder.getFiles();
  while (efiles.hasNext()) {
    efiles.next();
    eFolderCount++;
    if (!timeoutMeasure(startTime,"copyModifiedFiles")) {
      return;
    }
  }
  console.log("eFolderCount:", eFolderCount);

  let afterLatestQFolderCount = 0; // 実行後、最新問題フォルダの中身の数
  let afterLatestQFolderFiles = latestQFolder.getFiles();
  while (afterLatestQFolderFiles.hasNext()) {
    afterLatestQFolderCount++;
    if (!timeoutMeasure(startTime,"copyModifiedFiles")) {
      return;
    }
  }
  console.log("afterLatestQFolderCount:", afterLatestQFolderCount);

  let afterLatestEFolderCount = 0; // 実行後、最新解答フォルダの中身の数
  let afterLatestEFolderFiles = latestEFolder.getFiles();
  while (afterLatestEFolderFiles.hasNext()) {
    afterLatestEFolderCount++;
    if (!timeoutMeasure(startTime,"copyModifiedFiles")) {
      return;
    }
  }
  console.log("afterLatestEFolderCount:", afterLatestEFolderCount);

  // 格納チェック
  if (count == modifiedFileCount) {
    console.log(modifiedFileCount+"件すべて格納されました");
  } else {
    console.log("格納されていないファイルがあります");
  }

  if (beforeLatestQFolderCount == afterLatestQFolderCount && beforeLatestEFolderCount == afterLatestEFolderCount) {
    console.log(afterLatestQFolderCount+"件で最新フォルダ内の件数は正しいです");
  } else {
    console.log("格納前と件数が一致しません");
  }

  // この格納チェック機能していないです。
  if (qFolderCount == modifiedFileCount && eFolderCount == modifiedFileCount) {
    console.log(modifiedFileCount+"件すべて格納されました");
  } else {
    console.log("修正件数と日付フォルダへの格納件数が一致しません");
  }
}

// 重複ファイルを削除
// folderの中に、同一のfileNameがあれば、最初に見つかった方を消す。
function deleteDuplicateFile(folder, fileName){
  let existingFiles = folder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    let existingFile = existingFiles.next();
    existingFile.setTrashed(true);
  }
}
