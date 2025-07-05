import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export const useTenantData = <T extends { id?: string; tenantId?: string; userId?: string }>(
  collectionName: string
) => {
  const { currentUser, userProfile, currentTenant } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);
      
      // Filter by tenant if user belongs to a tenant
      if (currentTenant?.id) {
        q = query(collectionRef, where('tenantId', '==', currentTenant.id));
      } else if (userProfile?.tenantId) {
        // Fallback to user's tenantId if currentTenant is not loaded
        q = query(collectionRef, where('tenantId', '==', userProfile.tenantId));
      } else {
        // For users without tenant (like super admin), filter by userId
        q = query(collectionRef, where('userId', '==', currentUser.uid));
      }
      
      // Add ordering if the collection supports it
      try {
        q = query(q, orderBy('createdAt', 'desc'));
      } catch (error) {
        // If ordering fails, continue without it
        console.warn(`Ordering not available for ${collectionName}:`, error);
      }
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      setData(items);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<T, 'id'>) => {
    if (!currentUser?.uid) return;
    
    try {
      const itemWithMeta = {
        ...item,
        userId: currentUser.uid,
        tenantId: currentTenant?.id || userProfile?.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, collectionName), itemWithMeta);
      const newItem = { id: docRef.id, ...itemWithMeta } as T;
      setData(prev => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      console.error(`Error adding ${collectionName} item:`, error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    if (!currentUser?.uid) return;
    
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, collectionName, id), updateData);
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updateData } : item
      ));
    } catch (error) {
      console.error(`Error updating ${collectionName} item:`, error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await deleteDoc(doc(db, collectionName, id));
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Error deleting ${collectionName} item:`, error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, currentTenant, userProfile]);

  return {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchData
  };
};