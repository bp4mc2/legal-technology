import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function App() {
  return (
    <div>
      <h1>Juridische Technologie Dashboard</h1>
      <p>Welkom! Hier kun je zoeken, toevoegen en bewerken.</p>
    </div>
  );
}

describe('Dashboard', () => {
  it('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText('Juridische Technologie Dashboard')).toBeDefined();
  });
});
