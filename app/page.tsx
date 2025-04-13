'use client';

import { useEffect, useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '../firebase-config'; 
import { useRouter } from 'next/navigation';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function LoginPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await signInWithPopup(auth, provider);
            router.push('/home');
        } catch (error) {
            console.error('Error signing in with Google:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            setLoading(true);
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome To work Planner</h1>
                    <p className="text-gray-600 mt-2">Sign in to access your account</p>
                </div>
                
                {user ? (
                    <div className="flex flex-col items-center">
                        <div className="bg-gray-100 rounded-lg p-6 w-full mb-6">
                            {user.photoURL && (
                                <div className="relative mb-4">
                                    <img 
                                        src={user.photoURL} 
                                        alt="Profile" 
                                        className="w-20 h-20 rounded-full mx-auto border-4 border-white shadow-md" 
                                    />
                                    <div className="absolute bottom-0 right-1/2 transform translate-x-10 translate-y-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                </div>
                            )}
                            <p className="text-xl font-medium text-center">{user.displayName}</p>
                            <p className="text-sm text-gray-600 text-center mb-2">{user.email}</p>
                            <div className="text-xs text-gray-500 text-center">
                                Account successfully authenticated
                            </div>
                        </div>
                        
                        <div className="w-full">
                            <button 
                                onClick={() => router.push('/home')}
                                className="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center"
                            >
                                <span>Go to Dashboard</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            <button 
                                onClick={handleSignOut}
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span>Sign Out</span>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button 
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow hover:shadow-md transition flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="font-medium">Sign in with Google</span>
                                </>
                            )}
                        </button>
                        
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                By continuing, you agree to our 
                                <a href="#" className="text-blue-600 hover:underline"> Terms of Service</a> and 
                                <a href="#" className="text-blue-600 hover:underline"> Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} REC. All rights reserved.
            </div>
        </div>
    );
}