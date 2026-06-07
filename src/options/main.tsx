import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { runMigrations } from '../lib/storage';
import '../ui/theme.css';
import { Options } from './Options';

void runMigrations();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
