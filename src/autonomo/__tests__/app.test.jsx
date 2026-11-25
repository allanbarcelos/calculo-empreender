// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ServicesProvider from '../../context/ServicesProvider.jsx';
import App from '../App.jsx';
import { createWorkServices } from '../container.js';
import { workDatabase } from '../database.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const services = createWorkServices(workDatabase, '2026-11-25');
let container;
let root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ServicesProvider services={services}><App /></ServicesProvider>));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const next = () => act(() => container.querySelector('form').requestSubmit());
const count = () => container.querySelector('.step__count').textContent;
const radio = (value) => container.querySelector(`input[type="radio"][value="${value}"]`);
const first = () => act(() => [...container.querySelectorAll('.stepper button')][0].click());

describe('Autonomous work page', () => {
  it('walks through every step to the result with the CLT comparison', () => {
    expect(count()).toBe('Etapa 1 de 7');
    for (let i = 0; i < 6; i += 1) next();
    expect(count()).toBe('Etapa 7 de 7');
    expect(container.textContent).toContain('Por conta própria × emprego CLT');
    expect(container.textContent).toContain('Salário CLT equivalente');
  });

  it('every occupation renders every step in both regimes', () => {
    for (const o of services.occupations.list()) {
      for (const regime of ['mei', 'individual']) {
        act(() => radio(o.id).click());
        next();
        next();
        next();
        next();
        act(() => radio(regime).click());
        next();
        next();
        expect(count()).toBe('Etapa 7 de 7');
        expect(container.textContent).toContain(o.label);
        first();
      }
    }
  });

  it('switching to a rented vehicle shows the weekly rent', () => {
    next();
    next();
    act(() => radio('rented').click());
    expect(container.textContent).toContain('Aluguel por semana');
  });

  it('saves its form apart from the business calculator', () => {
    act(() => radio('eletricista').click());
    expect(JSON.parse(localStorage.getItem('calculo-autonomo:v1')).occupationId).toBe('eletricista');
    expect(localStorage.getItem('calculo-empreender:v1')).toBeNull();
  });

  it('links back to the business calculator', () => {
    expect(container.textContent).toContain('Use o Cálculo Empreender');
  });
});
