import React, { useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { X, Sparkles, Loader2, AlertTriangle, UserSearch, Users, GitMerge, Lightbulb } from 'lucide-react';
import { GraphData, SNAInsightsResponse } from '../types';

interface SNAInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData;
  cyRef: React.MutableRefObject<cytoscape.Core | null>;
}

const SNAInsightsPanel: React.FC<SNAInsightsPanelProps> = ({ isOpen, onClose, graphData, cyRef }) => {
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<SNAInsightsResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleAnalysis = useCallback(async (analysisType: 'leaders' | 'communities' | 'custom') => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiResults(null);
    
    // Create a simplified, summarized version of the graph data for the AI
    const summarizedGraph = {
      nodes: graphData.nodes.map(n => ({
        id: n.data.id,
        totalInteractions: n.data.callCount || 0,
        outgoing: n.data.outgoingCalls || 0,
        incoming: n.data.incomingCalls || 0,
      })),
      edges: graphData.edges.map(e => ({
        source: e.data.source,
        target: e.data.target,
        interactions: e.data.callCount || 0,
      })),
    };
    
    let userPrompt: string;
    let responseSchema: any;

    if (analysisType === 'leaders') {
        userPrompt = "Based on the provided network graph data, identify the top 3-5 key influencers or leaders. Consider nodes with high total interactions, a high number of unique connections (degree), and those acting as central hubs. For each leader, provide a score from 0 to 1 and a brief reason for your selection.";
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                leaders: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            nodeId: { type: Type.STRING, description: "The ID of the leader node." },
                            reason: { type: Type.STRING, description: "Justification for why this node is a leader." },
                            score: { type: Type.NUMBER, description: "A confidence score from 0 to 1." }
                        },
                        required: ["nodeId", "reason", "score"]
                    }
                }
            }
        };
    } else if (analysisType === 'communities') {
        userPrompt = "Analyze the network graph to detect distinct communities or clusters. A community is a group of nodes that are more densely connected to each other than to the rest of the network. List the members of each significant community you identify.";
         responseSchema = {
            type: Type.OBJECT,
            properties: {
                communities: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            communityId: { type: Type.INTEGER, description: "A unique ID for the community." },
                            members: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of node IDs in this community." },
                            description: { type: Type.STRING, description: "A brief description of the community's characteristics." }
                        },
                         required: ["communityId", "members", "description"]
                    }
                }
            }
        };
    } else { // custom
        if (!customQuery.trim()) {
            setAiError("Please enter a custom query.");
            setIsLoadingAI(false);
            return;
        }
        userPrompt = customQuery;
        // For custom queries, we expect a more general response.
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A summary of the findings." },
                keyEntities: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            nodeId: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["nodeId", "reason"]
                    },
                    description: "A list of key nodes related to the query and the reason for their relevance."
                }
            }
        };
    }

    const fullPrompt = `
      You are an expert in Social Network Analysis (SNA). I will provide you with a summarized graph representing a communication network.
      The data includes nodes (phone numbers) with their interaction counts, and edges (connections) with interaction counts.

      Your task is: ${userPrompt}

      Please provide your response in a structured JSON format that adheres to the provided schema.

      Here is the graph data:
      ${JSON.stringify(summarizedGraph, null, 2)}
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const parsedResult = JSON.parse(jsonStr) as SNAInsightsResponse;
      setAiResults(parsedResult);
    } catch (e: any) {
      console.error("Error calling Gemini API for SNA:", e);
      setAiError(`Failed to get AI insights: ${e.message || 'Unknown error'}. Check the console.`);
    } finally {
      setIsLoadingAI(false);
    }
  }, [graphData, customQuery, ai]);

  const handleHighlightNode = (nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    
    cy.elements().stop(true, true);
    cy.elements().removeClass('highlighted-by-ai');
    
    const node = cy.getElementById(nodeId);
    if (node.length > 0) {
      cy.animate({
        fit: {
          eles: node,
          padding: 150
        },
        duration: 500
      });
      node.addClass('highlighted-by-ai');
      node.flashClass('highlighted-by-ai', 1500);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-surface/95 backdrop-blur-sm shadow-2xl border-l border-neutral-light transition-transform duration-300 ease-in-out z-30 w-full max-w-sm flex flex-col ${
        isOpen ? 'transform translate-x-0' : 'transform translate-x-full'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sna-panel-title"
    >
      <div className="flex justify-between items-center p-4 border-b border-neutral-light flex-shrink-0">
        <h2 id="sna-panel-title" className="text-lg font-semibold text-primary-dark flex items-center">
          <Sparkles size={20} className="mr-2" />
          AI SNA Insights
        </h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-lighter transition-colors" aria-label="Close">
          <X size={20} className="text-neutral-DEFAULT" />
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-4">
          <div className="p-3 bg-neutral-lightest rounded-lg border border-neutral-light">
            <h3 className="text-sm font-medium text-textPrimary mb-2">Pre-defined Analysis</h3>
            <div className="flex gap-2">
              <button onClick={() => handleAnalysis('leaders')} disabled={isLoadingAI} className="flex-1 px-3 py-2 text-xs bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-60 flex items-center justify-center">
                <UserSearch size={14} className="mr-1.5"/> Find Key Influencers
              </button>
              <button onClick={() => handleAnalysis('communities')} disabled={isLoadingAI} className="flex-1 px-3 py-2 text-xs bg-secondary text-white rounded-md hover:bg-secondary-dark disabled:opacity-60 flex items-center justify-center">
                <Users size={14} className="mr-1.5"/> Detect Communities
              </button>
            </div>
          </div>
          <div className="p-3 bg-neutral-lightest rounded-lg border border-neutral-light">
             <h3 className="text-sm font-medium text-textPrimary mb-2">Custom Query</h3>
             <textarea value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} placeholder="Ask about the network, e.g., 'Are there any bridge nodes connecting different groups?'" rows={3} className="w-full text-xs p-2 border border-neutral-light rounded-md focus:ring-1 focus:ring-primary-light"></textarea>
             <button onClick={() => handleAnalysis('custom')} disabled={isLoadingAI || !customQuery.trim()} className="mt-2 w-full px-3 py-2 text-xs bg-accent text-white rounded-md hover:bg-accent-dark disabled:opacity-60 flex items-center justify-center">
                <Lightbulb size={14} className="mr-1.5"/> Submit Custom Query
            </button>
          </div>
        </div>

        <div className="mt-6">
          {isLoadingAI && (
            <div className="flex flex-col items-center justify-center text-center text-textSecondary p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm">AI is analyzing the network...</p>
            </div>
          )}
          {aiError && (
             <div className="p-3 bg-danger-lighter text-danger-darker rounded-lg border border-danger-light text-xs flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
                <div>
                    <p className="font-semibold">Analysis Failed</p>
                    <p>{aiError}</p>
                </div>
            </div>
          )}
          {aiResults && (
            <div className="space-y-4 text-xs">
              {aiResults.summary && (
                <div>
                  <h4 className="font-semibold text-textPrimary mb-1">Summary</h4>
                  <p className="p-2 bg-neutral-lightest rounded border">{aiResults.summary}</p>
                </div>
              )}
              {aiResults.leaders && aiResults.leaders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-textPrimary mb-1 flex items-center"><UserSearch size={14} className="mr-1.5"/>Key Influencers / Leaders</h4>
                  <ul className="space-y-1.5">
                    {aiResults.leaders.map((leader, idx) => (
                      <li key={`leader-${idx}`} className="p-2 bg-neutral-lightest rounded border border-neutral-light">
                        <button onClick={() => handleHighlightNode(leader.nodeId)} className="font-bold text-primary hover:underline w-full text-left">{leader.nodeId}</button>
                        <p className="text-neutral-dark italic mt-0.5">"{leader.reason}"</p>
                        <p className="text-[10px] text-textSecondary">Score: {leader.score?.toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResults.communities && aiResults.communities.length > 0 && (
                <div>
                   <h4 className="font-semibold text-textPrimary mb-1 flex items-center"><Users size={14} className="mr-1.5"/>Detected Communities</h4>
                   <ul className="space-y-1.5">
                    {aiResults.communities.map((community) => (
                      <li key={`comm-${community.communityId}`} className="p-2 bg-neutral-lightest rounded border border-neutral-light">
                        <p className="font-bold">Community {community.communityId}</p>
                        {community.description && <p className="text-neutral-dark italic mb-1">"{community.description}"</p>}
                        <div className="flex flex-wrap gap-1">
                          {community.members.map(member => (
                            <button key={member} onClick={() => handleHighlightNode(member)} className="text-[10px] bg-secondary-lighter/50 text-secondary-darker px-1.5 py-0.5 rounded hover:bg-secondary-lighter">{member}</button>
                          ))}
                        </div>
                      </li>
                    ))}
                   </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SNAInsightsPanel;
