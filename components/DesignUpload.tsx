'use client';

import { useState, useRef } from 'react';
import { isValidDesignFile, isValidFileSize } from '@/lib/utils';

interface DesignUploadProps {
  onUploadComplete: (fileUrl: string) => void;
  initialUrl?: string | null;
}

export default function DesignUpload({ onUploadComplete, initialUrl }: DesignUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate file type
    if (!isValidDesignFile(selectedFile)) {
      setError('Invalid file type. Please upload PNG, JPG, PDF, or SVG files.');
      return;
    }

    // Validate file size
    if (!isValidFileSize(selectedFile, 10)) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-design', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadComplete(data.data.file_url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed var(--color-gray-300)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          background: preview ? 'var(--bg-bright-secondary)' : 'transparent',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,application/pdf,image/svg+xml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {preview && file?.type.startsWith('image/') ? (
          <div>
            <img
              src={preview}
              alt="Design preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--space-4)',
              }}
            />
            <p style={{ color: 'var(--text-bright-secondary)' }}>
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        ) : file ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-bright-secondary)',
              marginBottom: 'var(--space-3)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
              {file.name}
            </p>
            <p style={{ color: 'var(--text-bright-tertiary)', fontSize: 'var(--text-sm)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-bright-secondary)',
              marginBottom: 'var(--space-3)'
            }}>
              <i className="bi bi-cloud-arrow-up" style={{ fontSize: 'var(--text-3xl)', color: 'var(--text-bright-primary)' }}></i>
            </div>
            <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
              Click to upload or drag and drop
            </p>
            <p style={{ color: 'var(--text-bright-tertiary)', fontSize: 'var(--text-sm)' }}>
              PNG, JPG, PDF, SVG (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-3)',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: 'var(--radius-xl)',
          fontSize: 'var(--text-sm)',
        }}>
          {error}
        </div>
      )}

      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary"
          style={{ marginTop: 'var(--space-4)', width: '100%' }}
        >
          {uploading ? 'Uploading...' : 'Upload and Continue'}
        </button>
      )}
    </div>
  );
}

