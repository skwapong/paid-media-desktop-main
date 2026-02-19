/**
 * CampaignLandingPage -- Hero landing page for the campaign planner.
 * Converted from Emotion CSS to Tailwind. Uses react-router-dom for navigation
 * and useBlueprintStore (Zustand) for saved blueprints.
 *
 * Layout.tsx already provides the sidebar and top nav, so this component
 * renders only the main content area.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SavedBlueprintsSection from './SavedBlueprintsSection';

// ---- Quick Prompt Data ----

const QUICK_PROMPTS = [
  {
    title: 'Q1 Brand Awareness',
    description: 'Launch a multi-channel brand awareness campaign targeting new audiences in Q1',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    title: 'Product Launch Campaign',
    description: 'Create a full-funnel product launch campaign with social, search, and display ads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    title: 'Retargeting Strategy',
    description: 'Build a retargeting campaign to re-engage website visitors and cart abandoners',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: 'Holiday Season Push',
    description: 'Plan a holiday season campaign maximizing conversions across Meta and Google Ads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    title: 'Lead Gen for B2B SaaS',
    description: 'Design a lead generation campaign for B2B SaaS with LinkedIn and Google Ads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'App Install Campaign',
    description: 'Drive mobile app installs with optimized creatives for TikTok and Meta platforms',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
];

// ---- QuickPromptCarousel ----

function QuickPromptCarousel({ onSelect }: { onSelect: (prompt: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animationFrame: number;
    let scrollSpeed = 0.5;

    const step = () => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += scrollSpeed;
      }
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  return (
    <div
      className="w-full mt-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate prompts for seamless loop */}
        {[...QUICK_PROMPTS, ...QUICK_PROMPTS].map((prompt, index) => (
          <button
            key={`${prompt.title}-${index}`}
            onClick={() => onSelect(prompt.description)}
            className="flex-shrink-0 w-64 text-left bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/90 hover:border-gray-200 hover:shadow-md group"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                {prompt.icon}
              </div>
              <span className="text-sm font-semibold text-gray-800">{prompt.title}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {prompt.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- CampaignLandingPage ----

export default function CampaignLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [briefText, setBriefText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-populate from search params if present
  useEffect(() => {
    const briefParam = searchParams.get('brief');
    if (briefParam) {
      setBriefText(decodeURIComponent(briefParam));
    }
  }, [searchParams]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBriefText(e.target.value);
      // Auto-resize
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    },
    []
  );

  // File attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit brief
  const handleSubmit = useCallback(() => {
    const text = briefText.trim();
    if (!text && !attachedFile) return;

    // If a file is attached, store it in sessionStorage as base64 for transfer
    if (attachedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem(
          'pendingFileData',
          JSON.stringify({
            name: attachedFile.name,
            base64: (reader.result as string).split(',')[1],
          })
        );
        navigateToChat(text || `Please analyze this campaign brief: ${attachedFile.name}`);
      };
      reader.readAsDataURL(attachedFile);
    } else {
      navigateToChat(text);
    }
  }, [briefText, attachedFile]);

  const navigateToChat = (text: string) => {
    const params = new URLSearchParams();
    params.set('brief', encodeURIComponent(text));
    if (attachedFile) {
      params.set('fileName', attachedFile.name);
    }
    navigate(`/campaign-chat?${params.toString()}`);
  };

  // Quick prompt selection
  const handleQuickPromptSelect = (promptText: string) => {
    setBriefText(promptText);
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(0deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.30) 100%), url(/assets/background.png) lightgray 50% / cover no-repeat',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-10">
          {/* Sparkle icon */}
          <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3 leading-tight">
            Turn a campaign brief into an
            <br />
            execution ready plan
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
            Start with a brief — the agent will generate strategy, budget, and execution plans
          </p>
        </div>

        {/* Brief Input Area */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm transition-all focus-within:border-blue-300 focus-within:shadow-md">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={briefText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe your campaign goals, target audience, budget, and timeline. For example: 'Launch a Q1 brand awareness campaign targeting millennials on Meta and Google with a $50K budget over 6 weeks.'"
              rows={4}
              className="w-full px-5 pt-5 pb-3 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 resize-none leading-relaxed"
            />

            {/* Attached file indicator */}
            {attachedFile && (
              <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 w-fit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Bottom bar with buttons */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              {/* Plus / attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                title="Attach file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Send button - black circle */}
              <button
                onClick={handleSubmit}
                disabled={!briefText.trim() && !attachedFile}
                className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center transition-all hover:bg-gray-800 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                title="Send"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Prompt Carousel */}
        <QuickPromptCarousel onSelect={handleQuickPromptSelect} />

        {/* Saved Blueprints */}
        <SavedBlueprintsSection />
      </div>
    </div>
  );
}
