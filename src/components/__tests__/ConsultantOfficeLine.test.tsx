import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConsultantOfficeLine from '../ConsultantOfficeLine';

describe('ConsultantOfficeLine', () => {
  it('shows the office, and marks an external account', () => {
    render(<ConsultantOfficeLine consultant={{ office: 'Sør-Vest', flowcaseRoles: ['external'] }} />);

    expect(screen.getByText('Sør-Vest')).toBeInTheDocument();
    expect(screen.getByText('Ekstern')).toBeInTheDocument();
  });

  it('says nothing about a consultant who is one of ours', () => {
    render(<ConsultantOfficeLine consultant={{ office: 'Oslo', flowcaseRoles: ['consultant'] }} />);

    expect(screen.getByText('Oslo')).toBeInTheDocument();
    expect(screen.queryByText('Ekstern')).not.toBeInTheDocument();
  });

  /** A row without either does not carry an empty line. */
  it('renders nothing when neither is known', () => {
    const { container } = render(<ConsultantOfficeLine consultant={{ office: null, flowcaseRoles: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
