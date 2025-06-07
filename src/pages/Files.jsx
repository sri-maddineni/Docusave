import { initializeApp } from 'firebase/app';
import React, { useEffect, useState } from 'react';
import { firebaseConfig } from './../constants';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [alltags, setAlltags] = useState([]);
  const [loading, setLoading] = useState(false);

  const localuser = JSON.parse(localStorage.getItem('docusave-user'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const getFiles = async () => {
    setLoading(true);
    const colref = collection(
      db,
      `/Certificates/lE90zcOTdBqwedh8iNhh/users/${localuser.uid}/certificates`
    );

    const docsSnap = await getDocs(colref);

    if (docsSnap.empty) {
      console.log('No docs found!');
      setFiles([]);
      setLoading(false);
      return;
    }

    const filesData = docsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFiles(filesData);
    setLoading(false);
  };

  // Extract tags from files
  const getTags = () => {
    const tags = [];
    files.forEach(file => {
      if (file.tags && file.tags.length > 0) {
        tags.push(...file.tags);
      }
    });
    setAlltags([...new Set(tags)]); // Remove duplicates
  };

  // Fetch files on mount
  useEffect(() => {
    getFiles();
  }, []);

  // Update tags whenever files change
  useEffect(() => {
    if (files.length > 0) {
      getTags();
    }
  }, [files]);

  const getFileTypeFromData = fileData => {
    if (!fileData) return 'unknown';
    const match = fileData.match(/^data:(.*?);base64,/);
    return match && match[1] ? match[1] : 'unknown';
  };

  const renderPreview = file => {
    if (!file || !file.fileData) return null;

    const fileType = getFileTypeFromData(file.fileData);
    const base64String = file.fileData;

    const previewStyle = {
      width: '400px',
      height: '300px',
      border: '1px solid #ddd',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      margin: '5px',
    };

    const getTextPreview = text => {
      if (text.length > 200) return text.slice(0, 200) + '...';
      return text;
    };

    if (fileType.startsWith('image/')) {
      return (
        <div style={previewStyle}>
          <img
            src={base64String}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <div style={previewStyle}>
          <iframe
            src={base64String + '#toolbar=0&navpanes=0&scrollbar=0'}
            title="PDF Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      );
    }

    if (fileType.startsWith('text/')) {
      const decodedText = atob(base64String.split(',')[1]);
      const previewText = getTextPreview(decodedText);
      return (
        <div
          style={{
            ...previewStyle,
            padding: '1rem',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#333',
            textAlign: 'left',
          }}
          title="Text Preview"
        >
          {previewText}
        </div>
      );
    }

    return (
      <div style={previewStyle}>
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <p>
            <strong>Name:</strong> {file.name}
          </p>
          <p>
            <strong>Type:</strong> {file.type}
          </p>
          <p>
            <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            Preview not available for this file type.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        Fetching your stored files, please wait...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 text-center text-lg font-semibold text-gray-700">
        All files can be seen here. Categories and tags filtering are possible.
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2 mb-8">
          {alltags.length > 0 ? (
            alltags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-gray-400 italic">No tags found</span>
          )}
        </div>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {files.map(file => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              {renderPreview(file)}

              <div className="px-6 py-4">
                <p className="font-semibold text-2xl text-gray-900 mb-2 truncate">
                  {file.filename}
                </p>

                {file.description && (
                  <p className="text-gray-800 text-sm mb-3 line-clamp-3">
                    {file.description}
                  </p>
                )}

                <p className="text-gray-600 text-xs mb-4">
                  {file.createdAt?.toDate().toLocaleString()}
                  <span className="mx-3 text-1xl font-semibold text-black">
                    {file.category}
                  </span>
                </p>

                <div className="flex flex-wrap gap-2">
                  {file.tags && file.tags.length > 0 ? (
                    file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">No tags</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-12 text-lg">
          No files found!
        </div>
      )}
    </div>
  );
};

export default Files;
