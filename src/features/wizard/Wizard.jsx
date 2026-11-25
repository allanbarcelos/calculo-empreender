import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormText } from '../../hooks/useFormText.js';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { useServices } from '../../hooks/useServices.js';
import LiveSummary from './LiveSummary.jsx';
import StepNav from './StepNav.jsx';
import Stepper from './Stepper.jsx';
import { STEPS } from './steps.js';

const STORAGE_KEY = 'calculo-empreender:v1';

export default function Wizard() {
  const { calculator, formDefaults, formState } = useServices();
  const t = useFormText();
  const steps = STEPS.map((s) => ({ ...s, ...t.step(s.id) }));
  const defaults = useMemo(() => formDefaults.defaults(), [formDefaults]);
  const [data, setData] = usePersistentState(STORAGE_KEY, defaults, (stored) => formState.restore(stored));
  const [step, setStep] = useState(0);
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const result = useMemo(() => calculator.calculate(data), [calculator, data]);
  const pristine = JSON.stringify(data) === JSON.stringify(defaults);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const reset = () => {
    setData(defaults);
    setStep(0);
  };

  const current = steps[step];
  const { Component } = current;

  return (
    <section id="calculadora" className="container calculator" aria-labelledby="step-heading">
      <Stepper steps={steps} current={step} onSelect={setStep} />
      <div className={`calculator__body${current.isResult ? ' calculator__body--full' : ''}`}>
        <form className="card step" noValidate onSubmit={(e) => { e.preventDefault(); setStep(Math.min(step + 1, steps.length - 1)); }}>
          <header className="step__header">
            <p className="step__count">Etapa {step + 1} de {steps.length}</p>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1}>{current.heading}</h2>
            <p className="step__intro">{current.intro}</p>
          </header>
          <div className="step__content">
            <Component data={data} set={set} result={result} />
          </div>
          <StepNav
            canGoBack={step > 0}
            isLast={step === steps.length - 1}
            isBeforeLast={step === steps.length - 2}
            onBack={() => setStep(step - 1)}
            onReset={reset}
          />
        </form>
        {!current.isResult && <LiveSummary result={result} onReset={pristine ? null : reset} />}
      </div>
    </section>
  );
}
