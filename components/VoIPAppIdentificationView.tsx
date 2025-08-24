
import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, Zap, Info, Loader2, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface AppIdentificationResult {
  ipAddress: string;
  likelyProvider: string;
  confidence: 'High' | 'Medium' | 'Low' | 'Unknown';
  reasoning: string;
}

const VoIPAppIdentificationView: React.FC = () => {
    const { allVoIPRecords, isLoading: contextIsLoading } = useVoIPContext();
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiResults, setAiResults] = useState<AppIdentificationResult[] | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    
    const uniqueIPs = useMemo(() => Array.from(new Set(allVoIPRecords.map(r => r.ipAddress).filter(Boolean))), [allVoIPRecords]);

    const handleAnalyzeApps = useCallback(async () => {
        if (uniqueIPs.length === 0) {
            setAiError("No unique IP addresses found in the data to analyze.");
            return;
        }
        setIsLoadingAI(true);
        setAiError(null);
        setAiResults(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a telecom intelligence analyst. I will provide you with a list of IP addresses. Based on your knowledge of internet infrastructure and specifically Bangladeshi VoIP/IP Telephony Service Providers (ITSP), identify the most likely service provider for each IP address.
                Known Bangladeshi ITSPs include, but are not limited to: Brilliant, Alaap, AmberIT, Dial, Agnitalk, Orbitalk.

                For each IP address, provide your analysis as a JSON object with the following fields:
                - "ipAddress": string (The IP address you analyzed)
                - "likelyProvider": string (Your best guess for the provider, e.g., "Brilliant", "AmberIT", "General ISP", or "Unknown")
                - "confidence": "High" | "Medium" | "Low" | "Unknown" (Your confidence in this assessment)
                - "reasoning": string (A brief explanation for your choice, e.g., "This IP is within a known range for this provider.", "This IP belongs to a major ISP that hosts many services, unable to pinpoint specific ITSP.")

                Return your findings as a single JSON array of these objects. If you cannot determine a provider for an IP, set "likelyProvider" to "Unknown".
                
                List of IP Addresses to analyze:
                ${JSON.stringify(uniqueIPs)}
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            let jsonStr = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
              jsonStr = match[2].trim();
            }

            const parsedResults = JSON.parse(jsonStr);
            if(Array.isArray(parsedResults)) {
                setAiResults(parsedResults as AppIdentificationResult[]);
            } else {
                throw new Error("AI response was not a JSON array.");
            }

        } catch (e: any) {
            console.error("Error calling Gemini API for App ID:", e);
            setAiError(`Failed to identify apps: ${e.message || 'Unknown error'}. Check API key and console.`);
        } finally {
            setIsLoadingAI(false);
        }
    }, [uniqueIPs]);

    const getConfidencePillClass = (confidence: AppIdentificationResult['confidence']) => {
        switch (confidence) {
          case 'High': return 'bg-success-lighter text-success-darker';
          case 'Medium': return 'bg-warning-lighter text-warning-darker';
          case 'Low': return 'bg-orange-200 text-orange-700';
          default: return 'bg-neutral-light text-neutral-darker';
        }
    };
    
    if (contextIsLoading && uniqueIPs.length === 0) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-indigo-500" /><p className="ml-3 text-textSecondary">Loading data...</p></div>;
    }
    if (uniqueIPs.length === 0 && !contextIsLoading) {
         return <div className="p-6 bg-info-lighter border border-info-light rounded-lg text-center text-info-dark flex flex-col items-center justify-center min-h-[150px] shadow-md"><Info size={28} className="mb-2" /><p className="font-medium">No VoIP CDR files with IP addresses have been uploaded.</p></div>;
    }

    return (
        <div className="space-y-6">
            <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <div className="flex items-center text-xl sm:text-2xl font-semibold text-textPrimary mb-1">
                            <Sparkles size={24} className="mr-2.5 text-purple-500" /> AI-Powered VoIP App Identification
                        </div>
                        <p className="text-sm text-textSecondary">Leverage AI to identify the likely VoIP service provider for each IP address found in the data.</p>
                        <p className="text-xs text-textSecondary mt-1">Note: Results are inferential and depend on the AI's knowledge base. They are not guaranteed to be accurate.</p>
                    </div>
                    <button onClick={handleAnalyzeApps} disabled={isLoadingAI || uniqueIPs.length === 0} className="mt-3 sm:mt-0 px-5 py-2.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 flex items-center shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoadingAI ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Zap size={16} className="mr-2"/>}
                        {isLoadingAI ? 'AI Analyzing IPs...' : `Analyze ${uniqueIPs.length} IPs`}
                    </button>
                </div>
            </div>

            {aiError && <div className="p-3 bg-danger-lighter text-danger-darker rounded-lg border border-danger-light flex items-start shadow"><AlertTriangle size={18} className="mr-2 mt-0.5"/><div><p className="font-semibold">Analysis Error</p><p className="text-xs">{aiError}</p></div></div>}
            {isLoadingAI && <div className="flex justify-center items-center h-40"><Loader2 className="h-10 w-10 animate-spin text-purple-500" /><p className="ml-3 text-textSecondary">AI is processing IP addresses...</p></div>}
            
            {!isLoadingAI && !aiError && !aiResults && (
                <div className="p-6 bg-neutral-lightest border border-neutral-light rounded-lg text-center text-textSecondary flex flex-col items-center justify-center min-h-[150px] shadow-md">
                    <Info size={28} className="mb-2 text-neutral-DEFAULT" />
                    <p className="font-medium">Click "Analyze IPs" to begin AI-powered identification.</p>
                </div>
            )}
            
            {aiResults && aiResults.length === 0 && !aiError && !isLoadingAI && (
                <div className="p-6 bg-success-lighter border border-success-light rounded-lg text-center text-success-darker flex flex-col items-center justify-center min-h-[150px] shadow-md">
                    <CheckCircle size={28} className="mb-2"/>
                    <p className="font-medium">AI analysis complete. No specific providers could be identified from the given IPs.</p>
                </div>
            )}
            
            {aiResults && aiResults.length > 0 && (
                <div className="bg-surface shadow-xl rounded-xl border border-neutral-light overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-light">
                        <thead className="bg-neutral-lightest">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-textPrimary uppercase">IP Address</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-textPrimary uppercase">Likely Provider</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-textPrimary uppercase">Confidence</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-textPrimary uppercase">AI Reasoning</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-neutral-light">
                            {aiResults.map(result => (
                                <tr key={result.ipAddress} className="hover:bg-neutral-lightest/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-textPrimary">{result.ipAddress}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{result.likelyProvider}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidencePillClass(result.confidence)}`}>
                                            {result.confidence}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-textSecondary max-w-md">{result.reasoning}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VoIPAppIdentificationView;
