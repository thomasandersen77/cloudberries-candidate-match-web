import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Divider, Box, Stack, Chip } from '@mui/material';
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
  const summaryFromKQ = Array.isArray(anyCv.keyQualifications) ? anyCv.keyQualifications.map((q: any) => q?.description ?? q?.text ?? q?.title ?? q).filter(Boolean).join('\n\n') : '';
  const summary = summaryFromKQ || anyCv.summary || anyCv.profile || anyCv.about || '';
  const skills = extractSkills(cv);

  const work = Array.isArray(anyCv.workExperiences) ? anyCv.workExperiences : (Array.isArray(anyCv.workExperience) ? anyCv.workExperience : []);
  const projects = Array.isArray(anyCv.projectExperiences) ? anyCv.projectExperiences : (Array.isArray(anyCv.projectExperience) ? anyCv.projectExperience : []);

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
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Detaljer</Typography>
          <Divider sx={{ mb: 2 }} />
          <CvSectionsTable cv={cv} />
        </Paper>
      )}

      {!loading && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Full CV (tekstlig visning)</Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Arbeidserfaring som avsnitt */}
          {Array.isArray(work) && work.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Arbeidserfaring</Typography>
              {work.map((w: any, i: number) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {[w?.employer ?? w?.company ?? w?.client, w?.role ?? w?.position ?? w?.title].filter(Boolean).join(' — ')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {[w?.start ?? w?.startDate ?? w?.from, w?.end ?? w?.endDate ?? w?.to ?? 'nå'].filter(Boolean).join(' — ')}
                  </Typography>
                  {String(w?.description ?? w?.summary ?? '')
                    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
                    .filter(Boolean)
                    .map((p: string, j: number) => (
                      <Typography key={j} paragraph>{p.trim()}</Typography>
                    ))}
                </Box>
              ))}
            </Box>
          )}

          {/* Prosjekterfaring som avsnitt */}
          {Array.isArray(projects) && projects.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Prosjekter</Typography>
              {projects.map((p: any, i: number) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {[p?.projectName ?? p?.title ?? p?.name, p?.customer ?? p?.client, Array.isArray(p?.roles) ? p.roles.map((r: any) => r?.name ?? r).filter(Boolean).join(', ') : p?.role]
                      .filter(Boolean)
                      .join(' — ')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {[(p?.start ?? p?.startDate ?? p?.from) || '', (p?.end ?? p?.endDate ?? p?.to) || 'nå']
                      .filter(Boolean)
                      .join(' — ')}
                  </Typography>
                  {/* Teknologier som chips hvis tilgjengelig */}
                  {Array.isArray(p?.skills) || Array.isArray(p?.technologies) ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                      {(Array.isArray(p?.skills) ? p.skills : p?.technologies || []).map((t: any, k: number) => (
                        <Chip key={k} label={String(t?.name ?? t)} size="small" />
                      ))}
                    </Stack>
                  ) : null}
                  {String(p?.description ?? p?.summary ?? '')
                    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
                    .filter(Boolean)
                    .map((para: string, j: number) => (
                      <Typography key={j} paragraph>{para.trim()}</Typography>
                    ))}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default CvViewPage;
