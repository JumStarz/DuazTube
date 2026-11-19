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

## Tính năng chính
- **Hỗ trợ YouTube & Bilibili**: Chỉ hoạt động trên các trang xem video (`youtube.com/watch`, `bilibili.com/video/*`, `bilibili.com/bangumi/play/*`). Toàn bộ bảng điều khiển nằm gọn trong Popup thanh công cụ và trang Dashboard (`options.html`).
- **Xử lý phụ đề thông minh**: Tự động lọc thẻ thừa (`[Music]`, `♪`), nối các từ viết tắt bị cắt dòng, gộp mảnh câu ngắn thành câu hoàn chỉnh và ưu tiên dịch ngay đoạn đang phát.
- **Đa trình dịch linh hoạt**:
  - **Miễn phí không cần Key**: Google Translate (dịch ngữ cảnh & gộp POST), Bing / Microsoft Translator, MyMemory.
  - **Mô hình AI (BYOK / Local)**: Google Gemini, Groq (Llama 3.3), Ollama (chạy offline vô hạn trên máy) và Custom API chuẩn OpenAI (OpenRouter, DeepSeek...).
- **Công cụ học tập & Phím tắt**:
  - Click vào bất kỳ từ nào trên phụ đề để tạm dừng, xem nghĩa, phiên âm, giải thích ngữ cảnh bằng AI, nghe phát âm (`🔊`) và lưu vào sổ Từ vựng (`☆` → xuất `.CSV` cho Anki).
  - Phím tắt: `A` (Câu trước), `S` (Phát/Tạm dừng/Lặp lại), `D` (Câu sau), kèm chế độ **Tự dừng** và **Lặp câu**.
- **Tùy chỉnh giao diện & Lyric Glow**: Tùy chỉnh cỡ chữ, màu chữ, độ mờ nền, vị trí từ đáy, độ rộng khung (tới 98%) và bật/tắt hiệu ứng phát sáng chạy từng từ **Lyric Glow** (mặc định tắt) với tốc độ tùy chỉnh (`0.5x–2.0x`).
- **Cho video không có phụ đề**: Tạo phụ đề trực tiếp bằng **AI Whisper** (Groq / Local) và nạp file `.SRT` / `.VTT` từ máy tính.
- **Xuất phụ đề**: Tải phụ đề trực tiếp về máy ở định dạng `.SRT` (Song ngữ / Chỉ gốc / Chỉ dịch), `.VTT` hoặc `.TXT`.
- **Giao diện đa ngôn ngữ**: Hỗ trợ **Tiếng Việt**, **English** và **简体中文**.

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

