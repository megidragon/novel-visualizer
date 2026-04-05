import { Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage.js';
import ProjectListPage from './pages/ProjectListPage.js';
import ViewerPage from './pages/ViewerPage.js';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/:id" element={<ViewerPage />} />
    </Routes>
  );
}
