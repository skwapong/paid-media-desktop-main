/**
 * PlanGenerationLoading — Loading animation shown while AI generates campaign plans.
 * 3-card step visualization matching Figma design (node 6187:238961).
 */

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, FileText, BarChart3, Layers } from 'lucide-react';

interface StepProgress {
  bars: number[]; // 0-100 per bar
  active: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Understanding your campaign brief',
    description: 'Analyzing your goals, target audience, budget constraints, and key performance indicators to build a comprehensive blueprint.',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Compiling a campaign plan',
    description: 'Researching market trends, competitor strategies, and best practices to create a data-driven campaign strategy.',
    icon: BarChart3,
  },
  {
    id: 3,
    title: 'Pulling data together and displaying findings',
    description: 'Synthesizing requirements and research to generate a customized campaign plan recommendation with clear action steps.',
    icon: Layers,
  },
];

export default function PlanGenerationLoading() {
  const [stepProgress, setStepProgress] = useState<StepProgress[]>([
    { bars: [0, 0, 0, 0], active: true },
    { bars: [0, 0, 0], active: false },
    { bars: [0], active: false },
  ]);
  const [showNotify, setShowNotify] = useState(true);

  // Animate progress bars sequentially
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 1: 4 progress bars animate over 2s
    const step1Bars = [100, 100, 65, 0];
    step1Bars.forEach((target, i) => {
      timers.push(setTimeout(() => {
        setStepProgress((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], bars: [...next[0].bars] };
          next[0].bars[i] = target;
          return next;
        });
      }, 400 + i * 500));
    });

    // Step 2 becomes active at 2.5s
    timers.push(setTimeout(() => {
      setStepProgress((prev) => {
        const next = [...prev];
        next[1] = { ...next[1], active: true };
        return next;
      });
    }, 2500));

    // Step 2 bars animate
    [60, 45, 30].forEach((target, i) => {
      timers.push(setTimeout(() => {
        setStepProgress((prev) => {
          const next = [...prev];
          next[1] = { ...next[1], bars: [...next[1].bars] };
          next[1].bars[i] = target;
          return next;
        });
      }, 3000 + i * 400));
    });

    // Step 3 becomes active at 4.5s
    timers.push(setTimeout(() => {
      setStepProgress((prev) => {
        const next = [...prev];
        next[2] = { ...next[2], active: true };
        return next;
      });
    }, 4500));

    // Step 3 progress bar
    timers.push(setTimeout(() => {
      setStepProgress((prev) => {
        const next = [...prev];
        next[2] = { ...next[2], bars: [55] };
        return next;
      });
    }, 5000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl p-6 gap-6 items-center justify-center relative">
      {/* Step Cards */}
      <div className="flex gap-6 w-full max-w-[1100px]">
        {STEPS.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            progress={stepProgress[idx]}
            vizType={idx as 0 | 1 | 2}
          />
        ))}
      </div>

      {/* Notification Banner */}
      {showNotify && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#EFF2F8] rounded-[10px] px-4 h-[86px] w-[448px] flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-[#DBEAFE] rounded-full flex items-center justify-center shrink-0">
            <Bell size={20} className="text-[#51A2FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#101828] leading-5">Get notified when complete</p>
            <p className="text-xs text-[#4A5565] leading-4">We&apos;ll let you know when your campaign plan is ready</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium text-[#212327] border border-[#878F9E] rounded-lg bg-transparent cursor-pointer hover:bg-gray-50 shrink-0">
            Notify me
          </button>
          <button
            onClick={() => setShowNotify(false)}
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function StepCard({
  step,
  progress,
  vizType,
}: {
  step: typeof STEPS[number];
  progress: StepProgress;
  vizType: 0 | 1 | 2;
}) {
  const Icon = step.icon;

  return (
    <div className="flex-1 bg-[#E8ECF3] border border-[#E5E7EB] rounded-[10px] h-[303px] relative p-4 flex flex-col">
      {/* Step number */}
      <div className="w-6 h-6 bg-[#CBD1DB] rounded-full flex items-center justify-center mb-2">
        <span className="text-xs font-medium text-[#0A0A0A]">{step.id}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[#0A0A0A] leading-5 tracking-tight mb-1">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-[#4A5565] leading-4 mb-auto">
        {step.description}
      </p>

      {/* Visualization Card */}
      <div className="bg-white rounded-[10px] shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)] p-4">
        {vizType === 0 && <ProgressBarsViz bars={progress.bars} active={progress.active} />}
        {vizType === 1 && <DataViz bars={progress.bars} active={progress.active} />}
        {vizType === 2 && <GradientViz bars={progress.bars} active={progress.active} />}
      </div>
    </div>
  );
}

// Step 1: Progress bars with checkmarks
function ProgressBarsViz({ bars, active }: { bars: number[]; active: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {bars.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          {value >= 100 ? (
            <CheckCircle2 size={14} className="text-[#51A2FF] shrink-0" />
          ) : (
            <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${active && value > 0 ? 'border-[#51A2FF]' : 'border-[#D1D5DC]'}`} />
          )}
          <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#51A2FF] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${value}%`, opacity: value > 0 && value < 100 ? 0.72 : 1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Step 2: Data visualization with colored dots and bars
function DataViz({ bars, active }: { bars: number[]; active: boolean }) {
  const colors = ['#51A2FF', '#C27AFF', '#FF8904'];
  const barHeights = [16, 24, 20, 28];

  return (
    <div className="flex flex-col gap-2">
      {/* Header with icon */}
      <div className="flex items-center gap-2 pb-1 border-b border-[#E5E7EB]">
        <BarChart3 size={14} className="text-[#51A2FF]" />
        <div className="h-1.5 w-20 bg-[#D1D5DC] rounded-full" />
      </div>

      {/* Colored dot rows */}
      <div className="flex flex-col gap-1.5">
        {bars.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
            <div
              className="h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{
                width: active ? `${Math.max(value * 3.5, 0)}px` : '0px',
                backgroundColor: '#E5E7EB',
                opacity: value > 0 ? 0.72 : 1,
              }}
            />
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-0.5 h-7">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-md transition-all duration-500 ease-out"
            style={{
              height: active ? `${h}px` : '0px',
              backgroundColor: ['#8EC5FF', '#DAB2FF', '#FFB86A', '#7BF1A8'][i],
              transitionDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Step 3: Gradient progress bar with skeleton lines
function GradientViz({ bars, active }: { bars: number[]; active: boolean }) {
  const value = bars[0] || 0;

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3 flex flex-col gap-2">
      {/* Gradient progress bar */}
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-[#51A2FF] shrink-0" />
        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF8904] via-[#C27AFF] to-[#51A2FF] transition-all duration-1000 ease-out"
            style={{ width: `${active ? value : 0}%`, opacity: 0.81 }}
          />
        </div>
      </div>

      {/* Skeleton lines */}
      <div className="flex flex-col gap-1.5 pl-6">
        {[170, 136, 128].map((w, i) => (
          <div
            key={i}
            className="h-1.5 bg-[#E5E7EB] rounded-full transition-all duration-500 ease-out"
            style={{
              width: active ? `${w}px` : '0px',
              transitionDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
