import React, { useState, useMemo, useCallback } from 'react';
import { ScanFace, UploadCloud, User, MapPin, Search, BrainCircuit, Users2, Trash2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useSuspectRecognitionContext } from '../contexts/SuspectRecognitionContext';
import { RecognizedSuspect } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Simple text similarity function (Jaccard similarity on words)
const calculateSimilarity = (text1: string, text2: string): number => {
    const set1 = new Set(text1.toLowerCase().split(/[\s,]+/).filter(w => w.length > 1));
    const set2 = new Set(text2.toLowerCase().split(/[\s,]+/).filter(w => w.length > 1));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
};

// ** NEW UTILITY FUNCTION TO RESIZE IMAGE **
const resizeImage = (base64Str: string, maxWidth = 128, maxHeight = 128): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Use JPEG for better compression than PNG for photos
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};


const SuspectRecognitionView: React.FC = () => {
    const { recognizedSuspects, addSuspect, deleteSuspect } = useSuspectRecognitionContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [officerName, setOfficerName] = useState('');
    const [officerLocation, setOfficerLocation] = useState('');
    const [suspectName, setSuspectName] = useState('');

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<(RecognizedSuspect & { similarity: number })[]>([]);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            const file = acceptedFiles[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
        multiple: false
    });
    
    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleAnalysis = async (mode: 'add' | 'search') => {
        if (!imageFile || !imagePreview) { // Added !imagePreview check
            setError("Please upload an image.");
            return;
        }
        if (mode === 'add' && (!officerName || !officerLocation || !suspectName)) {
            setError("Please fill in all officer and suspect details to add to the database.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSearchResults([]);
        if (mode === 'search') setIsSearching(true);
        
        try {
            const imagePart = await fileToGenerativePart(imageFile);
            const prompt = "Extract key facial features of the person in this image. Provide the output as a comma-separated list of keywords. For example: 'male, mid-30s, short black hair, brown eyes, clean-shaven, smiling, round face, scar on left cheek, wearing glasses, blue collared shirt'. Be as objective and consistent as possible.";

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: [{ parts: [imagePart, { text: prompt }] }],
            });
            const description = response.text;
            
            if (mode === 'add') {
                // ** RESIZE IMAGE BEFORE SAVING **
                const thumbnailBase64 = await resizeImage(imagePreview);

                addSuspect({
                    officerName,
                    officerLocation,
                    suspectName,
                    imageBase64: thumbnailBase64, // Save the smaller thumbnail
                    geminiDescription: description,
                });
                resetForm();
            } else { // Search mode
                const results = recognizedSuspects.map(existingSuspect => ({
                    ...existingSuspect,
                    similarity: calculateSimilarity(description, existingSuspect.geminiDescription)
                })).filter(result => result.similarity > 0.1) // Similarity threshold
                 .sort((a, b) => b.similarity - a.similarity);
                setSearchResults(results);
            }

        } catch (e: any) {
            console.error("Error with Gemini API:", e);
            setError(`Failed to analyze image: ${e.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            if (mode === 'search') setIsSearching(false);
        }
    };
    
    const resetForm = () => {
        setImageFile(null);
        setImagePreview(null);
        setOfficerName('');
        setOfficerLocation('');
        setSuspectName('');
        setError(null);
        setSearchResults([]);
        setIsSearching(false);
    };

    return (
        <div className="space-y-6">
            <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
                <div className="flex items-center text-xl sm:text-2xl font-semibold text-textPrimary mb-1">
                    <ScanFace size={24} className="mr-2.5 text-cyan-500" /> Suspect Recognition (AI-Assisted)
                </div>
                <p className="text-sm text-textSecondary">Upload suspect images to generate AI feature keywords and search for matches in the database.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Upload and Search */}
                <div className="lg:col-span-1 bg-surface border rounded-xl shadow-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-textPrimary">Upload & Analyze Image</h3>
                    <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary-lighter' : 'border-neutral-light hover:border-primary'}`}>
                        <input {...getInputProps()} />
                        <UploadCloud size={32} className="mx-auto text-neutral-DEFAULT mb-2"/>
                        {imagePreview ? <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md"/> : <p className="text-xs text-textSecondary">Drop image here or click to select</p>}
                    </div>
                    {error && <div className="p-2 bg-danger-lighter text-danger-darker text-xs rounded border border-danger-light flex items-center"><AlertTriangle size={14} className="mr-2"/>{error}</div>}

                    <div>
                        <label className="text-xs font-medium text-textSecondary">Officer Name</label>
                        <input type="text" value={officerName} onChange={e => setOfficerName(e.target.value)} className="w-full p-1.5 border rounded-md text-sm mt-1"/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-textSecondary">Officer Location / Unit</label>
                        <input type="text" value={officerLocation} onChange={e => setOfficerLocation(e.target.value)} className="w-full p-1.5 border rounded-md text-sm mt-1"/>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-textSecondary">Suspect Name / Alias</label>

                        <input type="text" value={suspectName} onChange={e => setSuspectName(e.target.value)} className="w-full p-1.5 border rounded-md text-sm mt-1"/>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-2 border-t">
                        <button onClick={() => handleAnalysis('add')} disabled={isLoading || !imageFile} className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center disabled:opacity-60">
                            {isLoading && !isSearching ? <Loader2 className="animate-spin mr-2"/> : <BrainCircuit className="mr-2"/>}
                            {isLoading && !isSearching ? 'Analyzing...' : 'Analyze & Add to DB'}
                        </button>
                         <button onClick={() => handleAnalysis('search')} disabled={isLoading || !imageFile} className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center justify-center disabled:opacity-60">
                            {isLoading && isSearching ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2"/>}
                            {isLoading && isSearching ? 'Searching...' : 'Search for Match'}
                        </button>
                        <button onClick={resetForm} className="w-full px-4 py-2 bg-neutral-light hover:bg-neutral-light/70 text-textPrimary rounded-lg text-sm">Clear</button>
                    </div>
                </div>

                {/* Right Panel: Database / Search Results */}
                <div className="lg:col-span-2 bg-surface border rounded-xl shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-textPrimary mb-3">{searchResults.length > 0 ? "Search Results" : "Recognized Suspects Database"} ({searchResults.length > 0 ? searchResults.length : recognizedSuspects.length})</h3>
                    <div className="max-h-[70vh] overflow-y-auto scrollbar-thin pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(searchResults.length > 0 ? searchResults : recognizedSuspects).map(suspect => (
                            <div key={suspect.id} className="bg-neutral-lightest rounded-lg border border-neutral-light p-3 space-y-2 relative group">
                                <button onClick={() => deleteSuspect(suspect.id)} className="absolute top-2 right-2 p-1 bg-white/50 text-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                { 'similarity' in suspect && <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] bg-primary text-white rounded-full">Match: {(Number(suspect.similarity) * 100).toFixed(1)}%</div>}
                                <div className="flex gap-3">
                                    <img src={suspect.imageBase64} alt={suspect.suspectName} className="h-20 w-20 object-cover rounded-md flex-shrink-0"/>
                                    <div className="text-xs">
                                        <p className="font-bold text-sm text-textPrimary">{suspect.suspectName}</p>
                                        <p><strong className="text-neutral-dark">Officer:</strong> {suspect.officerName}</p>
                                        <p><strong className="text-neutral-dark">Unit:</strong> {suspect.officerLocation}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-textSecondary mb-1">AI Keywords / Features:</p>
                                    <p className="text-xs text-textPrimary bg-white p-1.5 rounded border border-neutral-light/50 h-20 overflow-y-auto scrollbar-thin">{suspect.geminiDescription}</p>
                                </div>
                            </div>
                        ))}
                         {(searchResults.length === 0 && isSearching && !isLoading) && <div className="md:col-span-2 text-center p-6"><Info size={24} className="mx-auto mb-2"/><p>No strong matches found in the database.</p></div>}
                        {(recognizedSuspects.length === 0 && !isSearching) && <div className="md:col-span-2 text-center p-6"><Info size={24} className="mx-auto mb-2"/><p>The suspect database is empty. Add a suspect to begin.</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuspectRecognitionView;