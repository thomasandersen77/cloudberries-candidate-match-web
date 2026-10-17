import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CvScoreBar from './CvScoreBar';
import { segmentFill, SEGMENTS } from './cvScoreBarSegments';

afterEach(() => cleanup());

describe('segmentFill', () => {
  it('fills a whole square per ten and the next one by the remainder', () => {
    expect(segmentFill(84)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, expect.closeTo(0.4, 5), 0]);
  });

  it('tells 84 from 80, which whole squares alone would not', () => {
    expect(segmentFill(80).slice(8)).toEqual([0, 0]);
    expect(segmentFill(84)[8]).toBeGreaterThan(0);
  });

  it('stays inside the scale', () => {
    expect(segmentFill(0)).toEqual(Array(SEGMENTS).fill(0));
    expect(segmentFill(100)).toEqual(Array(SEGMENTS).fill(1));
    expect(segmentFill(140)).toEqual(Array(SEGMENTS).fill(1));
    expect(segmentFill(-5)).toEqual(Array(SEGMENTS).fill(0));
  });
});

describe('CvScoreBar', () => {
  it('shows the number, ten squares, and both ends of the scale', () => {
    render(<CvScoreBar score={84} />);

    expect(screen.getByText('84 %')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    const meter = screen.getByRole('meter', { name: 'CV-skår 84 av 100' });
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '84');
    expect(meter.children).toHaveLength(SEGMENTS);
  });

  it('says there is no score rather than drawing an empty bar', () => {
    render(<CvScoreBar score={null} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});
