# PDF-openSky
Dịch file PDF từ Anh sang Việt bằng bất kỳ model AI nào (thông qua cổng trung gian OpenRouter). Đang trong giai đoạn phát triển & thử nghiệm.

Công cụ này được phát triển dựa trên phiên bản đã ổn định: https://github.com/kiencang/PDF-silaTranslator-Online

## Tuyên bố từ chối trách nhiệm
Công cụ này có thể được sử dụng cho mục đích nghiên cứu và học tập cá nhân.

PDF-openSky cũng như người phát triển nó không đưa ra bất kỳ bảo đảm rõ ràng hay ngụ ý nào, cũng như không tuyên bố rằng công cụ sẽ vận hành hoàn hảo, chính xác hoặc cập nhật. Người phát triển sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh trực tiếp hoặc gián tiếp liên quan đến hoặc phát sinh từ việc sử dụng công cụ này.

## Ghi công

Công cụ này được hoàn thành dựa vào nhiều thư viện khác. Một số thư viện quan trọng bao gồm:

### 1. Nền tảng
*   **[Angular](https://angular.dev/)**: Framework Javascript, sản phẩm của Google.
*   **[Tailwind CSS](https://tailwindcss.com/)**: Chịu trách nhiệm chính cho giao diện.
*   **[Lucide Angular](https://lucide.dev/)**: Bộ icon.

### 2. PDF core
*   **[pdf-lib](https://pdf-lib.js.org/)**: Giúp chia tách, cắt ngắn file PDF.
*   **[Mozilla PDF.js](https://mozilla.github.io/pdf.js/)** – Phát triển bởi **Mozilla**. Thư viện chạy hoàn toàn trên Client-side, giúp trích xuất hình ảnh trong file PDF.
