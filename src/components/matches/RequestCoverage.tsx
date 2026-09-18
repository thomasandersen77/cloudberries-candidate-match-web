import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { RequirementCoverage, RequirementCoverageItem } from './coverageText';

export type { RequirementCoverage, RequirementCoverageItem } from './coverageText';

/** How long a requirement name may run on a chip before it is cut, with the whole in the tooltip. */
const CHIP_LABEL_MAX = 44;

function chipLabel(item: RequirementCoverageItem): string {
  const name = item.name.length > CHIP_LABEL_MAX ? `${item.name.slice(0, CHIP_LABEL_MAX - 1)}…` : item.name;
  return `${name} ${item.consultants}`;
}

type CoverageChipsProps = {
  coverage: RequirementCoverage;
  /** The card shows the musts and counts the rest; the panel shows everything. */
  mustOnly?: boolean;
};

/**
 * The requirements as chips with the number of active consultants holding each. A must is drawn
 * firmer than a should, and a requirement nobody holds is red: that chip is the bottleneck, and
 * it is what somebody scanning the list is looking for.
 */
export const CoverageChips: React.FC<CoverageChipsProps> = ({ coverage, mustOnly = false }) => {
  const shown = mustOnly ? coverage.requirements.filter((r) => r.priority === 'MUST') : coverage.requirements;
  const hidden = coverage.requirements.length - shown.length;
  if (shown.length === 0 && hidden === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {shown.map((item) => {
        const none = item.consultants === 0;
        const must = item.priority === 'MUST';
        return (
          <Tooltip
            key={`${item.priority}-${item.name}`}
            title={`${must ? 'Må-krav' : 'Bør-krav'}: ${item.name}. ${item.consultants} aktive konsulenter har ${item.skills.join(' eller ').toLowerCase()} på CV-en.`}
          >
            <Chip
              size="small"
              variant="outlined"
              color={none ? 'error' : 'default'}
              label={chipLabel(item)}
              sx={{
                fontWeight: must ? 600 : 400,
                borderStyle: must ? 'solid' : 'dashed',
                opacity: must || none ? 1 : 0.85,
              }}
            />
          </Tooltip>
        );
      })}
      {hidden > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          + {hidden} {hidden === 1 ? 'bør-krav' : 'bør-krav'}
        </Typography>
      )}
    </Box>
  );
};

export default CoverageChips;
