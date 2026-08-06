# PDF-openSky

Dịch file PDF từ tiếng Anh sang tiếng Việt bằng bất kỳ model AI nào (thông qua cổng trung gian OpenRouter). PDF-openSky đang trong giai đoạn phát triển & thử nghiệm.

**Link**: https://pdf-opensky.wpsila.com

Ứng dụng web không cần đăng nhập, tạo tài khoản. Chỉ cần nhập API Key của OpenRouter là dùng được ngay. API Key được lưu cục bộ tại trình duyệt của người dùng, do vậy bạn chỉ nên dùng nó trên máy tính cá nhân của riêng bạn.

PDF-openSky được điều chỉnh, phát triển thêm dựa trên phiên bản PDF-silaTranslator-Online (1.0.64) đã ổn định: https://github.com/kiencang/PDF-silaTranslator-Online

SI/Prompt (v1.3.48): https://github.com/kiencang/SI-Prompt-PDF-EV-Translate

## Lý do triển khai

PDF-silaTranslator-Online hiện có chất lượng tốt, tương thích rất mạnh với Gemini AI, tuy nhiên nó chỉ cho phép dùng Gemini mà không dùng được bất cứ AI nào khác.

PDF-openSky ra đời nhằm khỏa lấp chỗ trống đó, nó giúp người dùng sử dụng các model AI rất mạnh khác mà thị trường hiện có sẵn.

Để giảm mức độ phức tạp của mã nguồn và tăng khả năng mở rộng lên tối đa, PDF-openSky sử dụng cổng trung gian OpenRouter (https://openrouter.ai/) để kết nối với các model AI. OpenRouter rất dễ đăng ký cũng như sử dụng.

Vì OpenRouter là API trung gian và hầu hết các model trên này đều có phí, nếu người dùng nào có khả năng chi trả hạn chế vẫn nên tiếp tục sử dụng PDF-silaTranslator-Online, vì công cụ này tận dụng được ngưỡng miễn phí ngày tương đối rộng rãi của Gemini.

## Tính năng chính

Về cơ bản, PDF-openSky không khác biệt với PDF-silaTranslator-Online, chúng đều có cùng thiết kế và hệ thống SI/Prompt dịch thuật.

Điểm khác căn bản là PDF-openSky cho phép kết nối với nhiều model AI khác, và gần như là bất cứ AI nào trên thị trường hiện có (OpenRouter có khả năng kết nối tới 400 model AI khác nhau).

Mặc định PDF-openSky có các model AI sau:
- Google Gemini Flash Latest
- OpenAI GPT Latest
- Anthropic Claude Opus Latest
- xAI Grok Latest
- MoonshotAI Kimi Latest
- MiniMax M3
- Z.ai GLM 5.2

Danh sách các model AI phổ biến & mạnh nhất có thể tham khảo ở đây: https://openrouter.ai/discover

Nên chọn các model có khả năng xử lý đa phương thức (Multi-modal API) đủ mạnh, tức là hiểu được cả ảnh, text. Các model mà chỉ xử lý được text sẽ không dịch được PDF theo cách trực tiếp, model nào chỉ nhận text thì chỉ có khả năng dịch Phase 2 (dịch trực tiếp HTML). 

Ví dụ trong 7 model AI có sẵn ở trên, sáu model đầu tiên là đa phương thức, model cuối Z.ai GLM 5.2, dù rất mạnh, hiện nó chỉ chấp nhận đầu vào văn bản thuần, do vậy chỉ dùng dịch phase 2 của công cụ này. Các model còn lại có thể dịch trực tiếp file PDF luôn.

Đối với dịch từ khóa từ tiếng Việt sang tiếng Anh để tra cứu tài liệu trên Google Scholar, công cụ này sử dụng model có chất lượng khá và phản hồi nhanh là: `google/gemini-3.5-flash-lite`

Dịch từ khóa không cần các model quá mạnh, nó chỉ cần đủ tốt, và quan trọng nhất là phải có tốc độ cao để giảm thiểu thời gian chờ đợi của người dùng.

### Một số trải nghiệm thực tế
- Dịch nhanh nhất: Google Gemini Flash Latest;
- Chất lượng tổng thể tốt nhất: OpenAI GPT Latest, Anthropic Claude Opus Latest, Google Gemini Flash Latest;
- Chất lượng kém nhất: MiniMax M3;
- Tiềm năng, triển vọng: Z.ai GLM 5.2, MoonshotAI Kimi Latest;
- Tốt nhưng rất chậm: MoonshotAI Kimi Latest;

## Reasoning (suy luận)

Để tăng chất lượng dịch, tất cả các model khi dịch đều được chỉ định tham số Reasoning ở mức HIGH (Cao).

Người dùng có quyền điều chỉnh tham số này, bao gồm cả thiết lập mức LOW (Thấp) hoặc tắt hoàn toàn. Tuy nhiên lời khuyên chung cho các tác vụ khó, và dĩ nhiên trong đó có dịch thuật, chúng ta nên để tối thiểu là MEDIUM (Trung bình), còn lý tưởng nhất nên để HIGH.

Điểm duy nhất cần lưu ý ở đây: Mức suy luận để càng cao, chi phí sẽ càng tăng thêm.

## Độ sáng tạo (temperature)

Cho phép điều chỉnh, nhưng mặc định để 1 như khuyến cáo của một số model AI. Giá trị mặc định này giúp AI suy luận tốt hơn.

Trừ khi kết quả dịch tệ, người dùng mới nên hạ thấp con số này xuống, ví dụ chuyển thành 0.5

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

### 3. Khác
*   **[js-tiktoken](https://www.npmjs.com/package/js-tiktoken/)**: Đếm token của file gửi lên.
