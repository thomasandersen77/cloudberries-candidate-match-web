import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HighQualityToggle, { HIGH_QUALITY_LABEL, HIGH_QUALITY_HELPER } from './HighQualityToggle';

describe('HighQualityToggle', () => {
  it('renders unchecked when checked=false (default off)', () => {
    render(<HighQualityToggle checked={false} onChange={() => {}} />);
    const toggle = screen.getByRole('checkbox', { name: HIGH_QUALITY_LABEL });
    expect(toggle).not.toBeChecked();
  });

  it('uses an abstract label with no hardcoded model name', () => {
    render(<HighQualityToggle checked={false} onChange={() => {}} />);
    expect(screen.getByText(HIGH_QUALITY_LABEL)).toBeInTheDocument();
    // Must not leak concrete model names into label/helper text.
    const forbidden = /opus|claude|sonnet|haiku|gpt|gemini/i;
    expect(HIGH_QUALITY_LABEL).not.toMatch(forbidden);
    expect(HIGH_QUALITY_HELPER).not.toMatch(forbidden);
  });

  it('calls onChange(true) when toggled on', () => {
    const onChange = vi.fn();
    render(<HighQualityToggle checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: HIGH_QUALITY_LABEL }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
