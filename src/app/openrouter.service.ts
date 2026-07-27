import { Injectable } from '@angular/core';

export type ReasoningEffort = 'high' | 'medium' | 'low' | 'none';

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface OpenRouterModelConfig {
  id: string;
  name: string;
}

export interface OpenRouterContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export const DEFAULT_OPENROUTER_MODELS: OpenRouterModelConfig[] = [
  { id: '~google/gemini-flash-latest', name: 'Google Gemini Flash Latest' },
  { id: '~openai/gpt-latest', name: 'OpenAI GPT Latest' },
  { id: '~anthropic/claude-opus-latest', name: 'Anthropic Claude Opus Latest' },
  { id: '~x-ai/grok-latest', name: 'xAI Grok Latest' },
  { id: '~moonshotai/kimi-latest', name: 'MoonshotAI Kimi Latest' },
  { id: 'z-ai/glm-5.2', name: 'Z.ai GLM 5.2' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra (free)' }
];

export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Rất nhanh, giá rẻ, hỗ trợ PDF & hình ảnh tốt.'
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Chất lượng cao nhất cho tài liệu phức tạp.'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Dịch thuật tự nhiên, phân tích bố cục cực tốt.'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Model đa thức mạnh mẽ của OpenAI.'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Model giá siêu rẻ, suy luận nhanh.'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Mã nguồn mở chất lượng cao.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class OpenRouterService {
  private readonly DEFAULT_MODEL = 'google/gemini-2.5-flash';

  private getApiKey(): string {
    if (typeof localStorage !== 'undefined') {
      const userKey = localStorage.getItem('openrouter_api_key') || localStorage.getItem('sila_pdf_translator_user_api_key');
      if (userKey && userKey.trim() !== '') {
        return userKey.trim();
      }
    }
    throw new Error('Vui lòng nhập OpenRouter API Key để sử dụng ứng dụng. Bạn có thể lấy Key tại openrouter.ai/keys.');
  }

  async countTokens(fileData: string, mimeType: string): Promise<number> {
    try {
      const cleanBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const byteSize = Math.floor(cleanBase64.length * 0.75);
      
      if (mimeType === 'text/html') {
        return Math.ceil(byteSize / 3.5);
      } else {
        return Math.ceil(byteSize / 300);
      }
    } catch {
      return 1000;
    }
  }

  async translate(
    fileData: string,
    mimeType: string,
    prompt: string,
    systemInstruction: string,
    modelName: string = this.DEFAULT_MODEL,
    images: { id: string; dataUrl: string }[] = [],
    reasoningEffort: ReasoningEffort = 'high',
    temperature = 0.5
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const cleanFileData = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    const contentParts: OpenRouterContentPart[] = [];

    if (mimeType === 'text/html') {
      let htmlText = cleanFileData;
      try {
        htmlText = new TextDecoder().decode(
          Uint8Array.from(atob(cleanFileData), c => c.charCodeAt(0))
        );
      } catch {
        // Fallback if not base64 encoded
      }
      contentParts.push({
        type: 'text',
        text: `[Tài liệu HTML cần dịch]:\n\n${htmlText}`
      });
    } else {
      // PDF or Image document via data URL
      const dataUrl = `data:${mimeType};base64,${cleanFileData}`;
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: dataUrl
        }
      });
    }

    // Attach extracted images if available
    for (const img of images) {
      if (img.dataUrl && img.dataUrl.includes(',')) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: img.dataUrl
          }
        });
        contentParts.push({
          type: 'text',
          text: `(This image has ID: ${img.id})`
        });
      }
    }

    // Attach prompt
    contentParts.push({
      type: 'text',
      text: prompt
    });

    const requestBody: Record<string, unknown> = {
      model: modelName,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: contentParts }
      ],
      temperature: temperature
    };

    if (reasoningEffort) {
      requestBody['reasoning'] = {
        effort: reasoningEffort,
        exclude: true
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pdf-opensky.ai',
        'X-Title': 'PDF-openSky'
      },
      body: JSON.stringify(requestBody)
    });

    const json = await response.json();

    if (!response.ok || json.error) {
      const errMsg = json.error?.message || json.error || `Lỗi OpenRouter (${response.status})`;
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenRouter không trả về nội dung kết quả.');
    }

    return text;
  }

  async translateHtml(
    htmlContent: string,
    prompt: string,
    systemInstruction: string,
    modelName: string = this.DEFAULT_MODEL,
    images: { id: string; dataUrl: string }[] = [],
    reasoningEffort: ReasoningEffort = 'high',
    temperature = 0.5
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const cleanHtmlContent = htmlContent.includes(',') ? htmlContent.split(',')[1] : htmlContent;

    let htmlText = cleanHtmlContent;
    try {
      htmlText = new TextDecoder().decode(
        Uint8Array.from(atob(cleanHtmlContent), c => c.charCodeAt(0))
      );
    } catch {
      // Fallback
    }

    const contentParts: OpenRouterContentPart[] = [];
    contentParts.push({
      type: 'text',
      text: `[Mã HTML tài liệu]:\n\n${htmlText}`
    });

    if (images && images.length > 0) {
      const ids = images.map(img => img.id).join(', ');
      contentParts.push({
        type: 'text',
        text: `Tài liệu HTML này chứa các hình ảnh có ID sau: [${ids}]. Nhiệm vụ của bạn là giữ nguyên các thẻ <img> và thuộc tính src tương ứng của chúng trong mã HTML kết quả.`
      });
    }

    contentParts.push({
      type: 'text',
      text: prompt
    });

    const requestBody: Record<string, unknown> = {
      model: modelName,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: contentParts }
      ],
      temperature: temperature
    };

    if (reasoningEffort) {
      requestBody['reasoning'] = {
        effort: reasoningEffort,
        exclude: true
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pdf-opensky.ai',
        'X-Title': 'PDF-openSky'
      },
      body: JSON.stringify(requestBody)
    });

    const json = await response.json();

    if (!response.ok || json.error) {
      const errMsg = json.error?.message || json.error || `Lỗi OpenRouter (${response.status})`;
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenRouter không trả về nội dung kết quả.');
    }

    return text;
  }

  async translateSearchQuery(query: string, modelName: string = this.DEFAULT_MODEL): Promise<string> {
    const apiKey = this.getApiKey();
    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang Tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất.
QUY TẮC:
1. CHỈ MỘT KẾT QUẢ
2. CHỈ VĂN BẢN THUẦN TÚY - KHÔNG CÓ THÊM BẤT KỲ TỪ NÀO KHÁC
3. ƯU TIÊN THUẬT NGỮ HỌC THUẬT TÌM KIẾM TRÊN GOOGLE SCHOLAR`;

    const prompt = `Output ONLY the best English search query translation for: ${query}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pdf-opensky.ai',
        'X-Title': 'PDF-openSky'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    const json = await response.json();

    if (!response.ok || json.error) {
      const errMsg = json.error?.message || json.error || `Lỗi OpenRouter (${response.status})`;
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    const text = json.choices?.[0]?.message?.content || '';
    return text.trim();
  }

  getCustomModels(): OpenRouterModelConfig[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('openrouter_custom_models');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // Ignore
        }
      }
    }
    return DEFAULT_OPENROUTER_MODELS;
  }

  saveCustomModels(models: OpenRouterModelConfig[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('openrouter_custom_models', JSON.stringify(models));
    }
  }

  public parseOpenRouterError(e: unknown): string {
    if (e instanceof Error) {
      return e.message;
    }
    return String(e) || 'Lỗi không xác định khi gọi OpenRouter';
  }
}
