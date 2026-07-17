import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import {
  AIMentorPage,
  ChangePasswordPage,
  DashboardPage,
  ForgotPasswordPage,
  GithubCallbackPage,
  HomePage,
  LandingPage,
  LoginPage,
  MockInterviewPage,
  ResetPasswordPage,
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
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },
  {
    path: ROUTES.GITHUB_CALLBACK,
    element: <GithubCallbackPage />,
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
      {
        path: ROUTES.CHANGE_PASSWORD,
        element: <ChangePasswordPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.LANDING} replace />,
  },
])