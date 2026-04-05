import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { NovelProject } from '@novel-visualizer/shared';
import { listProjects } from '../api/client.js';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    uploaded: 'var(--text-secondary)',
    processing: 'var(--accent-xinxia)',
    ready: 'var(--success)',
    error: 'var(--error)',
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Projects</h1>
        <Link to="/" style={{
          padding: '0.5rem 1.5rem',
          background: 'var(--accent-xinxia)',
          color: '#000',
          borderRadius: 6,
          fontWeight: 600,
        }}>
          + New
        </Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No projects yet. Upload a novel to get started.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textAlign: 'left',
                color: 'var(--text-primary)',
                transition: 'border-color 0.2s',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{p.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  color: statusColors[p.status],
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}>
                  {p.status}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {p.style}
                </span>
              </div>
              {p.status === 'processing' && (
                <div style={{
                  marginTop: '0.75rem',
                  height: 4,
                  background: 'var(--bg-secondary)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${p.totalScenes > 0 ? (p.processedScenes / p.totalScenes) * 100 : 10}%`,
                    background: 'var(--accent-xinxia)',
                    borderRadius: 2,
                    transition: 'width 0.3s',
                  }} />
                </div>
              )}
              {p.status === 'ready' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {p.totalScenes} scenes
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
