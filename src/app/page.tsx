"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ImageIcon, Send, X, UploadCloud } from 'lucide-react';
import { NutritionFactsCard, NutritionData } from '@/components/NutritionFactsCard';
import { TypingIndicator } from '@/components/TypingIndicator';

export default function Chat() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutrition_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Failed to restore chat messages', e);
      }
    }
  }, [setMessages]);

  // Persist to localStorage on every change (skip initial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('nutrition_chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;

    const text = input || 'What is this food?';

    if (imagePreview) {
      const attachments = [
        {
          name: imageFile?.name ?? 'image',
          contentType: imageFile?.type ?? 'image/jpeg',
          url: imagePreview,
        },
      ];

      // Send text message; pass attachments in body so backend can see them
      await sendMessage(
        { text },
        { body: { experimental_attachments: attachments } }
      );

      // Patch the last user message in state to carry the attachment for display
      setMessages((prev: any[]) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'user') {
          copy[copy.length - 1] = { ...last, experimental_attachments: attachments };
        }
        return copy;
      });

      setImageFile(null);
      setImagePreview(null);
    } else {
      await sendMessage({ text });
    }

    setInput('');
  };

  // Safe text extractor per GEMINI.md rule #3
  const getMessageText = (m: any): string => {
    if (typeof m.content === 'string' && m.content) return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text as string)
        .join('');
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-200">
      <header className="py-4 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Nutritionist AI
        </h1>
        <p className="text-xs text-slate-400">Upload a food photo to get started</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto opacity-70">
            <div className="p-4 bg-slate-800 rounded-full">
              <UploadCloud size={48} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">Snap your meal</h2>
            <p className="text-slate-400">
              Upload a picture of what you're eating. I'll analyze it, generate an FDA nutrition label, and answer any questions you have about it!
            </p>
          </div>
        )}

        {messages.map((m: any) => {
          const rawText = getMessageText(m);

          let displayContent = rawText;
          let parsedNutrition: NutritionData | null = null;

          if (m.role === 'assistant' && rawText.includes('<<NUTRITION_JSON>>')) {
            const startIdx = rawText.indexOf('<<NUTRITION_JSON>>') + '<<NUTRITION_JSON>>'.length;
            const endIdx = rawText.indexOf('<</NUTRITION_JSON>>');

            if (endIdx !== -1) {
              const jsonStr = rawText.substring(startIdx, endIdx).trim();
              try {
                parsedNutrition = JSON.parse(jsonStr);
                displayContent = rawText.replace(/<<NUTRITION_JSON>>[\s\S]*?<<\/NUTRITION_JSON>>/, '').trim();
              } catch (err) {
                console.error('Failed to parse nutrition JSON', err);
              }
            } else {
              // Still streaming – hide partial JSON block
              displayContent = rawText.replace(/<<NUTRITION_JSON>>[\s\S]*/, '').trim();
            }
          }

          return (
            <div key={m.id ?? Math.random().toString()} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.role === 'assistant' && parsedNutrition && (
                <div className="mb-4 w-full flex justify-start">
                  <NutritionFactsCard data={parsedNutrition} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-lg ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'glass text-slate-200 rounded-tl-sm'
                }`}
              >
                {m.experimental_attachments && m.experimental_attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {m.experimental_attachments.map((att: any, i: number) => (
                      <img
                        key={i}
                        src={att.url}
                        alt="attachment"
                        className="rounded-lg max-h-48 object-cover border border-emerald-500/30"
                      />
                    ))}
                  </div>
                )}

                {displayContent && (
                  <div className={`prose prose-sm md:prose-base ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  </div>
                )}

                {!displayContent && !parsedNutrition && m.role === 'assistant' && (
                  <span className="text-slate-400 italic text-sm">Analyzing...</span>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 shrink-0">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-slate-700 shadow-sm" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 rounded-full p-1 border border-slate-600 hover:bg-slate-700 transition"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl mx-auto items-center">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:bg-slate-700 transition flex-shrink-0 h-12"
            title="Upload photo"
          >
            <ImageIcon size={20} />
          </button>

          <input
            type="text"
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={messages.length === 0 ? 'Upload a photo to begin...' : 'Ask about the nutrition...'}
            disabled={messages.length === 0 && !imageFile}
          />

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageFile)}
            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-12"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
