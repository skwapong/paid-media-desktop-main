import type { WizardStep } from '../../types/campaignConfig';

interface WizardStepperProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

const steps: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Campaign Setup' },
  { id: 2, label: 'Audiences' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Review & Launch' },
];

export default function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onStepClick(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  isActive ? 'bg-black/5' : ''
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? 'bg-black text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-black/5 text-black'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={`text-sm ${
                    isActive ? 'text-black font-medium' : 'text-black/60'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`w-6 h-px mx-2 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
