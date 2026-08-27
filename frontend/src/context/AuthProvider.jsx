import React, { useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase.config';
import AuthContext from './AuthContext';
import axios from 'axios';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(true);

    const registerUser = (email, password) => {
        setLoading(true);
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const loginUser = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logoutUser = () => {
        setLoading(true);
        return signOut(auth);
    };

    const updateUserProfile = (name) => {
        return updateProfile(auth.currentUser, { displayName: name });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    const res = await axios.get(
                        `${import.meta.env.VITE_API_BASE_URL}/users/role/${currentUser.email}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setRole(res.data?.role || 'user');
                } catch (err) {
                    setRole('user');
                }
            } else {
                setRole('user');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const authInfo = {
        user,
        role,
        loading,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile
    };

    return <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
