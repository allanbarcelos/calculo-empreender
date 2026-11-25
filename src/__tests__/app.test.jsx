// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';
import ServicesProvider from '../context/ServicesProvider.jsx';
import { jsonDatabase } from '../repositories/database.js';
import { createServices } from '../services/container.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const services = createServices(jsonDatabase, '2026-11-25');
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

describe('App', () => {
  it('walks through every step to the result', () => {
    expect(count()).toBe('Etapa 1 de 7');
    for (let i = 0; i < 6; i += 1) next();
    expect(count()).toBe('Etapa 7 de 7');
    expect(container.textContent).toContain('Investimento inicial total');
    expect(container.textContent).toContain('36 meses');
    expect(container.querySelector('svg[role="img"]')).not.toBeNull();
  });

  it('changing the business reloads its equipment', () => {
    act(() => radio('padaria').click());
    next();
    next();
    expect(container.textContent).toMatch(/[Ff]orno/);
  });

  it('every business renders every step', () => {
    for (const b of services.businesses.list()) {
      act(() => radio(b.id)?.click());
      for (let i = 0; i < 6; i += 1) next();
      expect(count()).toBe('Etapa 7 de 7');
      act(() => [...container.querySelectorAll('.stepper button')][0].click());
    }
  });
});
