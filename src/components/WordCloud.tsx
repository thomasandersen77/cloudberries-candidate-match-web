import React from 'react';
import { Box, Chip } from '@mui/material';

export interface WordCloudProps {
  words: string[]; // pre-sorted by importance/frequency
  max?: number; // limit number of words
}

function scale(index: number, total: number) {
  if (total <= 1) return 1;
  const t = 1 - index / (total - 1); // 1..0
  return 0.85 + t * 0.9; // 0.85..1.75
}

export const WordCloud: React.FC<WordCloudProps> = ({ words, max = 60 }) => {
  const list = words.slice(0, max);
  const total = list.length;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {list.map((w, i) => (
        <Chip
          key={`${w}-${i}`}
          label={w}
          sx={{
            fontSize: `${Math.round(12 * scale(i, total))}px`,
            bgcolor: i % 3 === 0 ? '#FFEBEE' : i % 3 === 1 ? '#E3F2FD' : '#ECEFF1', // light red / light blue / light grey
            color: '#111',
            border: i % 3 === 0 ? '1px solid #FFCDD2' : '1px solid #ECEFF1',
          }}
        />
      ))}
    </Box>
  );
};

export default WordCloud;