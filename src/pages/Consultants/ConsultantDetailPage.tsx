import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Chip, Stack, Divider } from '@mui/material';
import { getCv } from '../../services/cvService';
import { extractSkills } from '../../utils/skills';
import CvSectionsTable from '../../components/CvSectionsTable';

const ConsultantDetailPage: React.FC = () => {
  const { userId } = useParams();
  const [summary, setSummary] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [cv, setCv] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const cvData = await getCv(userId);
        setCv(cvData);
        const anyCv = cvData as any;
        setDisplayName(anyCv?.displayName || anyCv?.name || anyCv?.fullName || userId);

        // Prefer CV key qualifications descriptions as summary if available
        const kq: any[] | undefined = Array.isArray(anyCv?.keyQualifications) ? anyCv.keyQualifications : undefined;
        const kqTexts = kq?.map((q) => q?.description ?? q?.text ?? q?.title ?? q).map(String).filter(Boolean) ?? [];

        const textParts: string[] = [];
        if (kqTexts.length > 0) {
          textParts.push(kqTexts.join('\n\n'));
        } else {
          if (anyCv.summary) textParts.push(String(anyCv.summary));
          if (anyCv.profile) textParts.push(String(anyCv.profile));
          if (anyCv.about) textParts.push(String(anyCv.about));
        }
        setSummary(textParts.join('\n\n') || 'Ingen oppsummering tilgjengelig.');

        const skills = extractSkills(cvData);
        setTopSkills(skills.slice(0, 12));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Detaljer for konsulent</Typography>
      {displayName && (
        <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>{displayName}</Typography>
      )}
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Typography>Laster...</Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>Oppsummering</Typography>
            {summary.split(/\n{2,}/).map((p, i) => (
              <Typography key={i} paragraph>{p}</Typography>
            ))}
            {topSkills.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Nøkkelkompetanse</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {topSkills.map((s, i) => (
                    <Chip key={i} label={s} color={i % 3 === 0 ? 'default' : i % 3 === 1 ? 'primary' : 'secondary'} variant="outlined" />
                  ))}
                </Stack>
              </>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>CV (seksjoner)</Typography>
            <CvSectionsTable cv={cv} />
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" component={RouterLink} to={`/cv/${encodeURIComponent(userId!)}`}>Se full CV</Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ConsultantDetailPage;