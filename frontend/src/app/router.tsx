import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ArmsPage } from "../pages/ArmsPage";
import { DatasetsPage } from "../pages/DatasetsPage";
import { InferencePage } from "../pages/InferencePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RecordPage } from "../pages/RecordPage";
import { TrainingModelsPage } from "../pages/TrainingModelsPage";
import { TrainingPage } from "../pages/TrainingPage";
import { TrainingRunsPage } from "../pages/TrainingRunsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/arms" />} />
        <Route element={<ArmsPage />} path="arms" />
        <Route element={<RecordPage />} path="record" />
        <Route element={<DatasetsPage />} path="datasets" />
        <Route element={<TrainingPage />} path="training">
          <Route index element={<Navigate replace to="/training/runs" />} />
          <Route element={<TrainingRunsPage />} path="runs" />
          <Route element={<TrainingModelsPage />} path="models" />
          <Route path="*" element={<Navigate replace to="/training/runs" />} />
        </Route>
        <Route element={<InferencePage />} path="inference" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  );
}
