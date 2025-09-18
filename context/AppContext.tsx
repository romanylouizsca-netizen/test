import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db, firebaseConfig } from '../firebase/config.ts';
import firebase from 'firebase/compat/app';
import { User, Family, EvaluationItem, EvaluationPeriod, EvaluationEntry, ToastMessage, UserRole, UserStatus, EvaluationControls } from '../types.ts';

// Helper function to convert Firestore timestamp to YYYY-MM-DD string
const timestampToDateString = (timestamp: firebase.firestore.Timestamp | undefined): string => {
  if (!timestamp) return '';
  // Ensure the date is interpreted correctly, avoiding timezone shifts from toISOString
  const date = new Date(timestamp.seconds * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface AppContextType {
  currentUser: User | null;
  loading: boolean;
  users: User[];
  families: Family[];
  items: EvaluationItem[];
  period: EvaluationPeriod | null;
  evaluations: EvaluationEntry[];
  evaluationControls: EvaluationControls | null,
  toasts: ToastMessage[];
  removeToast: (id: number) => void,
  showToast: (message: string, type: 'success' | 'error') => void;
  addFamily: (family: Omit<Family, 'id'>) => Promise<boolean>;
  updateFamily: (family: Family) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'|'uid'>, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  signUpUser: (details: {fullName: string, email: string, password: string, familyId: string}) => Promise<{success: boolean, error?: string}>;
  addItem: (item: Omit<EvaluationItem, 'id'>) => Promise<boolean>;
  updateItem: (item: EvaluationItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setPeriod: (period: Omit<EvaluationPeriod, 'id'>) => Promise<void>;
  saveEvaluations: (evaluations: Omit<EvaluationEntry, 'id'>[], familyId: string) => Promise<void>;
  updateEvaluationControls: (controls: EvaluationControls) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [period, _setPeriod] = useState<EvaluationPeriod | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationEntry[]>([]);
  const [evaluationControls, setEvaluationControls] = useState<EvaluationControls | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // This effect runs once on app load to ensure any persisted user session
  // is cleared, forcing the user to the login screen every time.
  useEffect(() => {
    auth.signOut();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await db.collection('users').where('uid', '==', user.uid).get();
        if (!userDoc.empty) {
          const userData = { id: userDoc.docs[0].id, ...userDoc.docs[0].data() } as User;
           setCurrentUser(userData);
        } else {
           // This case can happen if user exists in Auth but not in Firestore DB.
           // Forcing sign out to prevent inconsistent state.
           await auth.signOut();
           setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect manages data subscriptions based on auth state.
    const unsubscribers: (() => void)[] = [];

    // Always subscribe to families, as it's needed for the SignUp screen.
    const unsubFamilies = db.collection('families').onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Family[];
        setFamilies(data);
    }, err => console.error(`Error fetching families: `, err));
    unsubscribers.push(unsubFamilies);

    if (!currentUser) {
      // User is not logged in. Clear all user-specific data.
      setUsers([]);
      setItems([]);
      _setPeriod(null);
      setEvaluations([]);
      setEvaluationControls(null);
    } else {
      // User is logged in. Fetch all other data relevant to them.

      // Fetch items for context
      const unsubItems = db.collection('evaluation_items').onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EvaluationItem[];
          setItems(data);
      }, err => console.error(`Error fetching evaluation_items: `, err));
      unsubscribers.push(unsubItems);

      // Fetch evaluation period from the single document
      const unsubPeriod = db.collection('evaluationPeriods').doc('current').onSnapshot(doc => {
          if (doc.exists) {
              const docData = doc.data();
              if (docData) {
                  _setPeriod({
                      id: doc.id,
                      from: timestampToDateString(docData.from),
                      to: timestampToDateString(docData.to),
                  });
              }
          } else {
              _setPeriod(null);
          }
      }, err => console.error("Error fetching period: ", err));
      unsubscribers.push(unsubPeriod);
      
      // Fetch evaluation controls
      const unsubControls = db.collection('settings').doc('evaluationControls').onSnapshot(doc => {
          if (doc.exists) {
              setEvaluationControls(doc.data() as EvaluationControls);
          } else {
              setEvaluationControls({ saveEnabled: true }); // Default to enabled if not set
          }
      }, err => console.error("Error fetching controls: ", err));
      unsubscribers.push(unsubControls);

      // Admin-specific subscriptions
      if (currentUser.role === UserRole.ADMIN) {
          // Fetch all users
          const unsubUsers = db.collection('users').onSnapshot(snapshot => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
              setUsers(data);
          }, err => console.error("Error fetching users: ", err));
          unsubscribers.push(unsubUsers);

          // Fetch all evaluations
          const unsubEvaluations = db.collection('evaluations').onSnapshot(snapshot => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EvaluationEntry[];
              setEvaluations(data);
          }, err => console.error("Error fetching admin evaluations: ", err));
          unsubscribers.push(unsubEvaluations);
      } 
      // User-specific subscriptions
      else if (currentUser.role === UserRole.USER) {
          // Fetch only current user's evaluations
          const unsubUserEvaluations = db.collection('evaluations')
              .where('userId', '==', currentUser.uid)
              .onSnapshot(snapshot => {
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EvaluationEntry[];
                  setEvaluations(data);
              }, err => console.error("Error fetching user evaluations: ", err));
          unsubscribers.push(unsubUserEvaluations);
      }
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser]);


  const addFamily = async (family: Omit<Family, 'id'>) => {
    if (!family.familyName || !family.saint) return false;
    const existing = await db.collection('families').where('familyName', '==', family.familyName).get();
    if (!existing.empty) return false;
    await db.collection('families').add(family);
    return true;
  };

  const updateFamily = (family: Family) => db.collection('families').doc(family.id).update({familyName: family.familyName, saint: family.saint});
  const deleteFamily = (id: string) => db.collection('families').doc(id).delete();

  const addUser = async (user: Omit<User, 'id' | 'uid'>, password: string) => {
    const secondaryApp = firebase.initializeApp(firebaseConfig, "secondary" + Date.now());
    try {
        const existingEmail = await db.collection('users').where('email', '==', user.email).get();
        if (!existingEmail.empty) {
            return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل.' };
        }
        
        const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(user.email, password);
        const newFirebaseUser = userCredential.user;
        if (!newFirebaseUser) {
             return { success: false, error: 'فشل في إنشاء المستخدم في نظام المصادقة.' };
        }
        
        await newFirebaseUser.updateProfile({ displayName: user.fullName });
        
        const newUserDoc: Omit<User, 'id'> = {
            ...user,
            uid: newFirebaseUser.uid,
        };

        await db.collection('users').add(newUserDoc);
        return { success: true };
    } catch (error: any) {
        console.error("Error adding user:", error);
        return { success: false, error: error.message || 'فشل في إضافة المستخدم.' };
    } finally {
        await secondaryApp.delete();
    }
  };

  const updateUser = (user: User) => {
    const { id, ...dataToUpdate } = user;
    return db.collection('users').doc(id).update(dataToUpdate);
  }
  const deleteUser = (id: string) => db.collection('users').doc(id).delete();
  const resetPassword = async (email: string) => {
    try {
      await auth.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const signUpUser = async (details: {fullName: string, email: string, password: string, familyId: string}) => {
    try {
        const existingEmailQuery = await db.collection('users').where('email', '==', details.email).get();
        if (!existingEmailQuery.empty) {
            return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل.' };
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(details.email, details.password);
        const user = userCredential.user;
        if (user) {
            await user.updateProfile({ displayName: details.fullName });
            const newUser: Omit<User, 'id'> = {
                uid: user.uid,
                fullName: details.fullName,
                email: details.email,
                familyId: details.familyId,
                role: UserRole.USER,
                status: UserStatus.INACTIVE, 
            };
            await db.collection('users').add(newUser);
            await auth.signOut();
            return { success: true };
        }
        return { success: false, error: 'فشل في إنشاء المستخدم.'};
    } catch (error: any) {
        console.error("Sign up error:", error);
        if (error.code === 'auth/email-already-in-use') {
          return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل.' };
        }
        return { success: false, error: error.message || 'فشل في إنشاء الحساب.' };
    }
  };

  const addItem = async (item: Omit<EvaluationItem, 'id'>) => {
    if (!item.itemName) return false;
    const existing = await db.collection('evaluation_items').where('itemName', '==', item.itemName).get();
    if (!existing.empty) return false;
    await db.collection('evaluation_items').add(item);
    return true;
  };
  const updateItem = (item: EvaluationItem) => {
     const { id, ...dataToUpdate } = item;
     return db.collection('evaluation_items').doc(id).update(dataToUpdate);
  }
  const deleteItem = (id: string) => db.collection('evaluation_items').doc(id).delete();

  const setPeriod = async (newPeriod: Omit<EvaluationPeriod, 'id'>) => {
      const periodRef = db.collection('evaluationPeriods').doc('current');
      const fromTimestamp = firebase.firestore.Timestamp.fromDate(new Date(newPeriod.from));
      const toTimestamp = firebase.firestore.Timestamp.fromDate(new Date(newPeriod.to));
      await periodRef.set({ from: fromTimestamp, to: toTimestamp }, { merge: true });
  };

  const saveEvaluations = async (newEvaluations: Omit<EvaluationEntry, 'id'>[], familyId: string) => {
      if (!currentUser) return;
      const batch = db.batch();
      const evaluationsCollection = db.collection('evaluations');
      
      const queries = newEvaluations.map(entry => 
          evaluationsCollection
              .where('userId', '==', entry.userId)
              .where('itemId', '==', entry.itemId)
              .where('date', '==', entry.date)
              .get()
      );

      const snapshots = await Promise.all(queries);

      snapshots.forEach((snapshot, index) => {
          const entry = newEvaluations[index];
          if (snapshot.empty) {
              const docRef = evaluationsCollection.doc();
              batch.set(docRef, {...entry, familyId});
          } else {
              const docRef = snapshot.docs[0].ref;
              batch.update(docRef, { value: entry.value, familyId });
          }
      });
      
      await batch.commit();
      showToast('تم حفظ التقييم بنجاح', 'success');
  };
  
  const updateEvaluationControls = (controls: EvaluationControls) => db.collection('settings').doc('evaluationControls').set(controls, { merge: true });

  const value: AppContextType = {
    currentUser, loading, users, families, items, period, evaluations, evaluationControls,
    toasts, removeToast,
    showToast, addFamily, updateFamily, deleteFamily,
    addUser, updateUser, deleteUser, resetPassword, signUpUser,
    addItem, updateItem, deleteItem, setPeriod, saveEvaluations, updateEvaluationControls,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};