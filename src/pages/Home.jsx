import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, DocumentIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from '../constants'


const Home = () => {

    const [preview, setPreview] = useState(false)
    const [file, setFile] = useState(null)
    const [base64String, setBase64String] = useState(null)
    const [loggedIn, setLoggedIn] = useState(JSON.parse(localStorage.getItem("docusave-user")))
    const localuser = JSON.parse(localStorage.getItem("docusave-user"))

    const [loading, setLoading] = useState(false)

    //file details
    const [filename, setFilename] = useState("")
    const [filedes, setFiledes] = useState("")
    const [tags, setTags] = useState([])
    const [filecategory, setFilecategory] = useState("")

    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)


    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (!selectedFile) return

        // Reset states
        setFile(null)
        setBase64String(null)
        setPreview(false)

        // Set the file
        setFile(selectedFile)

        // Convert to base64
        const reader = new FileReader()
        reader.onload = (e) => {
            const base64 = e.target.result
            setBase64String(base64)
        }
        reader.onerror = (error) => {
            console.error('Error reading file:', error)
        }
        reader.readAsDataURL(selectedFile)
    }

    const handlePreview = () => {
        if (!file) {
            alert('Please select a file first')
            return
        }
        setPreview(!preview)
    }


    const handleUpload = async () => {
        setLoading(true)
        try {
            if (!file || !base64String || !filename || !filecategory) {
                alert("Please provide all required fields and select a file.");
                setLoading(false)
                return;
            }

            const maxSize = 1 * 1024 * 1024;
            if (file.size >= maxSize) {
                alert("File size exceeds 1MB. Please select a smaller file.");
                setFile(null)
                window.location.reload()
                setLoading(false)
                return;
            }

            const colRef = collection(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users/${localuser.uid}/certificates`);

            const uploadData = {
                filename: filename,
                description: filedes,
                tags: tags.map(tag => tag.trim()), // ensure tags are trimmed
                category: filecategory,
                fileData: base64String, // direct file data (consider using storage for larger files)
                createdAt: serverTimestamp(),
                uploadedBy: {
                    name: localuser.name,
                    email: localuser.email,
                    uid: localuser.uid
                }
            };

            await addDoc(colRef, uploadData);

            alert("File uploaded successfully!");
            setLoading(false)
            // Reset form state
            setFile(null);
            setBase64String(null);
            setFilename("");
            setFiledes("");
            setTags([]);
            setFilecategory("");
            setLoading(false)
        } catch (error) {
            console.error("Error uploading file:", error);
            setLoading(false)
            alert("Failed to upload file. Please try again." + error);
            setLoading(false)
        }
        setLoading(false)
    };


    const renderPreview = () => {
        if (!preview || !file || !base64String) return null

        const fileType = file.type

        // Handle different file types
        if (fileType.startsWith('image/')) {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Image Preview:</h3>
                    <div className="flex justify-center">
                        <img
                            src={base64String}
                            alt="Preview"
                            className="max-w-md rounded-lg shadow-md"
                        />
                    </div>
                </div>
            )
        }



        if (fileType === 'application/pdf') {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">PDF Preview:</h3>
                    <div className="flex justify-center">
                        <iframe
                            src={base64String}
                            className="w-full h-[600px] rounded-lg shadow-md"
                            title="PDF Preview"
                        />
                    </div>
                </div>
            )
        }

        if (fileType.startsWith('video/')) {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Video Preview:</h3>
                    <div className="flex justify-center">
                        <video
                            controls
                            className="max-w-md rounded-lg shadow-md"
                        >
                            <source src={base64String} type={fileType} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )
        }

        if (fileType.startsWith('audio/')) {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Audio Preview:</h3>
                    <div className="flex justify-center">
                        <audio
                            controls
                            className="w-full"
                        >
                            <source src={base64String} type={fileType} />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                </div>
            )
        }

        // For text files
        if (fileType.startsWith('text/')) {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Text Preview:</h3>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <pre className="whitespace-pre-wrap break-words">
                            {atob(base64String.split(',')[1])}
                        </pre>
                    </div>
                </div>
            )
        }

        // For other file types, show file information
        return (
            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">File Information:</h3>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p><span className="font-medium">Name:</span> {file.name}</p>
                    <p><span className="font-medium">Type:</span> {file.type}</p>
                    <p><span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB</p>
                    <p className="mt-2 text-sm text-gray-600">
                        Preview not available for this file type. You can still download the file.
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    Uploading file...please wait!
                </div>
            </>
        )
    }


    if (!loggedIn && !loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


                <div className="text-center">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Get Started Today
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Sign in to start managing your documents securely
                        </p>
                        <div className="space-x-4">
                            <Link
                                to="/account"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Sign In
                            </Link>
                            <button
                                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Docusave</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 mb-6">
                    Your secure document management solution.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                        <input
                            onChange={handleFileChange}
                            type="file"
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        <p>Make sure file size is less than 1MB</p>
                        <div className="mt-4 space-x-4 text-center">
                            <form className='flex flex-col'>
                                <input value={filename} onChange={(e) => { setFilename(e.target.value) }} className="border border-gray-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" placeholder='Enter file name' />
                                <textarea value={filedes} onChange={(e) => { setFiledes(e.target.value) }} className="border border-gray-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" placeholder='Enter file description' />
                                <input value={tags.join(',')} onChange={(e) => { setTags(e.target.value.split(',')) }} className="border border-gray-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" placeholder='Enter file tags, seperated by commas (class xll, class x, btech for category certificates)' />
                                <input value={filecategory} onChange={(e) => { setFilecategory(e.target.value) }} className="border border-gray-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" placeholder='Enter category (certificates, achievements, photos, travel)' />

                            </form>
                            <button onClick={handleUpload}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                            >
                                Upload
                            </button>
                            <button
                                onClick={handlePreview}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
                            >
                                {preview ? "Hide" : "Show"} Preview
                            </button>
                        </div>
                        <p className="text-gray-600 mt-2">Upload your documents here</p>
                    </div>

                    {renderPreview()}
                </div>
            </div>
        </div>
    )
}

export default Home 