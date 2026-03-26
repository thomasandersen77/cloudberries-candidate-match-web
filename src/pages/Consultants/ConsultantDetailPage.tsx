import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Stack, Alert, Divider, Skeleton } from '@mui/material';
import { listConsultantsWithCv, syncSingleConsultant } from '../../services/consultantsService';
import type { ConsultantWithCvDto, ConsultantCvDto } from '../../types/api';
import CvSummary from '../../components/CV/CvSummary';
import SkillsSection from '../../components/CV/SkillsSection';
import SyncButton from '../../components/Sync/SyncButton';
import SyncNotificationPanel, { type SyncNotification } from '../../components/Sync/SyncNotificationPanel';
import CvScoreBadge from '../../components/CvScoreBadge';

const ConsultantDetailPage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<ConsultantWithCvDto | null>(null);
  const [activeCv, setActiveCv] = useState<ConsultantCvDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [notification, setNotification] = useState<SyncNotification | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const consultants = await listConsultantsWithCv(false);
        const foundConsultant = consultants.find((c) => c.userId === userId);

        if (!foundConsultant) {
          setNotification({
            type: 'error',
            title: 'Konsulent ikke funnet',
            message: `Kunne ikke finne konsulent med ID: ${userId}`,
          });
          return;
        }

        setConsultant(foundConsultant);

        const activeCV = foundConsultant.cvs?.find((cv) => cv.active) || foundConsultant.cvs?.[0];
        setActiveCv(activeCV || null);
      } catch (error) {
        console.error('Failed to load consultant:', error);
        setNotification({
          type: 'error',
          title: 'Feil ved lasting',
          message: 'Kunne ikke laste konsulentdata. Prøv igjen senere.',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSyncCv = async () => {
    if (!consultant || !activeCv) return;

    setSyncLoading(true);
    setNotification({
      type: 'progress',
      title: 'Oppdaterer CV',
      message: 'Henter nyeste versjon fra Flowcase...',
    });

    try {
      const result = await syncSingleConsultant(consultant.userId, consultant.cvId);
      setNotification({
        type: 'success',
        title: 'CV oppdatert',
        message: 'CV-en er hentet fra Flowcase',
        details: { processed: result.processed },
      });

      const consultants = await listConsultantsWithCv(false);
      const updatedConsultant = consultants.find((c) => c.userId === userId);
      if (updatedConsultant) {
        setConsultant(updatedConsultant);
        const activeCV = updatedConsultant.cvs?.find((cv) => cv.active) || updatedConsultant.cvs?.[0];
        setActiveCv(activeCV || null);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setNotification({
        type: 'error',
        title: 'Oppdatering feilet',
        message: 'Kunne ikke oppdatere CV fra Flowcase. Prøv igjen senere.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleViewFullCV = () => {
    navigate(`/cv/${userId}`);
  };

  const handleDismissNotification = () => {
    setNotification(null);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="25%" height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!consultant) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Konsulent ikke funnet.{' '}
          <Button onClick={() => navigate('/consultants')}>Gå tilbake til liste</Button>
        </Alert>
      </Container>
    );
  }

  const qScore = activeCv?.qualityScore;
  const hasQuality = typeof qScore === 'number' && !Number.isNaN(qScore);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
            {consultant.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: hasQuality ? 2 : 0 }}>
            Bruker-ID: {consultant.userId}
          </Typography>
          {hasQuality && (
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CV-kvalitet
              </Typography>
              <CvScoreBadge score={qScore} size="lg" />
            </Stack>
          )}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
          <SyncButton variant="single" loading={syncLoading} onClick={handleSyncCv} disabled={!activeCv} />
          <Button variant="contained" color="primary" onClick={handleViewFullCV} disabled={!activeCv} fullWidth={false}>
            Se hele CV
          </Button>
        </Stack>
      </Paper>

      <SyncNotificationPanel notification={notification} onDismiss={handleDismissNotification} />

      {activeCv ? (
        <Box>
          <CvSummary keyQualifications={activeCv.keyQualifications || []} />
          <SkillsSection skillCategories={activeCv.skillCategories || []} skills={consultant.skills} />

          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
              Erfaring
            </Typography>
            <Divider sx={{ mb: 2, opacity: 0.6 }} />
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Arbeidserfaring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeCv.workExperience?.length || 0} posisjoner
                  {activeCv.workExperience && activeCv.workExperience.length > 0 && (
                    <>
                      {' · '}
                      Siste: {activeCv.workExperience[0]?.employer} (
                      {activeCv.workExperience[0]?.fromYearMonth} – {activeCv.workExperience[0]?.toYearMonth || 'Pågående'})
                    </>
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Prosjekterfaring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeCv.projectExperience?.length || 0} prosjekter
                  {activeCv.projectExperience && activeCv.projectExperience.length > 0 && (
                    <>
                      {' · '}
                      Siste: {activeCv.projectExperience[0]?.customer} –{' '}
                      {activeCv.projectExperience[0]?.description?.substring(0, 72)}
                      {(activeCv.projectExperience[0]?.description?.length ?? 0) > 72 ? '…' : ''}
                    </>
                  )}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Ingen CV-data tilgjengelig for denne konsulenten
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ConsultantDetailPage;
