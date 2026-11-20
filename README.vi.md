<div align="center">

# ✦ DuazTube

**Phụ Đề Song Ngữ, Tra Từ Ngữ Cảnh & Dịch AI cho YouTube và Bilibili**

🌐 [English](README.md) | **Tiếng Việt**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-109%2B-orange.svg)](https://www.mozilla.org/firefox/)
[![Browser: Chromium](https://img.shields.io/badge/Chromium-Chrome%20%7C%20Edge%20%7C%20Brave-brightgreen.svg)](https://www.chromium.org/)

</div>

---

## Xem trước (Preview)

### Phụ đề song ngữ & Hiệu ứng Lyric Glow
> Hiệu ứng phát sáng chạy từng từ **Lyric Glow** (mặc định tắt — bật tùy ý trong **Giao diện phụ đề 🎨**) hỗ trợ chỉnh tốc độ (`0.5x–2.0x`), cỡ chữ, màu sắc và vị trí linh hoạt.


https://github.com/user-attachments/assets/a268ee68-5991-4e60-9e3d-34836ff29962


---

## Hướng dẫn các nút & biểu tượng trong Popup

| Nút / Biểu tượng | Chức năng |
| :--- | :--- |
| **Bật / Tắt** | Bật hoặc ẩn nhanh khung phụ đề song ngữ trên video. |
| **Tự dừng** | Tự động dừng video ở cuối mỗi câu phụ đề (rất tiện để luyện nghe & nhại theo/shadowing). |
| **Lặp câu** | Tự động lặp đi lặp lại câu phụ đề hiện tại cho đến khi tắt. |
| `⏮ Trước (A)` / `⏯ Phát/Lặp (S)` / `Sau (D) ⏭` | Chuyển nhanh về câu trước, phát/dừng/nghe lại câu hiện tại hoặc nhảy sang câu kế tiếp (hỗ trợ phím tắt `A`, `S`, `D`). |
| `🎵` | Tải lời bài hát chuẩn kèm mốc thời gian từ **LRCLIB** (miễn phí, không cần Key), tìm tên bài thủ công và chỉnh lệch giờ (`-1s` / `-0.5s` / `0s` / `+0.5s` / `+1s`) cho MV có đoạn intro. |
| `🎙 AI Sub` | Bật/tắt tạo phụ đề trực tiếp bằng **AI Whisper** cho video không có phụ đề sẵn. |
| `📂` | Nạp file phụ đề `.SRT` hoặc `.VTT` có sẵn từ máy tính. |
| `🎨` | Tùy chỉnh giao diện phụ đề (chế độ song ngữ/đơn ngữ, cỡ chữ, màu chữ, độ mờ nền, vị trí từ đáy, độ rộng tối đa và hiệu ứng **Lyric Glow**). |
| `⚙️` | Mở trang Cài đặt & Quản lý đầy đủ (nhập API Key, chọn ngôn ngữ đích, tùy chỉnh prompt AI, xem từ vựng đã lưu & xuất `.CSV` cho Anki, đổi ngôn ngữ giao diện). |
| `⬇` | Tải phụ đề hiện tại xuống máy dưới dạng `.SRT` (Song ngữ / Ngoại ngữ / Bản dịch), `.VTT` hoặc `.TXT`. |
| `🔄` | Xóa bộ nhớ tạm và dịch lại toàn bộ phụ đề của video hiện tại. |

> **Mẹo (Tra từ trực tiếp):** Bấm vào bất kỳ từ nào trên phụ đề video để xem nghĩa & phiên âm, bấm `🔊` để nghe phát âm, hoặc bấm `☆` (`★`) để lưu vào sổ từ vựng.

## Cài đặt
### Từ trang Releases (Khuyên dùng)
Tải file `duaztube-firefox.zip` hoặc `duaztube-chromium.zip` tại trang [Releases](https://github.com/JumStarz/DuazTube/releases).

### Cài đặt thủ công (Developer Mode)
- **Firefox (`Duaztube-firefox`)**:
  1. Mở `about:debugging#/runtime/this-firefox`
  2. Chọn **Load Temporary Add-on...** (Tải tiện ích tạm thời) và trỏ tới file `Duaztube-firefox/manifest.json`.
- **Chrome / Edge / Brave / Cốc Cốc (`Duaztube-chromium`)**:
  1. Mở `chrome://extensions/` (hoặc `edge://extensions/`) và bật **Chế độ dành cho nhà phát triển (Developer mode)**.
  2. Chọn **Tải tiện ích đã giải nén (Load unpacked)** và trỏ tới thư mục `Duaztube-chromium`.

## Quyền riêng tư & Bảo mật
- **Không thu thập dữ liệu**: DuazTube **không** thu thập, theo dõi hay gửi dữ liệu người dùng về bất kỳ máy chủ nào của tác giả.
- **Lưu trữ API Key cục bộ**: API Key AI cá nhân (Gemini, Groq...) của bạn chỉ được lưu trong `storage.local` trên trình duyệt và gửi trực tiếp tới nhà cung cấp bạn chọn.

## Miễn trừ trách nhiệm
DuazTube là công cụ học tập mã nguồn mở độc lập, không liên kết với YouTube, Bilibili, Google, Microsoft hay Mozilla. Người dùng tự chịu trách nhiệm tuân thủ điều khoản sử dụng của các dịch vụ API dịch thuật mà mình lựa chọn.

## Giấy phép
Phát hành theo giấy phép [MIT License](LICENSE).

