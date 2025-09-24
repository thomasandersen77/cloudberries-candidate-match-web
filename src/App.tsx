import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ConsultantsListPage from './pages/Consultants/ConsultantsListPage';
import ConsultantDetailPage from './pages/Consultants/ConsultantDetailPage';
import CvViewPage from './pages/CV/CvViewPage';
import CvScoreListPage from './pages/CvScore/CvScoreListPage';
import CvScoreDetailPage from './pages/CvScore/CvScoreDetailPage';
import MatchesPage from './pages/Matches/MatchesPage';
import SkillsOverviewPage from './pages/Skills/SkillsOverviewPage';
import EmbeddingsPage from './pages/Embeddings/EmbeddingsPage';
import ChatAnalyzePage from './pages/Chat/ChatAnalyzePage';
import HealthPage from './pages/Health/HealthPage';
import ProjectRequestUploadPage from './pages/ProjectRequests/ProjectRequestUploadPage';
import ProjectRequestDetailPage from './pages/ProjectRequests/ProjectRequestDetailPage';
import Header from './components/Header';


function App() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Header />
      <Box sx={{ px: 2, py: 2 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/consultants" element={<ConsultantsListPage />} />
          <Route path="/consultants/:userId" element={<ConsultantDetailPage />} />
          <Route path="/cv/:userId" element={<CvViewPage />} />
          <Route path="/cv-score" element={<CvScoreListPage />} />
          <Route path="/cv-score/:candidateId" element={<CvScoreDetailPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/embeddings" element={<EmbeddingsPage />} />
          <Route path="/skills" element={<SkillsOverviewPage />} />
          <Route path="/chat" element={<ChatAnalyzePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/project-requests/upload" element={<ProjectRequestUploadPage />} />
          <Route path="/project-requests/:id" element={<ProjectRequestDetailPage />} />
          <Route path="*" element={<div style={{ padding: 24 }}><a href="/">Gå til forsiden</a></div>} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
