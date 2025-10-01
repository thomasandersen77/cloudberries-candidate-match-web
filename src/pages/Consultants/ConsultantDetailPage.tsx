import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Stack, Alert } from '@mui/material';
import { listConsultantsWithCv, syncSingleConsultant } from '../../services/consultantsService';
import type { ConsultantWithCvDto, ConsultantCvDto } from '../../types/api';
import CvSummary from '../../components/CV/CvSummary';
import SkillsSection from '../../components/CV/SkillsSection';
import SyncButton from '../../components/Sync/SyncButton';
import SyncNotificationPanel, { type SyncNotification } from '../../components/Sync/SyncNotificationPanel';

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
        const consultants = await listConsultantsWithCv(false); // Get all CVs, not just active
        const foundConsultant = consultants.find(c => c.userId === userId);
        
        if (!foundConsultant) {
          setNotification({
            type: 'error',
            title: 'Konsulent ikke funnet',
            message: `Kunne ikke finne konsulent med ID: ${userId}`
          });
          return;
        }

        setConsultant(foundConsultant);
        
        // Find active CV or fallback to first CV
        const activeCV = foundConsultant.cvs?.find(cv => cv.active) || foundConsultant.cvs?.[0];
        setActiveCv(activeCV || null);
        
      } catch (error) {
        console.error('Failed to load consultant:', error);
        setNotification({
          type: 'error',
          title: 'Feil ved lasting',
          message: 'Kunne ikke laste konsulentdata. Prøv igjen senere.'
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
      message: 'Henter nyeste versjon fra Flowcase...'
    });

    try {
      const result = await syncSingleConsultant(consultant.userId, consultant.cvId);
      setNotification({
        type: 'success',
        title: 'CV oppdatert',
        message: 'CV-en er hentet fra Flowcase',
        details: { processed: result.processed }
      });
      
      // Refresh consultant data
      const consultants = await listConsultantsWithCv(false);
      const updatedConsultant = consultants.find(c => c.userId === userId);
      if (updatedConsultant) {
        setConsultant(updatedConsultant);
        const activeCV = updatedConsultant.cvs?.find(cv => cv.active) || updatedConsultant.cvs?.[0];
        setActiveCv(activeCV || null);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setNotification({
        type: 'error',
        title: 'Oppdatering feilet',
        message: 'Kunne ikke oppdatere CV fra Flowcase. Prøv igjen senere.'
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
        <Typography>Laster konsulentdata...</Typography>
      </Container>
    );
  }

  if (!consultant) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Konsulent ikke funnet. <Button onClick={() => navigate('/consultants')}>Gå tilbake til liste</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>{consultant.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bruker-ID: {consultant.userId}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <SyncButton
            variant="single"
            loading={syncLoading}
            onClick={handleSyncCv}
            disabled={!activeCv}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleViewFullCV}
            disabled={!activeCv}
          >
            Se hele CV
          </Button>
        </Stack>
      </Box>

      <SyncNotificationPanel 
        notification={notification} 
        onDismiss={handleDismissNotification} 
      />

      {activeCv ? (
        <Box>
          {/* CV Quality Score */}
          {activeCv.qualityScore && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
              <Typography variant="h6">CV-kvalitet: {activeCv.qualityScore}%</Typography>
            </Paper>
          )}
          
          {/* CV Summary */}
          <CvSummary keyQualifications={activeCv.keyQualifications || []} />
          
          {/* Skills Overview */}
          <SkillsSection 
            skillCategories={activeCv.skillCategories || []} 
            skills={consultant.skills}
          />
          
          {/* Experience Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Erfaring
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Arbeidserfaring: {activeCv.workExperience?.length || 0} posisjoner
                </Typography>
                {activeCv.workExperience && activeCv.workExperience.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Siste: {activeCv.workExperience[0]?.employer} 
                    ({activeCv.workExperience[0]?.fromYearMonth} - {activeCv.workExperience[0]?.toYearMonth || 'Pågående'})
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Prosjekterfaring: {activeCv.projectExperience?.length || 0} prosjekter
                </Typography>
                {activeCv.projectExperience && activeCv.projectExperience.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Siste: {activeCv.projectExperience[0]?.customer} - {activeCv.projectExperience[0]?.description?.substring(0, 60)}...
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Ingen CV-data tilgjengelig for denne konsulenten
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ConsultantDetailPage;