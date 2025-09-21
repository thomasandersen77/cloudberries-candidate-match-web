import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Divider, Box } from '@mui/material';
import { getCv } from '../../services/cvService';
import { extractSkills } from '../../utils/skills';
import WordCloud from '../../components/WordCloud';
import CvSectionsTable from '../../components/CvSectionsTable';

const CvViewPage: React.FC = () => {
  const { userId } = useParams();
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await getCv(userId);
        setCv(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // basic extraction for header/summary
  const anyCv = (cv ?? {}) as any;
  const displayName = anyCv.displayName || anyCv.name || anyCv.fullName || userId;
  const summary = anyCv.summary || anyCv.profile || anyCv.about || '';
  const skills = extractSkills(cv);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>CV</Typography>
      <Paper sx={{ p: 3, mb: 2 }}>
        {loading ? (
          <Typography>Laster...</Typography>
        ) : (
          <>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>{displayName}</Typography>
            {summary && (
              <Box sx={{ mb: 2 }}>
                {String(summary)
                  .split(/\n{2,}|(?<=[.!?])\s{2,}/)
                  .filter(Boolean)
                  .map((p: string, i: number) => (
                    <Typography key={i} paragraph>{p.trim()}</Typography>
                  ))}
              </Box>
            )}
            {skills.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>Kompetanse</Typography>
                <WordCloud words={skills} />
              </>
            )}
          </>
        )}
      </Paper>

      {!loading && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Detaljer</Typography>
          <Divider sx={{ mb: 2 }} />
          <CvSectionsTable cv={cv} />
        </Paper>
      )}
    </Container>
  );
};

export default CvViewPage;