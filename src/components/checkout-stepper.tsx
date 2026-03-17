'use client';

import React from 'react';
import { Check } from 'lucide-react';

type Step = {
  id: number;
  label: string;
};

type CheckoutStepperProps = {
  steps: Step[];
  currentStep: number;
};

export default function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
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
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20' // Activo
                      : 'bg-slate-800 text-slate-500' // Deshabilitado
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
                  step.id <= currentStep ? 'text-slate-100' : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 mt-6 transition-all ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
