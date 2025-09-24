import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Stack, Chip, Alert, Button } from '@mui/material';
import { listConsultantsWithCv, syncSingleConsultant } from '../../services/consultantsService';
import type { ConsultantWithCvDto, ConsultantCvDto } from '../../types/api';
import CvSummary from '../../components/CV/CvSummary';
import SkillsSection from '../../components/CV/SkillsSection';
import WorkHistoryTable from '../../components/CV/WorkHistoryTable';
import ProjectExperienceTable from '../../components/CV/ProjectExperienceTable';
import SyncButton from '../../components/Sync/SyncButton';
import SyncNotificationPanel from '../../components/Sync/SyncNotificationPanel';
import type { SyncNotification } from '../../components/Sync/SyncNotificationPanel';

const CvViewPage: React.FC = () => {
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
        console.error('Failed to load consultant CV:', error);
        setNotification({
          type: 'error',
          title: 'Feil ved lasting',
          message: 'Kunne ikke laste CV-data. Prøv igjen senere.'
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

  const handleDismissNotification = () => {
    setNotification(null);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Laster CV-data...</Typography>
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
          <Typography variant="h4" gutterBottom>CV - {consultant.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bruker-ID: {consultant.userId}
          </Typography>
          {activeCv?.versionTag && (
            <Typography variant="body2" color="text.secondary">
              Versjon: {activeCv.versionTag}
            </Typography>
          )}
        </Box>
        <SyncButton
          variant="single"
          loading={syncLoading}
          onClick={handleSyncCv}
          disabled={!activeCv}
        />
      </Box>

      <SyncNotificationPanel 
        notification={notification} 
        onDismiss={handleDismissNotification} 
      />

      {activeCv ? (
        <Box>
          {/* CV Quality Score */}
          {activeCv.qualityScore && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.50' }}>
              <Typography variant="h6">CV-kvalitet: {activeCv.qualityScore}%</Typography>
            </Paper>
          )}
          
          {/* CV Summary */}
          <CvSummary keyQualifications={activeCv.keyQualifications || []} />
          
          {/* Skills Section */}
          <SkillsSection 
            skillCategories={activeCv.skillCategories || []} 
            skills={consultant.skills}
          />
          
          {/* Work History Table */}
          <WorkHistoryTable workExperience={activeCv.workExperience || []} />
          
          {/* Project Experience Table */}
          <ProjectExperienceTable projectExperience={activeCv.projectExperience || []} />
          
          {/* Education Section */}
          {activeCv.education && activeCv.education.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Utdanning
              </Typography>
              <Stack spacing={2}>
                {activeCv.education.map((edu, index) => (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {edu.degree || 'Utdanning'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {edu.school} · {edu.fromYearMonth} - {edu.toYearMonth || 'Pågående'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
          
          {/* Certifications and Courses */}
          {((activeCv.certifications && activeCv.certifications.length > 0) || 
            (activeCv.courses && activeCv.courses.length > 0)) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sertifiseringer og kurs
              </Typography>
              <Stack spacing={2}>
                {activeCv.certifications?.map((cert, index) => (
                  <Box key={`cert-${index}`}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {cert.name} {cert.year && `(${cert.year})`}
                    </Typography>
                  </Box>
                ))}
                {activeCv.courses?.map((course, index) => (
                  <Box key={`course-${index}`}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {course.name} {course.year && `(${course.year})`}
                    </Typography>
                    {course.organizer && (
                      <Typography variant="body2" color="text.secondary">
                        {course.organizer}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
          
          {/* Languages */}
          {activeCv.languages && activeCv.languages.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Språk
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {activeCv.languages.map((lang, index) => (
                  <Chip
                    key={index}
                    label={`${lang.name}${lang.level ? ` (${lang.level})` : ''}`}
                    variant="outlined"
                    color="info"
                  />
                ))}
              </Box>
            </Paper>
          )}
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

export default CvViewPage;
