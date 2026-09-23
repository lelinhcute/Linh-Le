/**
 * Tiện ích kết nối Google Sheets qua Google Apps Script
 * Dành cho ứng dụng ĐỐ DZUI CÓ ĐIỂM
 */

export interface SheetSubmissionData {
  playerName: string;
  className?: string;
  score: number;
  partIScore?: number;
  partIIScore?: number;
  partIIIScore?: number;
  timeSpentSeconds: number;
  violationCount: number;
  examTitle: string;
  submittedAt?: string;
}

// Đoạn mã mẫu Google Apps Script để dán vào script.google.com
export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG LƯU ĐIỂM THI "ĐỐ DZUI CÓ ĐIỂM" VÀO GOOGLE SHEET
 * Tác giả: Thùy Linh
 * =========================================================================
 */

function doPost(e) {
  try {
    // 1. Lấy dữ liệu gửi từ ứng dụng trắc nghiệm
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 2. Mở bảng tính đang liên kết với Apps Script
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("KetQuaThi");
    
    // Nếu chưa có trang tính 'KetQuaThi', tạo mới
    if (!sheet) {
      sheet = ss.insertSheet("KetQuaThi");
    }

    // 3. Nếu bảng tính chưa có tiêu đề cột (dòng 1 trống), tự động tạo tiêu đề đẹp
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Thời Gian Nộp",
        "Họ Và Tên",
        "Lớp",
        "Điểm Tổng",
        "Điểm Phần I",
        "Điểm Phần II",
        "Điểm Phần III",
        "Thời Gian Làm Bài",
        "Số Lần Vi Phạm",
        "Tên Đề Thi"
      ];
      sheet.appendRow(headers);
      
      // Định dạng dòng tiêu đề: Chữ đậm, nền xanh navy, chữ trắng, cố định dòng
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#facc15");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 4. Định dạng thời gian nộp bài theo giờ Việt Nam
    var timestamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");

    // Định dạng thời gian làm bài (Phút : Giây)
    var timeSec = Number(data.timeSpentSeconds || 0);
    var mins = Math.floor(timeSec / 60);
    var secs = timeSec % 60;
    var formattedDuration = mins + " phút " + (secs < 10 ? "0" : "") + secs + " giây";

    // 5. Thêm dòng kết quả của học sinh vào Google Sheet
    sheet.appendRow([
      timestamp,
      data.playerName || "Thí sinh ẩn danh",
      data.className || "Tự do",
      typeof data.score === "number" ? data.score : Number(data.score || 0),
      data.partIScore !== undefined ? data.partIScore : "",
      data.partIIScore !== undefined ? data.partIIScore : "",
      data.partIIIScore !== undefined ? data.partIIIScore : "",
      formattedDuration,
      Number(data.violationCount || 0),
      data.examTitle || "Đề thi"
    ]);

    // Tự động căn giữa các cột điểm và ngày giờ
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 3, 1, 7).setHorizontalAlignment("center");

    // 6. Trả về kết quả thành công cho Web App
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã ghi nhận kết quả thi thành công!",
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Hàm kiểm tra nhanh trạng thái kết nối khi mở URL trên trình duyệt
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Hệ thống kết nối Google Sheets cho app ĐỐ DZUI CÓ ĐIỂM đang hoạt động bình thường!",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Gửi dữ liệu điểm thi lên Google Sheet qua Apps Script Web App
 */
export async function sendSubmissionToGoogleSheet(
  scriptUrl: string,
  data: SheetSubmissionData
): Promise<boolean> {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    return false;
  }

  try {
    const cleanUrl = scriptUrl.trim();
    // Gửi bằng Content-Type text/plain để tránh preflight CORS issues với Google Apps Script
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
    });
    return true;
  } catch (err) {
    console.warn('Lỗi khi gửi kết quả lên Google Sheets:', err);
    return false;
  }
}

/**
 * Gửi dữ liệu kiểm tra kết nối
 */
export async function testGoogleSheetConnection(scriptUrl: string): Promise<boolean> {
  return sendSubmissionToGoogleSheet(scriptUrl, {
    playerName: 'Kiểm tra kết nối (Mẫu)',
    className: 'Giáo viên',
    score: 10,
    partIScore: 3,
    partIIScore: 4,
    partIIIScore: 3,
    timeSpentSeconds: 120,
    violationCount: 0,
    examTitle: 'ĐỐ DZUI CÓ ĐIỂM - Test',
  });
}
