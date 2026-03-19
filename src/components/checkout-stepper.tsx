'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

type Step = {
  id: number;
  label: string;
};

type CheckoutStepperProps = {
  steps: Step[];
  currentStep: number;
};

export default function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Círculo del paso */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step.id < currentStep
                    ? 'bg-emerald-500 text-slate-950' // Completado
                    : step.id === currentStep
                      ? isDark
                        ? 'bg-slate-700 text-white ring-4 ring-slate-700/20'
                        : 'bg-blue-600 text-white ring-4 ring-blue-600/20' // Activo
                      : isDark
                      ? 'bg-slate-800 text-slate-500' // Deshabilitado
                      : 'bg-slate-300 text-slate-600' // Deshabilitado
                }`}
              >
                {step.id < currentStep ? (
                  <Check size={20} />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <p
                className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                  step.id <= currentStep ? isDark ? 'text-slate-100' : 'text-slate-900' : isDark ? 'text-slate-500' : 'text-slate-600'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 mt-6 transition-all ${
                  step.id < currentStep ? 'bg-emerald-500' : isDark ? 'bg-slate-800' : 'bg-slate-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
