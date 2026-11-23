<div align="center">

# ✦ DuazTube

**Phụ đề Song ngữ, Lời bài hát đồng bộ, Tra từ theo ngữ cảnh & Trình dịch AI cho YouTube và Bilibili**

🌐 [English](README.md) | **Tiếng Việt**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-C%C3%A0i%20đặt%20ngay-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/vi/firefox/addon/duaztube/)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-140%2B-orange.svg)](https://addons.mozilla.org/vi/firefox/addon/duaztube/)
[![Browser: Chromium](https://img.shields.io/badge/Chromium-Chrome%20%7C%20Edge%20%7C%20Brave-brightgreen.svg)](https://github.com/JumStarz/DuazTube/releases)

</div>

---

## Xem trước

### Hiệu ứng Lyric Glow & Phụ đề Song ngữ
> Hiệu ứng sáng từng chữ **Lyric Glow** (mặc định tắt — bật bất cứ lúc nào trong **Giao diện phụ đề 🎨**) với tốc độ tùy chỉnh (`0.5x–2.0x`), cỡ chữ, màu sắc và phong cách Starlight gọn gàng.



https://github.com/user-attachments/assets/dafef482-2be7-48c5-a160-2531abe5b9be



---

## Hướng dẫn các nút & biểu tượng

| Nút / Biểu tượng | Chức năng |
| :--- | :--- |
| **Logo DuazTube** *(trên thanh video)* | Bật/tắt nhanh phụ đề song ngữ chỉ với 1 bấm ngay cạnh nút `CC` (YouTube) hoặc `字幕` (Bilibili) mà không cần mở Popup. |
| **Bật / Tắt** | Bật hoặc ẩn nhanh khung phụ đề song ngữ trên video. |
| **Tự dừng** | Tự động dừng video ở cuối mỗi câu phụ đề (rất tiện để luyện nghe & nhại theo/shadowing). |
| **Lặp câu** | Tự động lặp đi lặp lại câu phụ đề hiện tại cho đến khi tắt. |
| `⏮ Trước (A)` / `⏯ Phát/Lặp (S)` / `Sau (D) ⏭` | Chuyển nhanh về câu trước, phát/dừng/nghe lại câu hiện tại hoặc nhảy sang câu kế tiếp (hỗ trợ phím tắt `A`, `S`, `D`). |
| `🎵` | Tải lời bài hát chuẩn kèm mốc thời gian từ **LRCLIB** (miễn phí, không cần Key), tìm tên bài thủ công và chỉnh lệch giờ (`-1s` / `-0.5s` / `0s` / `+0.5s` / `+1s`) cho MV có đoạn intro. |
| `🎙 AI Sub` | Bật/tắt tạo phụ đề trực tiếp bằng **AI Whisper** cho video không có phụ đề sẵn. |
| `📂` | Nạp file phụ đề `.SRT` hoặc `.VTT` có sẵn từ máy tính. |
| `🎨` | Tùy chỉnh giao diện phụ đề (chế độ song ngữ/đơn ngữ, cỡ chữ, màu chữ, độ mờ nền, vị trí từ đáy, độ rộng tối đa và hiệu ứng **Lyric Glow**). |
| `⚙️` | Mở trang Cài đặt & Bảng điều khiển đầy đủ (API Key, ngôn ngữ đích, tùy chỉnh prompt AI, từ vựng đã lưu & xuất `.CSV` cho Anki, ngôn ngữ giao diện). |
| `⬇` | Tải phụ đề hiện tại xuống máy dưới dạng `.SRT` (Song ngữ / Ngoại ngữ / Bản dịch), `.VTT` hoặc `.TXT`. |
| `🔄` | Xóa bộ nhớ tạm và dịch lại toàn bộ phụ đề của video hiện tại. |

> **Mẹo (Tra từ trực tiếp):** Bấm vào bất kỳ từ nào trên phụ đề video để xem nghĩa & phiên âm, bấm `🔊` để nghe phát âm, hoặc bấm `☆` (`★`) để lưu vào sổ từ vựng.

## Cài đặt

### Firefox (Khuyên dùng — Cửa hàng chính thức)
Cài đặt trực tiếp chỉ với 1 bấm trên **Cửa hàng tiện ích Firefox Add-ons**:
- 👉 **[Cài DuazTube trên Firefox Add-ons](https://addons.mozilla.org/vi/firefox/addon/duaztube/)**

### Chrome / Edge / Brave / Cốc Cốc (Chromium)
1. Tải file `Duaztube-chromium.zip` tại trang [Releases](https://github.com/JumStarz/DuazTube/releases) và giải nén.
2. Mở `chrome://extensions/` (hoặc `edge://extensions/`) rồi bật **Chế độ dành cho nhà phát triển (Developer mode)**.
3. Bấm **Tải tiện ích đã giải nén (Load unpacked)** và chọn thư mục `Duaztube-chromium`.

### Cài thủ công cho nhà phát triển (Firefox)
1. Tải mã nguồn hoặc `Duaztube-firefox.zip` từ trang [Releases](https://github.com/JumStarz/DuazTube/releases).
2. Mở `about:debugging#/runtime/this-firefox`.
3. Bấm **Tải tiện ích tạm thời... (Load Temporary Add-on...)** và chọn `Duaztube-firefox/manifest.json`.

## Quyền riêng tư & Bảo mật
- **Không thu thập dữ liệu**: DuazTube **không** thu thập, theo dõi hay gửi dữ liệu người dùng về bất kỳ máy chủ nào của tác giả.
- **Lưu API Key cục bộ**: Các khóa API AI cá nhân (Gemini, Groq...) chỉ được lưu trong `storage.local` trên máy của bạn và gửi trực tiếp đến nhà cung cấp chính thức mà bạn chọn.

## Ủng hộ tác giả
DuazTube hoàn toàn miễn phí và mã nguồn mở. Nếu tiện ích giúp ích cho bạn, bạn có thể mời mình một ly cà phê tại:
- 🎮 [PlayerDuo (Việt Nam)](https://playerduo.net.vn/12897348) · ☕ [Gumroad (Quốc tế)](https://jumstar.gumroad.com/l/donate)

## Tuyên bố miễn trừ trách nhiệm
DuazTube là công cụ học tập mã nguồn mở độc lập, không liên kết với YouTube, Bilibili, Google, Microsoft hay Mozilla. Người dùng tự chịu trách nhiệm tuân thủ điều khoản của nhà cung cấp API dịch thuật mình sử dụng.

## Giấy phép
Phát hành theo [Giấy phép MIT](LICENSE).
