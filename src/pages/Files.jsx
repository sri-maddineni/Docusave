import { initializeApp } from 'firebase/app';
import React, { useEffect, useState } from 'react';
import { firebaseConfig } from './../constants';
import { collection, getDocs, getFirestore, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [alltags, setAlltags] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editForm, setEditForm] = useState({
    filename: '',
    description: '',
    category: '',
    tags: []
  });

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

  // Extract categories from files
  const getCategories = () => {
    const categories = files.map(file => file.category?.toLowerCase()).filter(Boolean);
    setAllCategories([...new Set(categories)]); // Remove duplicates
  };

  // Fetch files on mount
  useEffect(() => {
    getFiles();
  }, []);

  // Update tags and categories whenever files change
  useEffect(() => {
    if (files.length > 0) {
      getTags();
      getCategories();
    }
  }, [files]);

  const getFileTypeFromData = fileData => {
    if (!fileData) return 'unknown';
    const match = fileData.match(/^data:(.*?);base64,/);
    return match && match[1] ? match[1] : 'unknown';
  };

  const handleOpen = (file) => {
    if (!file || !file.fileData) {
      console.error("File data is missing");
      return;
    }

    const base64Parts = file.fileData.split(',');
    if (base64Parts.length !== 2) {
      console.error("Invalid file data format");
      return;
    }

    const mimeTypeMatch = base64Parts[0].match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
    const byteCharacters = atob(base64Parts[1]);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const fileURL = URL.createObjectURL(blob);

    // Open the file in a new tab
    window.open(fileURL, '_blank');
  };


  const handleDownload = (file) => {
    if (!file || !file.fileData || !file.filename) {
      console.error("File data is missing or incomplete");
      return;
    }

    // Extract the MIME type and the Base64 string
    const base64Parts = file.fileData.split(',');
    if (base64Parts.length !== 2) {
      console.error("Invalid file data format");
      return;
    }

    const mimeTypeMatch = base64Parts[0].match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
    const byteCharacters = atob(base64Parts[1]);

    // Convert Base64 to binary data
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create a temporary download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
  };


  const renderPreview = file => {
    if (!file || !file.fileData) return null;

    const fileType = getFileTypeFromData(file.fileData);
    const base64String = file.fileData;

    const previewStyle = {
      width: '100%',
      aspectRatio: '4/3', // Maintain aspect ratio
      border: '1px solid #ddd',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      margin: '5px 0',
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
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <div style={{
          ...previewStyle,
          flexDirection: 'column',
          textAlign: 'center',
          padding: '1rem',
        }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" // or your own PDF icon
            alt="PDF icon"
            style={{ width: '40px', height: '40px', marginBottom: '0.5rem' }}
          />
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            PDF file preview
          </p>
          <a
            href={base64String}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            Open PDF
          </a>
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
            padding: '0.5rem',
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
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#666',
            }}
          >
            Preview not available for this file type.
          </p>
        </div>
      </div>
    );
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const fileRef = doc(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users/${localuser.uid}/certificates/${fileId}`);
        await deleteDoc(fileRef);
        // Refresh the files list
        getFiles();
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Failed to delete file. Please try again.");
      }
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setEditForm({
      filename: file.filename || '',
      description: file.description || '',
      category: file.category || '',
      tags: file.tags || []
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingFile) return;

    try {
      const fileRef = doc(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users/${localuser.uid}/certificates/${editingFile.id}`);
      await updateDoc(fileRef, {
        filename: editForm.filename,
        description: editForm.description,
        category: editForm.category.toLowerCase(),
        tags: editForm.tags
      });

      // Refresh the files list
      getFiles();
      setEditingFile(null);
    } catch (error) {
      console.error("Error updating file:", error);
      alert("Failed to update file. Please try again.");
    }
  };

  const handleEditCancel = () => {
    setEditingFile(null);
    setEditForm({
      filename: '',
      description: '',
      category: '',
      tags: []
    });
  };

  // Filter files based on selected category
  const filteredFiles = selectedCategory
    ? files.filter(file => file.category?.toLowerCase() === selectedCategory)
    : files;

  if (loading && localuser) {
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

      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-2">{localuser ? "Categories" : ""}</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {allCategories.length > 0 ? (
            allCategories.map((category, index) => (
              <span
                key={index}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold cursor-pointer transition-colors duration-200 ${selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            ))
          ) : (
            localuser && <span className="text-gray-400 italic">No categories found</span>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">{localuser ? "Tags" : ""}</h4>
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
            localuser && <span className="text-gray-400 italic">No tags found</span>
          )}
        </div>
      </div>

      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              {renderPreview(file)}

              <div className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-2xl text-gray-900 mb-2 truncate">
                    {file.filename}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(file)}
                      className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                      title="Edit file"
                    >
                      <PencilIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      title="Delete file"
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

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
                <div>
                  <button
                    onClick={() => handleDownload(file)}
                    className="mt-4 mx-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => { handleOpen(file) }}
                    className="mt-4 mx-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Open in new tab
                  </button>
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

      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Edit File Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={editForm.filename}
                  onChange={(e) => setEditForm({ ...editForm, filename: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags.join(', ')}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
