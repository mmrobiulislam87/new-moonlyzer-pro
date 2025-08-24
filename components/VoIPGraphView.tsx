import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { Share2, Info, ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { VoIPGraphData, GraphNode, GraphEdge } from '../types';

interface TooltipInfo {
  visible: boolean;
  content: React.ReactNode | string;
  x: number;
  y: number;
}

const VoIPGraphView: React.FC = () => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const activeLayoutRef = useRef<cytoscape.Layouts | null>(null);
  const { voipGraphData, isLoading } = useVoIPContext();
  const [tooltip, setTooltip] = useState<TooltipInfo>({ visible: false, content: '', x: 0, y: 0 });

  const layoutOptions = useMemo(() => ({
    name: 'cose',
    idealEdgeLength: () => 150,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 50,
    componentSpacing: 100,
    nodeRepulsion: () => 450000,
    edgeElasticity: () => 100,
    gravity: 80,
    numIter: 1000,
    animate: true,
    animationDuration: 500,
  }), []);

  const runLayout = useCallback(() => {
    if (cyRef.current) {
       if (activeLayoutRef.current && typeof activeLayoutRef.current.stop === 'function') {
        activeLayoutRef.current.stop();
      }
      const layout = cyRef.current.layout(layoutOptions);
      activeLayoutRef.current = layout;
      layout.run();
    }
  }, [layoutOptions]);

  useEffect(() => {
    if (!graphContainerRef.current) return;
    const cyInstance = cytoscape({
      container: graphContainerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1', // Indigo
            'border-color': '#4338ca', // Darker Indigo
            'border-width': 2,
            'label': 'data(id)',
            'width': (ele: cytoscape.NodeSingular) => Math.max(25, Math.min(60, (ele.data('callCount') || 1) * 2 + 20)),
            'height': (ele: cytoscape.NodeSingular) => Math.max(25, Math.min(60, (ele.data('callCount') || 1) * 2 + 20)),
            'font-size': 9,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'color': '#374151',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: cytoscape.EdgeSingular) => Math.max(1.5, Math.min(8, (ele.data('callCount') || 1))),
            'line-color': '#a78bfa', // Violet
            'target-arrow-color': '#a78bfa',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            'curve-style': 'bezier',
          },
        },
        { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#f59e0b' } },
      ],
      layout: { name: 'preset' },
    });
    
    cyInstance.on('mouseover', 'node', (evt) => {
        const node = evt.target; const data = node.data();
        setTooltip({ visible: true, content: `Number: ${data.id}\nCalls: ${data.callCount}`, x: evt.renderedPosition.x + 10, y: evt.renderedPosition.y + 10 });
    });
    cyInstance.on('mouseout', 'node', () => setTooltip(prev => ({ ...prev, visible: false })));
    cyInstance.on('tap', (event) => { if (event.target === cyInstance) setTooltip(prev => ({ ...prev, visible: false })); });
    cyInstance.on('zoom pan', () => setTooltip(prev => ({ ...prev, visible: false })));

    cyRef.current = cyInstance;
    return () => cyInstance.destroy();
  }, []);

  useEffect(() => {
    if (cyRef.current && !isLoading) {
      cyRef.current.batch(() => {
        cyRef.current!.elements().remove();
        cyRef.current!.add([...voipGraphData.nodes, ...voipGraphData.edges]);
      });
      // Defer layout run to ensure container is sized correctly.
      Promise.resolve().then(() => {
        if(cyRef.current) {
          runLayout();
        }
      });
    }
  }, [voipGraphData, isLoading, runLayout]);

  if (voipGraphData.nodes.length === 0 && !isLoading) {
    return (
        <div className="p-6 bg-neutral-lightest border border-neutral-light rounded-lg text-center text-textSecondary flex flex-col items-center justify-center min-h-[200px] shadow-md">
            <Info size={28} className="mb-2 text-neutral-DEFAULT" />
            <p>No VoIP call data available to visualize the network.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-surface border border-neutral-light rounded-xl shadow-lg flex justify-between items-center">
        <h3 className="text-lg font-semibold text-textPrimary flex items-center">
          <Share2 size={22} className="mr-2 text-indigo-500" /> VoIP Call Network
        </h3>
        <div className="flex gap-2">
            <button onClick={() => cyRef.current?.fit(undefined, 50)} title="Fit to View" className="p-2 bg-neutral-lighter hover:bg-neutral-light rounded-lg text-neutral-darker shadow-sm"><ZoomIn size={16}/></button>
            <button onClick={runLayout} title="Re-run Layout" className="p-2 bg-neutral-lighter hover:bg-neutral-light rounded-lg text-indigo-600 shadow-sm"><RefreshCw size={16}/></button>
        </div>
      </div>
      <div ref={graphContainerRef} className="w-full h-[650px] border rounded-xl bg-neutral-lightest/40 shadow-inner" />
      {tooltip.visible && (
        <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #d1d5db', padding: '6px 10px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10001, maxWidth: '300px', pointerEvents: 'none', fontSize: '12px' }} className="whitespace-pre-wrap">
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default VoIPGraphView;