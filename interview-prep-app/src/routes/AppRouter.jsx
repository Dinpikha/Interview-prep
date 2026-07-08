import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import {
  AIMentorPage,
  DashboardPage,
  HomePage,
  LandingPage,
  LoginPage,
  MockInterviewPage,
  ResumeAnalyzerPage,
  WelcomePage,
} from '../pages'
import AppShell from './AppShell'

export const router = createBrowserRouter([
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.WELCOME,
    element: <WelcomePage />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.MOCK_INTERVIEW,
        element: <MockInterviewPage />,
      },
      {
        path: ROUTES.RESUME_ANALYZER,
        element: <ResumeAnalyzerPage />,
      },
      {
        path: ROUTES.AI_MENTOR,
        element: <AIMentorPage />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.LANDING} replace />,
  },
])