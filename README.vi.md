<div align="center">

# ✦ DuazTube

**Phụ đề song ngữ, lời bài hát đồng bộ, tra từ trực tiếp & dịch AI cho YouTube và Bilibili.**

🌐 [English](README.md) | **Tiếng Việt**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-C%C3%A0i%20%C4%91%E1%BA%B7t%20ngay-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/vi/firefox/addon/duaztube/)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-140%2B-orange.svg)](https://addons.mozilla.org/vi/firefox/addon/duaztube/)
[![Browser: Chromium](https://img.shields.io/badge/Chromium-Chrome%20%7C%20Edge%20%7C%20Brave-brightgreen.svg)](https://github.com/JumStarz/DuazTube/releases)

</div>

---

## Xem trước

### Hiệu ứng Lyric Glow & Phụ đề song ngữ
> Hiệu ứng sáng chạy theo từng chữ **Lyric Glow** (mặc định tắt, muốn dùng bạn cứ bật trong **Giao diện phụ đề 🎨**), chỉnh được tốc độ (`0.5x–2.0x`), cỡ chữ, màu sắc với giao diện Starlight gọn mắt.



https://github.com/user-attachments/assets/dafef482-2be7-48c5-a160-2531abe5b9be



---

## Các nút & biểu tượng nhanh

| Nút / Biểu tượng | Công dụng |
| :--- | :--- |
| **Logo DuazTube** *(ngay trên thanh video)* | Bật/tắt phụ đề nhanh chỉ với 1 click ngay cạnh nút `CC` (YouTube) hoặc `字幕` (Bilibili), khỏi cần mở Popup. |
| **Bật / Tắt** | Ẩn hoặc hiện khung phụ đề song ngữ từ Popup. |
| **Tự dừng** | Tự động tạm dừng ở cuối mỗi câu phụ đề — cực tiện cho bạn nào đang luyện nghe hoặc nhại theo (shadowing). |
| **Lặp câu** | Lặp đi lặp lại đúng câu hiện tại cho tới khi bạn tắt đi. |
| `⏮ Trước (A)` / `⏯ Phát/Lặp (S)` / `Sau (D) ⏭` | Nhảy nhanh giữa các câu hoặc nghe lại câu đang phát (bấm phím `A`, `S`, `D` trên bàn phím cũng được). |
| `🎵` | Lấy lời bài hát chuẩn kèm mốc thời gian từ **LRCLIB** (miễn phí, không cần Key). Có ô tìm tên bài thủ công và nút chỉnh lệch giờ (`-1s` / `-0.5s` / `0s` / `+0.5s` / `+1s`) cho các MV có đoạn intro dài. |
| `🎙 AI Sub` | Bật/tắt **AI Whisper** nghe trực tiếp tiếng video để tạo phụ đề cho những video không có sub sẵn. |
| `📂` | Nạp file phụ đề `.SRT` hoặc `.VTT` từ máy tính. |
| `🎨` | Chỉnh giao diện phụ đề theo gu: chế độ song ngữ/đơn ngữ, cỡ chữ, màu sắc, độ mờ nền, vị trí, độ rộng và **Lyric Glow**. |
| `⚙️` | Mở trang Cài đặt đầy đủ để nhập API Key, đổi ngôn ngữ dịch, tùy biến prompt AI, xem lại từ vựng đã lưu (xuất `.CSV` cho Anki) và đổi ngôn ngữ giao diện. |
| `⬇` | Tải phụ đề hiện tại về máy ở định dạng `.SRT` (Song ngữ / Ngoại ngữ / Bản dịch), `.VTT` hoặc `.TXT`. |
| `🔄` | Dịch lại toàn bộ phụ đề của video đang xem. |

> **Mẹo nhỏ:** Bấm thẳng vào bất kỳ từ nào trên phụ đề để tra nghĩa & xem phiên âm, bấm `🔊` để nghe phát âm, hoặc bấm `☆` (`★`) để lưu vào sổ từ vựng.

## Cài đặt

### Firefox
DuazTube đã có mặt chính thức trên **Cửa hàng tiện ích Firefox Add-ons**, bạn chỉ cần bấm vào link bên dưới là cài được ngay:
- 👉 **[Cài DuazTube trên Firefox Add-ons](https://addons.mozilla.org/vi/firefox/addon/duaztube/)**

### Chrome / Edge / Brave / Cốc Cốc
1. Tải file `Duaztube-chromium.zip` ở mục [Releases](https://github.com/JumStarz/DuazTube/releases) rồi giải nén ra.
2. Vào `chrome://extensions/` (hoặc `edge://extensions/`), bật **Chế độ dành cho nhà phát triển (Developer mode)**.
3. Bấm **Tải tiện ích đã giải nén (Load unpacked)** rồi chọn thư mục `Duaztube-chromium` vừa giải nén.

## Quyền riêng tư & Bảo mật
- **Không thu thập dữ liệu:** DuazTube không theo dõi hay gửi bất kỳ dữ liệu nào của bạn về máy chủ của tác giả.
- **API Key lưu ngay trên máy bạn:** Các khóa API AI (Gemini, Groq...) chỉ nằm trong `storage.local` của trình duyệt và gửi thẳng tới nhà cung cấp bạn chọn.

## Ủng hộ tác giả
DuazTube hoàn toàn miễn phí và mã nguồn mở. Nếu tiện ích giúp việc học ngoại ngữ hoặc xem video của bạn thoải mái hơn, bạn có thể mời mình một ly cà phê tại:
- 🎮 [PlayerDuo (Việt Nam)](https://playerduo.net.vn/12897348) · ☕ [Gumroad (Quốc tế)](https://jumstar.gumroad.com/l/donate)

## Lưu ý
DuazTube là dự án mã nguồn mở độc lập, không liên kết với YouTube, Bilibili, Google, Microsoft hay Mozilla. Khi dùng các dịch vụ dịch thuật/AI, bạn nhớ tuân thủ điều khoản của nhà cung cấp tương ứng nhé.

## Giấy phép
Phát hành theo [Giấy phép MIT](LICENSE).
