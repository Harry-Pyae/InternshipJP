import { Navigate, Route, Routes } from "react-router-dom";

import FoundationHomePage from "../features/integration/FoundationHomePage.jsx";
import IntegrationStatusPage from "../features/integration/IntegrationStatusPage.jsx";
import AiChatPage from "../features/ai/AiChatPage.jsx";

/**
 * Every route that exists today.
 *
 * HOW TO ADD YOURS
 *   1. build your page under src/features/<your-area>/
 *   2. import it here
 *   3. add one <Route> line
 *
 * Keeping all routes in this one file means four people can add pages without
 * fighting over the same lines. The full intended route map (including the
 * pages nobody has built yet) is in documentation/FRONTEND_OWNERSHIP.md.
 *
 * TODO MEMBER_2: /auth/login, /auth/register, /student/*
 * TODO MEMBER_3: /employer/*
 * TODO MEMBER_4: /admin/*, /notifications, and a shared route guard that keeps
 *                a signed-out visitor out of the dashboards.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FoundationHomePage />} />

      {/* Member 1 - integration and AI */}
      <Route path="/integration/status" element={<IntegrationStatusPage />} />
      <Route path="/ai/student" element={<AiChatPage audience="student" />} />
      <Route path="/ai/employer" element={<AiChatPage audience="employer" />} />

      {/* Anything unknown goes home rather than showing a blank screen. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
