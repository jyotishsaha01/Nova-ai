import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signInGuest: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              userId: user.uid,
              email: user.email || `guest_${user.uid.slice(0, 6)}@nova.local`,
              displayName: user.displayName || "Nova Explorer",
              photoURL: user.photoURL || "",
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn("Could not sync user profile to Firestore:", err);
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      try { await signInAnonymously(auth); } catch (anonErr) { console.error("Anonymous fallback failed:", anonErr); }
    }
  };

  const signInGuest = async () => {
    try { await signInAnonymously(auth); } catch (error) { console.error("Guest Sign-In failed:", error); }
  };

  const logout = async () => {
    try { await signOut(auth); } catch (error) { console.error("Sign-out failed:", error); }
  };

  return <AuthContext.Provider value={{ currentUser, isLoading, signInWithGoogle, signInGuest, logout }}>{children}</AuthContext.Provider>;
};
