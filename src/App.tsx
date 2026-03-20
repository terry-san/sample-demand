/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  User,
  handleFirestoreError,
  OperationType,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  setDoc
} from './firebase';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  LogOut, 
  LogIn, 
  Save, 
  ChevronRight, 
  Database,
  AlertCircle,
  CheckCircle2,
  Trash2,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Table as TableIcon,
  Settings,
  Upload,
  Scan,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { utils, writeFile } from 'xlsx';

// Define the combinations based on the provided image
const STAGES = ['EIT', 'SVT'];
const ITEMS = ['TV set', 'SSB', 'PWR BD', 'RC'];

// Default PLAN_DATA as fallback
const DEFAULT_PLAN_DATA: Record<string, { value: string; label: string }[]> = {
  'OBM': [
    { value: "OBM + GPM + TPE + TPE + GPM", label: "GPM + Site: TPE + Ship to: TPE + Item: GPM" },
    { value: "OBM + EE + TPE + TPE + EE", label: "EE + Site: TPE + Ship to: TPE + Item: EE" },
    { value: "OBM + EE + TPE + TPE + PQ/AQ", label: "EE + Site: TPE + Ship to: TPE + Item: PQ/AQ" },
    { value: "OBM + SW + TPE + TPE + SW TPE", label: "SW + Site: TPE + Ship to: TPE + Item: SW TPE" },
    { value: "OBM + MTK + TPE + TPE + MTK (SW)", label: "MTK + Site: TPE + Ship to: TPE + Item: MTK (SW)" },
    { value: "OBM + Cert + TPE + TPE + Cert (TPE)", label: "Cert + Site: TPE + Ship to: TPE + Item: Cert (TPE)" },
    { value: "OBM + Titan + TPE + TPE + Titan (SW)", label: "Titan + Site: TPE + Ship to: TPE + Item: Titan (SW)" },
    { value: "OBM + Titan + XM + Spain + Titan (Spain)", label: "Titan + Site: XM + Ship to: Spain + Item: Titan (Spain)" },
    { value: "OBM + BLR (SW) + XM + BLR + BLR SW", label: "BLR (SW) + Site: XM + Ship to: BLR + Item: BLR SW" },
    { value: "OBM + QE-Usab + XM + BLR + BLR (QE-Usability)", label: "QE-Usab + Site: XM + Ship to: BLR + Item: BLR (QE-Usability)" },
    { value: "OBM + SW + XM + SGP + SGP", label: "SW + Site: XM + Ship to: SGP + Item: SGP" },
    { value: "OBM + MTK-XM + XM + MTK-XM + MTK XM", label: "MTK-XM + Site: XM + Ship to: MTK-XM + Item: MTK XM" },
    { value: "OBM + MTK-HF + XM + MTK-HF + MTK HF", label: "MTK-HF + Site: XM + Ship to: MTK-HF + Item: MTK HF" },
    { value: "OBM + MTK-SZ + XM + MTK-SZ + MTK SZ", label: "MTK-SZ + Site: XM + Ship to: MTK-SZ + Item: MTK SZ" },
    { value: "OBM + MTK-WH + XM + MTK-WH + MTK WH", label: "MTK-WH + Site: XM + Ship to: MTK-WH + Item: MTK WH" },
  ],
  'ODM': [
    { value: "ODM + EE + TPE + TPE + EE", label: "EE + Site: TPE + Ship to: TPE + Item: EE" },
    { value: "ODM + EE + TPE + TPE + PQ/AQ", label: "EE + Site: TPE + Ship to: TPE + Item: PQ/AQ" },
    { value: "ODM + PW + TPE + TPE + PW", label: "PW + Site: TPE + Ship to: TPE + Item: PW" },
    { value: "ODM + ME + TPE + TPE + ME", label: "ME + Site: TPE + Ship to: TPE + Item: ME" },
    { value: "ODM + cert + TPE + TPE + Cert (TPE)", label: "cert + Site: TPE + Ship to: TPE + Item: Cert (TPE)" },
    { value: "ODM + DQE + TPE + TPE + DQE (TPE)", label: "DQE + Site: TPE + Ship to: TPE + Item: DQE (TPE)" },
    { value: "ODM + DQE + TPE + TPE + DQE SWQE", label: "DQE + Site: TPE + Ship to: TPE + Item: DQE SWQE" },
    { value: "ODM + EMC + TPE + TPE + EMC", label: "EMC + Site: TPE + Ship to: TPE + Item: EMC" },
    { value: "ODM + Safety + TPE + TPE + Safety", label: "Safety + Site: TPE + Ship to: TPE + Item: Safety" },
    { value: "ODM + SW + XM + XM + SWQE", label: "SW + Site: XM + Ship to: XM + Item: SWQE" },
    { value: "ODM + DQE + XM + XM + DQE HW", label: "DQE + Site: XM + Ship to: XM + Item: DQE HW" },
    { value: "ODM + DQE + XM + XM + DQE ME", label: "DQE + Site: XM + Ship to: XM + Item: DQE ME" },
    { value: "ODM + DQE + XM + XM + DQE PWR", label: "DQE + Site: XM + Ship to: XM + Item: DQE PWR" },
    { value: "ODM + DQE + XM + XM + Chamber", label: "DQE + Site: XM + Ship to: XM + Item: Chamber" },
    { value: "ODM + EMI + XM + XM + EMI", label: "EMI + Site: XM + Ship to: XM + Item: EMI" },
    { value: "ODM + Safety + XM + XM + Safety", label: "Safety + Site: XM + Ship to: XM + Item: Safety" },
    { value: "ODM + Factory + XM + BZ + Factory", label: "Factory + Site: XM + Ship to: BZ + Item: Factory" },
    { value: "ODM + Factory + XM + ARG + Factory", label: "Factory + Site: XM + Ship to: ARG + Item: Factory" },
    { value: "ODM + Factory + XM + CL + Factory", label: "Factory + Site: XM + Ship to: CL + Item: Factory" },
  ]
};

interface DemandData {
  [stage: string]: {
    [item: string]: number;
  };
}

interface SampleDemandRecord {
  id?: string;
  region: string;
  series: string;
  model: string;
  combination: string;
  demands: DemandData;
  userId: string;
  createdAt: any;
}

interface Product {
  id?: string;
  region: string;
  series: string;
  model: string;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SampleDemandRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'dashboard' | 'products' | 'settings'>('form');
  
  // Dynamic Plan Data (initialized from constant, but could be fetched from Firestore)
  const [dynamicPlanData, setDynamicPlanData] = useState<Record<'OBM' | 'ODM', { label: string; value: string }[]>>(DEFAULT_PLAN_DATA);
  const [obmImage, setObmImage] = useState('/OBM.png');
  const [odmImage, setOdmImage] = useState('/ODM.png');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<{ type: 'OBM' | 'ODM', items: { label: string; value: string }[] } | null>(null);

  const COMBINATIONS = useMemo(() => 
    [...dynamicPlanData.OBM, ...dynamicPlanData.ODM].map(i => i.value),
  [dynamicPlanData]);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [region, setRegion] = useState('');
  const [series, setSeries] = useState('');
  const [model, setModel] = useState('');
  const [planType, setPlanType] = useState<'OBM' | 'ODM'>('OBM');
  const [planDetail, setPlanDetail] = useState('');

  useEffect(() => {
    if (dynamicPlanData[planType]?.[0]) {
      setPlanDetail(dynamicPlanData[planType][0].value);
    }
  }, [dynamicPlanData, planType]);
  const [demands, setDemands] = useState<DemandData>(
    STAGES.reduce((acc, stage) => ({
      ...acc,
      [stage]: ITEMS.reduce((itemAcc, item) => ({ ...itemAcc, [item]: 0 }), {})
    }), {})
  );

  // Helper to get descriptive label for a combination value
  const getCombinationLabel = (value: string) => {
    for (const type in dynamicPlanData) {
      const item = dynamicPlanData[type].find(i => i.value === value);
      if (item) return item.label;
    }
    return value;
  };

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [dashboardRowToDelete, setDashboardRowToDelete] = useState<string | null>(null);

  const handleDeleteSampleDemand = async (recordId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'sampleDemands', recordId));
      setStatus({ type: 'success', message: 'Record deleted successfully!' });
      setRecordToDelete(null);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Delete record failed:", error);
      setStatus({ type: 'error', message: 'Failed to delete record.' });
    }
  };

  const handleDeleteDashboardRow = async (rowKey: string) => {
    if (!isAdmin) return;
    const [region, series, model, stage, item] = rowKey.split('|');
    
    // Find all records that contribute to this row (have non-zero demand for this stage/item)
    const recordsToDelete = records.filter(r => 
      r.region === region && 
      r.series === series && 
      r.model === model && 
      r.demands[stage]?.[item] > 0
    );

    try {
      const deletePromises = recordsToDelete.map(r => deleteDoc(doc(db, 'sampleDemands', r.id)));
      await Promise.all(deletePromises);
      setStatus({ type: 'success', message: `Deleted ${recordsToDelete.length} records for this row.` });
      setDashboardRowToDelete(null);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Delete dashboard row failed:", error);
      setStatus({ type: 'error', message: 'Failed to delete records for this row.' });
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'planData'), {
        planData: dynamicPlanData,
        obmImage,
        odmImage,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      });
      setStatus({ type: 'success', message: 'Settings saved to cloud!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Save settings failed:", error);
      setStatus({ type: 'error', message: 'Failed to save settings.' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'OBM' | 'ODM') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'OBM') setObmImage(base64String);
      else setOdmImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePlanItem = (type: string, index: number, field: 'label' | 'value', newValue: string) => {
    setDynamicPlanData(prev => {
      const updated = { ...prev };
      updated[type] = [...updated[type]];
      updated[type][index] = { ...updated[type][index], [field]: newValue };
      return updated;
    });
  };

  const handleAddPlanItem = (type: string) => {
    setDynamicPlanData(prev => {
      const updated = { ...prev };
      updated[type] = [...updated[type], { value: `${type}_NEW_${Date.now()}`, label: 'New Combination' }];
      return updated;
    });
  };

  const handleRemovePlanItem = (type: string, index: number) => {
    setDynamicPlanData(prev => {
      const updated = { ...prev };
      updated[type] = updated[type].filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'OBM' | 'ODM') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: `Extract the combination data from this ${type} demand matrix table image. 
                For each row in the table, generate a 'label' and a 'value'.
                
                Rules for 'label': [Function] + Site: [Site] + Ship to: [Ship to] + Item: [Item]
                Rules for 'value': ${type} + [Function] + [Site] + [Ship to] + [Item]
                
                Return the result as a JSON array of objects with 'label' and 'value' properties.
                Example: [{"label": "GPM + Site: TPE + Ship to: TPE + Item: GPM", "value": "OBM + GPM + TPE + TPE + GPM"}]` },
                { inlineData: { mimeType: file.type, data: base64Data } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ["label", "value"]
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          const items = JSON.parse(text);
          setExtractedItems({ type, items });
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Scanning error:", error);
      alert("Failed to scan image. Please try again.");
      setIsScanning(false);
    }
  };

  const handleConfirmExtracted = () => {
    if (!extractedItems) return;
    const { type, items } = extractedItems;
    setDynamicPlanData(prev => ({
      ...prev,
      [type]: [...prev[type], ...items]
    }));
    setExtractedItems(null);
  };

  const handleExportExcel = () => {
    const businessTypeRow = ['', '', '', '', '', ...COMBINATIONS.map(c => c.startsWith('OBM') ? 'OBM' : 'ODM')];
    const header = ['Region', 'Series', 'Model', 'Stage', 'Item', ...COMBINATIONS.map(c => getCombinationLabel(c))];
    const data = uniqueRows.map(row => {
      const rowData: any[] = [row.region, row.series, row.model, row.stage, row.item];
      COMBINATIONS.forEach(comb => {
        rowData.push(dashboardData[row.key]?.[comb] || 0);
      });
      return rowData;
    });

    const worksheet = utils.aoa_to_sheet([businessTypeRow, header, ...data]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Dashboard");
    writeFile(workbook, `Sample_Demand_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isAdmin = useMemo(() => user?.email === "kwang0923@gmail.com", [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Fetch dynamic plan data from Firestore
    const unsub = onSnapshot(doc(db, 'settings', 'planData'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.planData) setDynamicPlanData(data.planData);
        if (data.obmImage) setObmImage(data.obmImage);
        if (data.odmImage) setOdmImage(data.odmImage);
      }
    }, (error) => {
      console.error("Settings listener error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'settings/planData');
      } catch (err) {
        // Error handled by handleFirestoreError
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }

    // Admins can see everything, others see their own
    // For simplicity in this demo, we'll fetch all if the user is the default admin
    const isAdmin = user.email === "kwang0923@gmail.com";
    
    const q = isAdmin 
      ? query(collection(db, 'sampleDemands'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'sampleDemands'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SampleDemandRecord[];
      setRecords(data);
    }, (error) => {
      console.error("Firestore Error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'sampleDemands');
      } catch (err) {
        // Error handled by handleFirestoreError
      }
    });

    // Fetch products
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(data);
    }, (error) => {
      console.error("Products listener error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (err) {
        // Error handled by handleFirestoreError
      }
    });

    return () => {
      unsubscribe();
      unsubscribeProducts();
    };
  }, [user, isAdmin]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDemandChange = (stage: string, item: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDemands(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [item]: numValue
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalRegion = region;
    let finalSeries = series;
    let finalModel = model;

    if (!isAdmin) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) {
        setStatus({ type: 'error', message: 'Please select a product (Region/Series/Model).' });
        return;
      }
      finalRegion = selectedProduct.region;
      finalSeries = selectedProduct.series;
      finalModel = selectedProduct.model;
    }

    if (!finalRegion || !finalSeries || !finalModel) {
      setStatus({ type: 'error', message: 'Please fill in all basic information.' });
      return;
    }

    try {
      // Check for existing record at this "position" (Region, Series, Model, Combination)
      const q = query(
        collection(db, 'sampleDemands'),
        where('region', '==', finalRegion),
        where('series', '==', finalSeries),
        where('model', '==', finalModel),
        where('combination', '==', planDetail)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        
        if (existingData.userId === user.uid || isAdmin) {
          // Same user or admin, overwrite
          await updateDoc(doc(db, 'sampleDemands', existingDoc.id), {
            demands,
            updatedAt: serverTimestamp(),
            // If admin is updating, we might want to keep the original userId or update it.
            // Let's keep the original userId unless specified otherwise, but add an 'updatedBy' field.
            updatedBy: user.uid
          });
          setStatus({ type: 'success', message: isAdmin ? 'Record updated by Admin!' : 'Record updated successfully!' });
        } else {
          // Different user, refuse
          setStatus({ type: 'error', message: 'This combination for this product is already managed by another user. Update refused.' });
          return;
        }
      } else {
        // No existing record, create new
        await addDoc(collection(db, 'sampleDemands'), {
          region: finalRegion,
          series: finalSeries,
          model: finalModel,
          combination: planDetail,
          demands,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', message: 'Record saved successfully!' });
      }
      
      // Reset form partially
      if (isAdmin) {
        setRegion('');
        setSeries('');
        setModel('');
      } else {
        setSelectedProductId('');
      }
      setDemands(STAGES.reduce((acc, stage) => ({
        ...acc,
        [stage]: ITEMS.reduce((itemAcc, item) => ({ ...itemAcc, [item]: 0 }), {})
      }), {}));

      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Save failed:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'sampleDemands');
      } catch (err: any) {
        const errorData = JSON.parse(err.message);
        setStatus({ type: 'error', message: `Save failed: ${errorData.error}` });
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!region || !series || !model) {
      setStatus({ type: 'error', message: 'Please fill in Region, Series, and Model.' });
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        region,
        series,
        model,
        createdAt: serverTimestamp()
      });
      setStatus({ type: 'success', message: 'Product added successfully!' });
      setRegion('');
      setSeries('');
      setModel('');
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Add product failed:", error);
      setStatus({ type: 'error', message: 'Failed to add product.' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!isAdmin) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setStatus({ type: 'success', message: 'Product deleted successfully!' });
      setProductToDelete(null);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error("Delete product failed:", error);
      setStatus({ type: 'error', message: 'Failed to delete product.' });
    }
  };

  // Dashboard calculations
  const dashboardData = useMemo(() => {
    const grouped: { [key: string]: { [comb: string]: number } } = {};
    
    records.forEach(record => {
      STAGES.forEach(stage => {
        ITEMS.forEach(item => {
          const key = `${record.region}|${record.series}|${record.model}|${stage}|${item}`;
          if (!grouped[key]) grouped[key] = {};
          
          const val = record.demands[stage]?.[item] || 0;
          grouped[key][record.combination] = (grouped[key][record.combination] || 0) + val;
        });
      });
    });

    return grouped;
  }, [records]);

  const uniqueRows = useMemo(() => {
    const rows = Object.keys(dashboardData).map(key => {
      const [region, series, model, stage, item] = key.split('|');
      return { region, series, model, stage, item, key };
    });
    // Sort rows for better presentation
    return rows.sort((a, b) => a.model.localeCompare(b.model) || a.stage.localeCompare(b.stage));
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-stone-200"
        >
          <div className="bg-stone-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 text-center">Sample Demand</h1>
          <p className="text-stone-500 mb-8 text-center">Sign in to track and manage sample demand statistics.</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {authMode === 'signup' && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
              />
            </div>
            
            {authError && (
              <p className="text-rose-500 text-xs font-medium bg-rose-50 p-2 rounded-lg border border-rose-100">{authError}</p>
            )}

            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all active:scale-95"
            >
              {authMode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400 font-bold">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl font-semibold hover:bg-stone-50 transition-all active:scale-95 mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google Account
          </button>

          <p className="text-center text-sm text-stone-500">
            {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="ml-1 text-stone-900 font-bold hover:underline"
            >
              {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-stone-900 p-1.5 rounded-lg">
                <Database className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">Sample Demand Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="text-xs text-stone-500">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-stone-200 p-1 rounded-xl w-fit mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'form' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <PlusCircle size={18} />
            New Entry
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <History size={18} />
            History ({records.length})
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <TableIcon size={18} />
            Dashboard Grid
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              <Database size={18} />
              Manage Products
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              <Settings size={18} />
              Admin Settings
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <LayoutDashboard className="text-stone-400" size={20} />
                    Input Sample Demand
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 gap-6">
                      {!isAdmin ? (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Select Product (Region / Series / Model)</label>
                          <select 
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all bg-white"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.region} / {p.series} / {p.model}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Region</label>
                            <input 
                              type="text" 
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              placeholder="e.g. BRA"
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Series</label>
                            <input 
                              type="text" 
                              value={series}
                              onChange={(e) => setSeries(e.target.value)}
                              placeholder="e.g. 7811"
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Model</label>
                            <input 
                              type="text" 
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              placeholder="e.g. 50PQG7811/77"
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Combination Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Business Type</label>
                        <select 
                          value={planType}
                          onChange={(e) => {
                            const newType = e.target.value as 'OBM' | 'ODM';
                            setPlanType(newType);
                            if (dynamicPlanData[newType]?.[0]) {
                              setPlanDetail(dynamicPlanData[newType][0].value);
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all bg-white"
                        >
                          <option value="OBM">OBM</option>
                          <option value="ODM">ODM</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Sample Plan Details</label>
                        <select 
                          value={planDetail}
                          onChange={(e) => setPlanDetail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all bg-white"
                        >
                          {dynamicPlanData[planType]?.map((item, i) => (
                            <option key={i} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Reference Table or Image */}
                    <div className="space-y-4">
                      {((planType === 'OBM' && obmImage) || (planType === 'ODM' && odmImage)) && (
                        <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm p-2">
                          <img 
                            src={planType === 'OBM' ? obmImage : odmImage} 
                            alt={`${planType} Reference`}
                            className="w-full h-auto rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Reference Table (Digital Version of OBM/ODM images) */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={planType}
                        className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm"
                      >
                      <table className="w-full border-collapse text-[10px] sm:text-xs">
                        <thead>
                          <tr className="bg-amber-400">
                            <th colSpan={4} className="p-2 border border-stone-300 text-left font-bold">Sample Plan</th>
                            {dynamicPlanData[planType]?.map((item, i) => (
                              <th key={i} className={`p-1 border border-stone-300 text-center font-bold ${planType === 'OBM' ? (i >= 6 && i <= 7 || i === 11 ? 'bg-orange-200' : 'bg-orange-100') : (i >= 9 && i <= 12 ? 'bg-orange-100' : 'bg-blue-100')}`}>
                                {planType}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          {/* Function Row */}
                          <tr>
                            <td colSpan={4} className="p-1 border border-stone-300 font-bold bg-stone-50">Function</td>
                            {dynamicPlanData[planType]?.map((item, i) => {
                              const func = item.label.split(' + ')[0] || '';
                              return (
                                <td key={i} className={`p-1 border border-stone-300 ${planDetail === item.value ? 'bg-stone-900 text-white' : ''}`}>
                                  {func}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Making Site Row */}
                          <tr>
                            <td colSpan={4} className="p-1 border border-stone-300 font-bold bg-stone-50">Making Site</td>
                            {dynamicPlanData[planType]?.map((item, i) => {
                              const site = item.label.split('Site: ')[1]?.split(' + ')[0] || '';
                              return (
                                <td key={i} className={`p-1 border border-stone-300 ${planDetail === item.value ? 'bg-stone-900 text-white' : (site === 'XM' ? 'bg-orange-50' : '')}`}>
                                  {site}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Ship to Row */}
                          <tr>
                            <td colSpan={4} className="p-1 border border-stone-300 font-bold bg-stone-50">Ship to</td>
                            {dynamicPlanData[planType]?.map((item, i) => {
                              const shipTo = item.label.split('Ship to: ')[1]?.split(' + ')[0] || '';
                              return (
                                <td key={i} className={`p-1 border border-stone-300 ${
                                  planDetail === item.value ? 'bg-stone-900 text-white' : (shipTo === 'BZ' ? 'bg-amber-200' : shipTo === 'ARG' ? 'bg-sky-200' : shipTo === 'CL' ? 'bg-emerald-100' : (planType === 'OBM' && i >= 7 ? 'bg-orange-50' : ''))
                                }`}>
                                  {shipTo}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Bottom Labels Row */}
                          <tr className="font-bold">
                            <td className="p-1 border border-stone-300">Series</td>
                            <td className="p-1 border border-stone-300">Model</td>
                            <td className="p-1 border border-stone-300">Stage</td>
                            <td className="p-1 border border-stone-300">Item</td>
                            {dynamicPlanData[planType]?.map((item, i) => {
                              const itemName = item.label.split('Item: ')[1] || item.label.split(' + ').pop() || '';
                              return (
                                <td key={i} className={`p-1 border border-stone-300 ${planDetail === item.value ? 'bg-stone-900 text-white' : ''}`}>
                                  {itemName}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </motion.div>
                  </div>

                    {/* Demand Matrix */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Demand Matrix (TV set, SSB, PWR BD, RC)</label>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-stone-50">
                              <th className="p-3 text-left border border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">Stage</th>
                              {ITEMS.map(item => (
                                <th key={item} className="p-3 text-center border border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">{item}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {STAGES.map(stage => (
                              <tr key={stage}>
                                <td className="p-3 border border-stone-200 font-bold text-stone-600 bg-stone-50/50">{stage}</td>
                                {ITEMS.map(item => (
                                  <td key={item} className="p-2 border border-stone-200">
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={demands[stage][item]}
                                      onChange={(e) => handleDemandChange(stage, item, e.target.value)}
                                      className="w-full text-center py-2 rounded-lg border border-transparent focus:border-stone-900 outline-none transition-all"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {status.type && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                      >
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{status.message}</span>
                      </motion.div>
                    )}

                    <button 
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200"
                    >
                      <Save size={20} />
                      Save Demand Statistics
                    </button>
                  </form>
                </div>
              </div>

              {/* Quick Info / Tips */}
              <div className="space-y-6">
                <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-bold mb-4">Quick Guide</h3>
                  <ul className="space-y-4 text-stone-300 text-sm">
                    <li className="flex gap-3">
                      <ChevronRight className="text-stone-500 shrink-0" size={18} />
                      <span>Enter the basic product info (Region, Series, Model).</span>
                    </li>
                    <li className="flex gap-3">
                      <ChevronRight className="text-stone-500 shrink-0" size={18} />
                      <span>Select the appropriate Sample Plan combination from the dropdown.</span>
                    </li>
                    <li className="flex gap-3">
                      <ChevronRight className="text-stone-500 shrink-0" size={18} />
                      <span>Fill in the demand quantities for both EIT and SVT stages.</span>
                    </li>
                    <li className="flex gap-3">
                      <ChevronRight className="text-stone-500 shrink-0" size={18} />
                      <span>Click "Save" to store the data in the cloud database.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Database size={18} className="text-stone-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {records.slice(0, 3).map((record, i) => (
                      <div key={i} className="text-sm border-l-2 border-stone-100 pl-4 py-1">
                        <p className="font-bold text-stone-800">{record.model}</p>
                        <p className="text-stone-500 text-xs">{record.region} • {record.series}</p>
                      </div>
                    ))}
                    {records.length === 0 && (
                      <p className="text-stone-400 text-sm italic">No records yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="text-stone-400" size={20} />
                  Demand History
                </h2>
                <span className="text-sm text-stone-500 font-medium">{records.length} total records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 border-b border-stone-100">Date</th>
                      <th className="p-4 border-b border-stone-100">Model Info</th>
                      <th className="p-4 border-b border-stone-100">Combination</th>
                      <th className="p-4 border-b border-stone-100 text-center">EIT Total</th>
                      <th className="p-4 border-b border-stone-100 text-center">SVT Total</th>
                      {isAdmin && <th className="p-4 border-b border-stone-100">User</th>}
                      <th className="p-4 border-b border-stone-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {records.map((record) => {
                      const eitDemands = record.demands['EIT'] || {};
                      const svtDemands = record.demands['SVT'] || {};
                      const eitTotal = Object.values(eitDemands).reduce((a: number, b: number) => a + b, 0);
                      const svtTotal = Object.values(svtDemands).reduce((a: number, b: number) => a + b, 0);
                      const date = record.createdAt?.toDate?.() ? record.createdAt.toDate().toLocaleDateString() : 'N/A';

                      return (
                        <tr key={record.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="p-4 text-sm text-stone-500">{date}</td>
                          <td className="p-4">
                            <div className="font-bold text-stone-800">{record.model}</div>
                            <div className="text-xs text-stone-500">{record.region} • {record.series}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-stone-600 max-w-xs truncate" title={record.combination}>
                              {getCombinationLabel(record.combination)}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                              {eitTotal}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                              {svtTotal}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-xs text-stone-500">
                              {record.userId.substring(0, 8)}...
                            </td>
                          )}
                          <td className="p-4 text-right">
                            {isAdmin ? (
                              recordToDelete === record.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => record.id && handleDeleteSampleDemand(record.id)}
                                    className="text-rose-600 font-bold text-xs hover:underline"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => setRecordToDelete(null)}
                                    className="text-stone-400 text-xs hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setRecordToDelete(record.id || null)}
                                  className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                                  title="Delete Record"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )
                            ) : (
                              <button className="text-stone-300 hover:text-stone-900 transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-stone-400 italic">
                          No records found. Start by creating a new entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === 'settings' && isAdmin ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 bg-stone-900 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={20} />
                  Admin Settings & Combination Management
                </h2>
                <button 
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg"
                >
                  <Save size={16} />
                  Save All Settings
                </button>
              </div>

              <div className="p-8 space-y-12">
                {/* Reference Images Section */}
                <section>
                  <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <Upload size={18} className="text-stone-400" />
                    Reference Image Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-stone-700">OBM Reference Image</label>
                      <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center">
                        {obmImage ? (
                          <div className="relative inline-block group">
                            <img src={obmImage} alt="OBM Ref" className="max-h-40 mx-auto mb-4 rounded border border-stone-100 shadow-sm" />
                            <button 
                              onClick={() => setObmImage('')}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Clear Image"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="py-8 text-stone-300 italic text-sm">No OBM image uploaded</div>
                        )}
                        <div className="mt-2">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'OBM')}
                            className="text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-stone-700">ODM Reference Image</label>
                      <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center">
                        {odmImage ? (
                          <div className="relative inline-block group">
                            <img src={odmImage} alt="ODM Ref" className="max-h-40 mx-auto mb-4 rounded border border-stone-100 shadow-sm" />
                            <button 
                              onClick={() => setOdmImage('')}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Clear Image"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="py-8 text-stone-300 italic text-sm">No ODM image uploaded</div>
                        )}
                        <div className="mt-2">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'ODM')}
                            className="text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Combination Data Section */}
                <section>
                  <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <Database size={18} className="text-stone-400" />
                    Combination Dropdown Options
                  </h3>
                  
                  <div className="space-y-8">
                    {['OBM', 'ODM'].map(type => (
                      <div key={type} className="bg-stone-50 rounded-xl p-6 border border-stone-200">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-stone-800">{type} Combinations</h4>
                          <div className="flex gap-2">
                            <label className={`text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded hover:bg-stone-200 transition-colors flex items-center gap-1 cursor-pointer ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Scan size={12} />} 
                              {isScanning ? 'Scanning...' : 'Scan Image'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleScanImage(e, type as 'OBM' | 'ODM')}
                                disabled={isScanning}
                              />
                            </label>
                            <button 
                              onClick={() => handleAddPlanItem(type)}
                              className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded hover:bg-stone-800 transition-colors flex items-center gap-1"
                            >
                              <PlusCircle size={12} /> Add Item
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {dynamicPlanData[type].map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Label</label>
                                <input 
                                  type="text" 
                                  value={item.label}
                                  onChange={(e) => handleUpdatePlanItem(type, idx, 'label', e.target.value)}
                                  className="w-full text-xs p-2 border border-stone-200 rounded focus:ring-1 focus:ring-stone-900 outline-none"
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Value (Unique ID)</label>
                                <input 
                                  type="text" 
                                  value={item.value}
                                  onChange={(e) => handleUpdatePlanItem(type, idx, 'value', e.target.value)}
                                  className="w-full text-xs p-2 border border-stone-200 rounded focus:ring-1 focus:ring-stone-900 outline-none"
                                />
                              </div>
                              <button 
                                onClick={() => handleRemovePlanItem(type, idx)}
                                className="mt-5 text-stone-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 bg-stone-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TableIcon size={20} />
                    Sample Demand Summary Grid
                  </h2>
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg"
                  >
                    <Save size={14} />
                    Export to Excel
                  </button>
                </div>
                <span className="text-xs font-mono opacity-60">AGGREGATED STATISTICS</span>
              </div>

              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-stone-100 text-stone-600">
                      <th className="p-2 border border-stone-200 sticky left-0 bg-stone-100 z-20">Region</th>
                      <th className="p-2 border border-stone-200 sticky left-[60px] bg-stone-100 z-20">Series</th>
                      <th className="p-2 border border-stone-200 sticky left-[120px] bg-stone-100 z-20">Model</th>
                      <th className="p-2 border border-stone-200 sticky left-[220px] bg-stone-100 z-20">Stage</th>
                      <th className="p-2 border border-stone-200 sticky left-[280px] bg-stone-100 z-20">Item</th>
                      {COMBINATIONS.map((comb, i) => {
                        const label = getCombinationLabel(comb);
                        return (
                          <th key={i} className="p-2 border border-stone-200 min-w-[140px] text-[10px] leading-tight font-bold bg-stone-100">
                            <div className="text-stone-400 mb-1">{comb.startsWith('OBM') ? 'OBM' : 'ODM'}</div>
                            {label.split(' + ').map((part, idx) => (
                              <div key={idx}>{part}</div>
                            ))}
                          </th>
                        );
                      })}
                      {isAdmin && <th className="p-2 border border-stone-200 bg-stone-100">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueRows.map((row) => (
                      <tr key={row.key} className="hover:bg-stone-50 transition-colors">
                        <td className="p-2 border border-stone-200 font-medium sticky left-0 bg-white z-10">{row.region}</td>
                        <td className="p-2 border border-stone-200 font-medium sticky left-[60px] bg-white z-10">{row.series}</td>
                        <td className="p-2 border border-stone-200 font-bold text-stone-900 sticky left-[120px] bg-white z-10">{row.model}</td>
                        <td className={`p-2 border border-stone-200 font-bold text-center sticky left-[220px] z-10 ${row.stage === 'EIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {row.stage}
                        </td>
                        <td className="p-2 border border-stone-200 font-medium sticky left-[280px] bg-white z-10">{row.item}</td>
                        {COMBINATIONS.map((comb, i) => {
                          const val = dashboardData[row.key]?.[comb];
                          return (
                            <td key={i} className={`p-2 border border-stone-200 text-center font-mono ${val ? 'bg-blue-50/50 font-bold text-blue-700' : 'text-stone-300'}`}>
                              {val || '-'}
                            </td>
                          );
                        })}
                        {isAdmin && (
                          <td className="p-2 border border-stone-200 text-right">
                            {dashboardRowToDelete === row.key ? (
                              <div className="flex flex-col items-end gap-1">
                                <button 
                                  onClick={() => handleDeleteDashboardRow(row.key)}
                                  className="text-rose-600 font-bold text-[10px] hover:underline"
                                >
                                  Confirm Clear
                                </button>
                                <button 
                                  onClick={() => setDashboardRowToDelete(null)}
                                  className="text-stone-400 text-[10px] hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDashboardRowToDelete(row.key)}
                                className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                                title="Clear all records for this row"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {uniqueRows.length === 0 && (
                      <tr>
                        <td colSpan={COMBINATIONS.length + 5} className="p-12 text-center text-stone-400 italic bg-stone-50">
                          No data available to display in the grid.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="products"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Database className="text-stone-400" size={20} />
                  Add New Product Combination
                </h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Region</label>
                    <input 
                      type="text" 
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. BRA"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Series</label>
                    <input 
                      type="text" 
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="e.g. 7811"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Model</label>
                    <input 
                      type="text" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. 50PQG7811/77"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-stone-900 text-white py-2.5 rounded-xl font-bold hover:bg-stone-800 transition-all active:scale-95"
                  >
                    Add Product
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                  <h3 className="font-bold">Existing Products</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4 border-b border-stone-100">Region</th>
                        <th className="p-4 border-b border-stone-100">Series</th>
                        <th className="p-4 border-b border-stone-100">Model</th>
                        <th className="p-4 border-b border-stone-100">Created At</th>
                        <th className="p-4 border-b border-stone-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-4 text-sm font-medium">{p.region}</td>
                          <td className="p-4 text-sm">{p.series}</td>
                          <td className="p-4 text-sm font-bold">{p.model}</td>
                          <td className="p-4 text-xs text-stone-400">
                            {p.createdAt?.toDate?.() ? p.createdAt.toDate().toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            {productToDelete === p.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => p.id && handleDeleteProduct(p.id)}
                                  className="text-rose-600 font-bold text-xs hover:underline"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => setProductToDelete(null)}
                                  className="text-stone-400 text-xs hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setProductToDelete(p.id || null)}
                                className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scan Confirmation Modal */}
      <AnimatePresence>
        {extractedItems && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-900 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Scan size={20} />
                  Confirm Extracted {extractedItems.type} Combinations
                </h3>
                <button onClick={() => setExtractedItems(null)} className="text-white/60 hover:text-white">
                  <LogOut size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <p className="text-sm text-stone-500">
                  We've analyzed the image and found the following combinations. Please review and edit them before adding to your list.
                </p>
                <div className="space-y-3">
                  {extractedItems.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-stone-50 p-3 rounded-lg border border-stone-200">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Label</label>
                        <input 
                          type="text" 
                          value={item.label}
                          onChange={(e) => {
                            const newItems = [...extractedItems.items];
                            newItems[idx].label = e.target.value;
                            setExtractedItems({ ...extractedItems, items: newItems });
                          }}
                          className="w-full text-xs p-2 border border-stone-200 rounded focus:ring-1 focus:ring-stone-900 outline-none"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Value</label>
                        <input 
                          type="text" 
                          value={item.value}
                          onChange={(e) => {
                            const newItems = [...extractedItems.items];
                            newItems[idx].value = e.target.value;
                            setExtractedItems({ ...extractedItems, items: newItems });
                          }}
                          className="w-full text-xs p-2 border border-stone-200 rounded focus:ring-1 focus:ring-stone-900 outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newItems = extractedItems.items.filter((_, i) => i !== idx);
                          setExtractedItems({ ...extractedItems, items: newItems });
                        }}
                        className="mt-5 text-stone-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                <button 
                  onClick={() => setExtractedItems(null)}
                  className="px-6 py-2 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmExtracted}
                  className="px-6 py-2 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-lg"
                >
                  Add All {extractedItems.items.length} Items
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-400 text-xs">
          <p>© 2026 Sample Demand Tracker • Secure Cloud Storage Enabled</p>
        </div>
      </footer>
    </div>
  );
}
