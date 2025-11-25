import React, { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  OutlinedInput,
  Alert,
} from '@mui/material';
import type { CreateProjectRequestDto, ProjectRequestDto } from '../../types/api';

type ProjectSkill = 'KOTLIN' | 'JAVA' | 'PYTHON' | 'JAVASCRIPT' | 'TYPESCRIPT' | 'REACT' | 'ANGULAR' | 'VUE' | 'SPRING_BOOT' | 'BACKEND' | 'FRONTEND' | 'FULLSTACK' | 'AZURE' | 'AWS' | 'DOCKER' | 'KUBERNETES';
import { createProjectRequest } from '../../services/projectRequestsService';

const ALL_SKILLS: ProjectSkill[] = [
  'KOTLIN','JAVA','PYTHON','JAVASCRIPT','TYPESCRIPT','REACT','ANGULAR','VUE','SPRING_BOOT','BACKEND','FRONTEND','FULLSTACK','AZURE','AWS','DOCKER','KUBERNETES'
];

const ProjectRequestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<ProjectSkill[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [responsibleSalespersonEmail, setResponsibleSalespersonEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formValid = useMemo(() => {
    return (
      customerName.trim().length > 0 &&
      requiredSkills.length > 0 &&
      !!startDate && !!endDate && !!responseDeadline &&
      requestDescription.trim().length > 0 &&
      /.+@.+\..+/.test(responsibleSalespersonEmail)
    );
  }, [customerName, requiredSkills, startDate, endDate, responseDeadline, requestDescription, responsibleSalespersonEmail]);

  const onSubmit = async () => {
    if (!formValid) { setError('Vennligst fyll inn alle felter korrekt.'); return; }
    setLoading(true);
    setError(null);
    try {
      const body: CreateProjectRequestDto = {
        customerName: customerName.trim(),
        requiredSkills,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        responseDeadline: new Date(responseDeadline).toISOString(),
        requestDescription: requestDescription.trim(),
        responsibleSalespersonEmail: responsibleSalespersonEmail.trim(),
        status: 'OPEN',
      };
      const created: ProjectRequestDto = await createProjectRequest(body);
      if (created.id != null) {
        navigate(`/project-requests/${created.id}`);
      }
    } catch (e: unknown) {
      let msg: string = 'Feil ved opprettelse.';
      if (isAxiosError(e)) {
        msg = e.response?.data?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message ?? msg;
      }
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }} maxWidth="md">
      <Typography variant="h4" gutterBottom>Ny kundeforspørsel</Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField label="Kundenavn" value={customerName} onChange={e => setCustomerName(e.target.value)} required fullWidth />

          <FormControl fullWidth>
            <InputLabel id="skills-label">Krav til ferdigheter</InputLabel>
            <Select
              labelId="skills-label"
              multiple
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value as ProjectSkill[])}
              input={<OutlinedInput label="Krav til ferdigheter" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {ALL_SKILLS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Startdato"
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Sluttdato"
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Svarfrist"
              type="datetime-local"
              value={responseDeadline}
              onChange={e => setResponseDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <TextField
            label="Beskrivelse"
            value={requestDescription}
            onChange={e => setRequestDescription(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />

          <TextField
            label="Selger (epost)"
            type="email"
            value={responsibleSalespersonEmail}
            onChange={e => setResponsibleSalespersonEmail(e.target.value)}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={onSubmit} disabled={!formValid || loading}>
              {loading ? 'Lagrer…' : 'Opprett forespørsel'}
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>Avbryt</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectRequestCreatePage;