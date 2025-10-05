import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import AppLayout from './AppLayout';
import HomePage from '../pages/HomePage';
import ConsultantsListPage from '../pages/Consultants/ConsultantsListPage';
import ConsultantDetailPage from '../pages/Consultants/ConsultantDetailPage';
import CvViewPage from '../pages/CV/CvViewPage';
import CvScoreListPage from '../pages/CvScore/CvScoreListPage';
import CvScoreDetailPage from '../pages/CvScore/CvScoreDetailPage';
import MatchesPage from '../pages/Matches/MatchesPage';
import SkillsOverviewPage from '../pages/Skills/SkillsOverviewPage2';
import EmbeddingsPage from '../pages/Embeddings/EmbeddingsPage';
import ChatPage from '../pages/Chat/ChatPage';
import HealthPage from '../pages/Health/HealthPage';
import StatsPage from '../pages/Analytics/StatsPage';
import ProjectRequestUploadPage from '../pages/ProjectRequests/ProjectRequestUploadPage';
import ProjectRequestDetailPage from '../pages/ProjectRequests/ProjectRequestDetailPage';
import ProjectRequestCreatePage from '../pages/ProjectRequests/ProjectRequestCreatePage';
import ConsultantSearchPage from '../pages/Search/ConsultantSearchPage';
import SemanticSearchPage from '../pages/Search/SemanticSearchPage';
import LoginPage from '../pages/Auth/LoginPage';

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/health', element: <HealthPage /> },
      { path: '/', element: <HomePage /> },
      { path: '/consultants', element: <ConsultantsListPage /> },
      { path: '/consultants/:userId', element: <ConsultantDetailPage /> },
      { path: '/cv/:userId', element: <CvViewPage /> },
      { path: '/cv-score', element: <CvScoreListPage /> },
      { path: '/cv-score/:candidateId', element: <CvScoreDetailPage /> },
      { path: '/matches', element: <MatchesPage /> },
      { path: '/embeddings', element: <EmbeddingsPage /> },
      { path: '/skills', element: <SkillsOverviewPage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/project-requests/upload', element: <ProjectRequestUploadPage /> },
      { path: '/project-requests/new', element: <ProjectRequestCreatePage /> },
      { path: '/project-requests/:id', element: <ProjectRequestDetailPage /> },
      { path: '/search', element: <ConsultantSearchPage /> },
      { path: '/search/semantic', element: <SemanticSearchPage /> },
      { path: '*', element: <div style={{ padding: 24 }}><a href="/">Gå til forsiden</a></div> },
    ],
  }
];

const options = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
} as const;

export const router = createBrowserRouter(routes, options);
