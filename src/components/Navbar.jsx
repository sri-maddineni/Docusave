import React from 'react'
import { Link } from 'react-router-dom'
import { DocumentArrowDownIcon, HomeIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const Navbar = () => {
    return (
        <nav className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
                            Docusave
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex space-x-4">
                        <Link
                            to="/"
                            className="flex items-center px-1 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-150 ease-in-out group"
                        >
                            <HomeIcon className="h-5 w-5 mr-1 group-hover:text-blue-400" />
                            <span>Home</span>
                        </Link>
                        <Link
                            to="/files"
                            className="flex items-center px-1 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-150 ease-in-out group"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-1 group-hover:text-blue-400" />
                            <span>Files</span>
                        </Link>
                        <Link
                            to="/account"
                            className="flex items-center px-1 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-150 ease-in-out group"
                        >
                            <UserCircleIcon className="h-5 w-5 mr-1 group-hover:text-blue-400" />
                            <span>Account</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
