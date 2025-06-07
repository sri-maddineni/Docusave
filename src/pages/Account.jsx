import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircleIcon, BellIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline'
import { initializeApp } from 'firebase/app'
import { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore'
import { firebaseConfig } from '../constants'

const Account = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [loggedIn, setLoggedIn] = useState(false)
    const [newId, setNewId] = useState(null)
    const [uniqueIdEntered, setUniqueIdEntered] = useState("")
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [user, setUser] = useState(null)

    const [loading, setLoading] = useState(false)



    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app);

    const handleLogout = () => {
        localStorage.removeItem("docusave-user")
        setLoggedIn(false)
    }

    useEffect(() => {
        let localuser = JSON.parse(localStorage.getItem("docusave-user"))
        if (localuser) {
            setLoggedIn(true)
            setUser(localuser)
        }
    }, [])

    const fetchMetaData = async () => {
        try {
            const metaDocRef = doc(db, "Certificates", "meta data");
            const metaDocSnap = await getDoc(metaDocRef);

            if (metaDocSnap.exists()) {
                const data = metaDocSnap.data();
                console.log("Emails:", data.emails);
                console.log("Users:", data.users);
                return { emails: data.emails, users: data.users }
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching document:", error);
        }
    };

    const handleLogin = async (e) => {
        //i want to fetch all the docs form a path
        e.preventDefault();
        setLoading(true)


        try {
            // Reference to the collection

            console.log(uniqueIdEntered)

            const collectionref = collection(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users`);

            // Get all documents in the collection
            const docsnap = await getDocs(collectionref);

            let found = false

            docsnap.forEach((element) => {
                const data = element.data();
                if (data.uid == uniqueIdEntered) {
                    console.log("found");
                    localStorage.setItem(
                        "docusave-user",
                        JSON.stringify({
                            name: data.name,
                            email: data.email,
                            uid: data.uid,
                            loggedin: true
                        })
                    );
                    found = true;
                    setLoggedIn(true)
                    setUser(JSON.parse(localStorage.getItem("docusave-user")))
                    setLoading(false)
                    return;
                }
            });


            found ? "" : console.log("not found")

            setLoading(false)

            // Do something with the data if needed
            //  console.log("Fetched documents:", querySnapshot.docs.map((d) => d.data()));
        } catch (error) {
            setLoading(false)
            console.error("Error fetching documents:", error);
        }

    }

    const addEmailUser = async (email, uid) => {
        try {
            // Use doc() to get a proper document reference, not a string path
            const docRef = doc(db, "Certificates", "meta data");

            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Document exists, update arrays
                await updateDoc(docRef, {
                    users: arrayUnion(uid),
                    emails: arrayUnion(email),
                });
                console.log("User and email added!");
                setName("")
                setEmail("")
            } else {
                // Document doesn't exist, create it
                await setDoc(docRef, {
                    users: [uid],
                    emails: [email],
                });
                console.log("Document created with initial user and email.");
                setName("")
                setEmail("")



            }
        } catch (error) {
            console.error("Error updating document:", error);
        }
    };

    const handleCreate = async (e) => {
        console.log("Entered handle create")
        e.preventDefault();

        let data = await fetchMetaData();
        if (data.emails.includes(email)) {
            alert("Email already registered!, please try with a new one");
            setNewId("")
            setEmail("")
            setName("")
            return;
        }

        if (name.length <= 0) {
            alert("Please enter name!")
            setNewId("")
            setEmail("")
            setName("")
            return;
        }

        let lastitem = data.users[data.users.length - 1];
        let newitem = lastitem + 1;

        setNewId(newitem)

        let docref = doc(db, `/Certificates/lE90zcOTdBqwedh8iNhh/users/${newitem}`)
        const datar = {
            name: name,
            email: email,
            uid: newitem
        }

        await setDoc(docref, datar)

        //also insert newId in data.users and data.emails
        addEmailUser(email, newitem)



        console.log(newitem)
    }

    if (loading) {
        return (
            <>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-md mx-auto">
                       <h2 className='text-3xl font-semibold text-gray-800'>please wait, while we login you!</h2>
                    </div>
                </div>
            </>)
    }

    if (!loggedIn) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center bg-white rounded-lg shadow-md p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className='text-center'>
                                <div>
                                    <input className='m-2 border border-spacing-0 p-2 rounded-md border-amber-900' type="text" value={uniqueIdEntered} onChange={(e) => setUniqueIdEntered(e.target.value)} placeholder='Enter your Unique id' />
                                </div>

                                <button onClick={handleLogin} className='bg-amber-700 p-2 m-2 text-lime-50 rounded-md'>Login</button>
                            </div>
                        </form>
                        <h2>Or</h2>
                        <h3 className='font-bold text-2xl m-3'>Create new Account!</h3>
                        <form action="">
                            <div>
                                <div>
                                    <input className='m-2 border border-spacing-0 p-2 rounded-md border-amber-900' type="text" placeholder='Enter email address' value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <input className='m-2 border border-spacing-0 p-2 rounded-md border-amber-900' type="text" placeholder='Enter Name' value={name} onChange={(e) => setName(e.target.value)} />
                                </div>

                                <button onClick={handleCreate} className='bg-amber-700 p-2 m-2 text-lime-50 rounded-md'>Generate new Id</button>
                                {
                                    newId && <p>This is your new ID, please keep it safe to access your files anywhere  <br /> <span className='text-3xl text-amber-950 underline'>{newId}</span></p>

                                }
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'profile', name: 'Profile', icon: UserCircleIcon },
        // { id: 'notifications', name: 'Notifications', icon: BellIcon },
        // { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-2xl font-semibold bg-red-900 rounded-md text-gray-200 hover:bg-red-500"
                >
                    Sign Out
                </button>
            </div>

            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-16 w-16 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">{user?.name || 'User'}</h2>
                        <p className="text-gray-600">{user?.email}</p>

                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                `}
                            >
                                <tab.icon className="h-5 w-5 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <p>{user?.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p>{user?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">User id</label>
                                    <p>{user?.uid}</p>
                                </div>
                            </div>
                            
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                                    <p className="text-sm text-gray-500">Receive email updates about your account</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <KeyIcon className="h-6 w-6 text-gray-400" />
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                                    <p className="text-sm text-gray-500">Update your password regularly to keep your account secure</p>
                                </div>
                                <button className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                                    Change Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Account 