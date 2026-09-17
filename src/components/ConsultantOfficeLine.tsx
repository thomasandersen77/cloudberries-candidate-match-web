import React from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import type { ConsultantWithCvDto } from '../types/api';

/**
 * Where a person sits, and whether they are one of ours or an external, in one small line.
 *
 * Both come from Flowcase's user object and were dropped by the sync until 2026-09-17: the office
 * column was null for every row, and the account roles were never read. The CV headline in `role`
 * is a different thing and stays where it is shown. Renders nothing when neither is known, so a
 * row without them does not carry an empty line.
 */
const ConsultantOfficeLine: React.FC<{ consultant: Pick<ConsultantWithCvDto, 'office' | 'flowcaseRoles'> }> = ({ consultant }) => {
  const external = consultant.flowcaseRoles?.includes('external') ?? false;
  if (!consultant.office && !external) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
      {consultant.office && (
        <Typography variant="caption" color="text.secondary">
          {consultant.office}
        </Typography>
      )}
      {external && <Chip label="Ekstern" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
    </Stack>
  );
};

export default ConsultantOfficeLine;
