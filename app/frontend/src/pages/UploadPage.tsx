import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StyleTheme } from '@novel-visualizer/shared';
import { uploadNovel } from '../api/client.js';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleTheme>('xinxia');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError(null);
    } else {
      setError('Please drop a PDF file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const project = await uploadNovel(file, style);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setUploading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 className="page-title">Novel Visualizer</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
        Transform your novel into an audiovisual experience
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: '100%',
          maxWidth: 500,
          padding: '3rem 2rem',
          border: `2px dashed ${dragOver ? 'var(--accent-xinxia)' : 'var(--border)'}`,
          borderRadius: 12,
          textAlign: 'center',
          background: dragOver ? 'rgba(212, 160, 23, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.2s',
          marginBottom: '1.5rem',
        }}
      >
        {file ? (
          <div>
            <p style={{ fontSize: '1.1rem' }}>{file.name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Drop your PDF novel here</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>or</p>
            <label style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.5rem 1.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}>
              Browse files
              <input type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {(['xinxia', 'mysterious'] as StyleTheme[]).map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: 8,
              background: style === s
                ? (s === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)')
                : 'var(--bg-card)',
              color: style === s ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${style === s ? 'transparent' : 'var(--border)'}`,
              fontWeight: style === s ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {s === 'xinxia' ? 'Xinxia' : 'Mysterious'}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: '0.8rem 3rem',
          borderRadius: 8,
          background: file ? 'var(--accent-xinxia)' : 'var(--bg-card)',
          color: file ? '#000' : 'var(--text-secondary)',
          fontWeight: 600,
          fontSize: '1.1rem',
          opacity: uploading ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload & Continue'}
      </button>

      <button
        onClick={() => navigate('/projects')}
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1.5rem',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        View existing projects
      </button>
    </div>
  );
}
