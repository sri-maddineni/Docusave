import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

const NotFound = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-9xl font-bold text-gray-800">404</h1>
                    <p className="text-2xl font-semibold text-gray-600 mt-4">Page Not Found</p>
                    <p className="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        <HomeIcon className="h-5 w-5 mr-2" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default NotFound 