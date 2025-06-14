import { initializeApp } from 'firebase/app';
import React, { useEffect, useState } from 'react';
import { firebaseConfig } from './../constants';
import { Link } from 'react-router-dom';
import { collection, getDocs, getFirestore, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const LargeFiles = () => {
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
    tags: [],
    physicalCopies: 0
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

    const filesData = docsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(file => file.fileType === 'large'); // Only get large files

    setFiles(filesData);
    setLoading(false);
  };

  // Extract tags from large files
  const getTags = () => {
    const tags = [];
    files.forEach(file => {
      if (file.tags && file.tags.length > 0) {
        tags.push(...file.tags);
      }
    });
    setAlltags([...new Set(tags)]); // Remove duplicates
  };

  // Extract categories from large files
  const getCategories = () => {
    const categories = files
      .filter(file => file.fileType === 'large')
      .map(file => file.category?.toLowerCase())
      .filter(Boolean);
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
    if (!file || !file.externalLink) {
      console.error("External link is missing");
      return;
    }
    window.open(file.externalLink, '_blank');
  };

  const handleDownload = (file) => {
    if (!file || !file.externalLink) {
      console.error("External link is missing");
      return;
    }
    window.open(file.externalLink, '_blank');
  };

  const renderPreview = file => {
    if (!file || !file.externalLink) return null;

    return (
      <div style={{
        width: '100%',
        aspectRatio: '4/3',
        border: '1px solid #ddd',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: '5px 0',
        padding: '1rem',
        flexDirection: 'column',
        textAlign: 'center'
      }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/1200px-PDF_file_icon.svg.png"
          alt="Large file icon"
          style={{ width: '64px', height: '64px', marginBottom: '1rem' }}
        />
        <p style={{ fontSize: '1rem', color: '#555', marginBottom: '0.5rem' }}>
          Large File
        </p>
        <a
          href={file.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          View External File
        </a>
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
      tags: file.tags || [],
      physicalCopies: file.physicalCopies || 0
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
        tags: editForm.tags,
        physicalCopies: editForm.physicalCopies
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
      tags: [],
      physicalCopies: 0
    });
  };

  const handlePhysicalCopyChange = async (fileId, change) => {
    try {
      const fileRef = doc(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users/${localuser.uid}/certificates/${fileId}`);
      const file = files.find(f => f.id === fileId);
      const newCount = Math.max(0, (file.physicalCopies || 0) + change);

      await updateDoc(fileRef, {
        physicalCopies: newCount
      });

      // Refresh the files list
      getFiles();
    } catch (error) {
      console.error("Error updating physical copies:", error);
      alert("Failed to update physical copies count. Please try again.");
    }
  };

  // Filter files based on selected category and file type
  const filteredFiles = files
    .filter(file => file.fileType === 'large') // Only show large files
    .filter(file => !selectedCategory || file.category?.toLowerCase() === selectedCategory);

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
        Large files can be seen here. Categories filtering is possible.
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

      {/*<div>
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
      </div>*/}

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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-2xl text-gray-900 mb-2 truncate">
                      {file.filename}
                    </p>
                  </div>
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
                  <div className="inline-flex items-center mt-4 mx-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button
                      onClick={() => handlePhysicalCopyChange(file.id, -1)}
                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200 p-1"
                      title="Decrease physical copies"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <span className="mx-2 text-sm font-semibold text-gray-700">
                      {file.physicalCopies || 0} copies
                    </span>
                    <button
                      onClick={() => handlePhysicalCopyChange(file.id, 1)}
                      className="text-gray-600 hover:text-gray-800 transition-colors duration-200 p-1"
                      title="Increase physical copies"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
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
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Physical Copies
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.physicalCopies}
                  onChange={(e) => setEditForm({ ...editForm, physicalCopies: parseInt(e.target.value) || 0 })}
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

export default LargeFiles;
