import { createRoot } from 'react-dom/client';
import { BankSyncApp } from '../src/pages/BankSyncApp';
import { createDemoContext } from './mock-context';

const params = new URLSearchParams(window.location.search);

createDemoContext({ empty: params.has('empty') }).then((ctx) => {
  createRoot(document.getElementById('root')!).render(<BankSyncApp ctx={ctx} search="" />);
});
