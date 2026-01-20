'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function KnowledgeGraph({ tenantId, projectId, initialDocId = null }) {
  const router = useRouter();
  const networkRef = useRef(null);
  const containerRef = useRef(null);
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterTypes, setFilterTypes] = useState({
    document: true,
    epic: true,
    feature: true,
    card: true,
    testcase: true,
    testrun: true,
    commit: true,
    pr: true,
    figmaComponent: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Color mapping for different artifact types
  const typeColors = {
    document: '#8b5cf6', // purple
    epic: '#f59e0b', // amber
    feature: '#ec4899', // pink
    card: '#10b981', // emerald
    testcase: '#3b82f6', // blue
    testrun: '#06b6d4', // cyan
    commit: '#6366f1', // indigo
    pr: '#14b8a6', // teal
    figmaComponent: '#f97316', // orange
  };

  const typeIcons = {
    document: '📄',
    epic: '🎯',
    feature: '✨',
    card: '📋',
    testcase: '🧪',
    testrun: '✅',
    commit: '💾',
    pr: '🔀',
    figmaComponent: '🎨',
  };

  // Load all DocLinks for the tenant/project
  useEffect(() => {
    if (!tenantId) return;

    const loadGraphData = async () => {
      setLoading(true);
      try {
        const linksRef = collection(db, 'stea_doc_links');
        let linksQuery = query(linksRef, where('tenantId', '==', tenantId));
        
        if (projectId) {
          // If projectId provided, filter by project
          // Note: DocLinks might not have projectId, so we'll load all and filter by artifact projectId
        }

        const linksSnapshot = await getDocs(linksQuery);
        const links = [];
        linksSnapshot.forEach((doc) => {
          links.push({ id: doc.id, ...doc.data() });
        });

        // Build nodes and edges
        const nodeMap = new Map();
        const edgeList = [];

        // First pass: collect all unique node IDs
        const nodeIds = new Set();
        links.forEach(link => {
          nodeIds.add(`${link.fromType}:${link.fromId}`);
          nodeIds.add(`${link.toType}:${link.toId}`);
        });

        // Load all node labels in parallel
        const labelPromises = Array.from(nodeIds).map(async (nodeId) => {
          const [type, id] = nodeId.split(':');
          const label = await getNodeLabel(type, id);
          return { nodeId, label, type, id };
        });

        const nodeLabels = await Promise.all(labelPromises);
        const labelMap = new Map(nodeLabels.map(n => [n.nodeId, n]));

        // Second pass: build nodes and edges
        links.forEach(link => {
          const fromNodeId = `${link.fromType}:${link.fromId}`;
          const toNodeId = `${link.toType}:${link.toId}`;

          // Add "from" node
          if (!nodeMap.has(fromNodeId)) {
            const labelData = labelMap.get(fromNodeId);
            nodeMap.set(fromNodeId, {
              id: fromNodeId,
              label: labelData?.label || `${link.fromType} ${link.fromId.slice(0, 8)}`,
              type: link.fromType,
              artifactId: link.fromId,
              color: typeColors[link.fromType] || '#6b7280',
              shape: 'dot',
              size: getNodeSize(link.fromType),
            });
          }

          // Add "to" node
          if (!nodeMap.has(toNodeId)) {
            const labelData = labelMap.get(toNodeId);
            nodeMap.set(toNodeId, {
              id: toNodeId,
              label: labelData?.label || `${link.toType} ${link.toId.slice(0, 8)}`,
              type: link.toType,
              artifactId: link.toId,
              color: typeColors[link.toType] || '#6b7280',
              shape: 'dot',
              size: getNodeSize(link.toType),
            });
          }

          // Add edge
          edgeList.push({
            id: link.id,
            from: fromNodeId,
            to: toNodeId,
            label: link.relation || '',
            arrows: 'to',
            color: { color: '#94a3b8', highlight: '#3b82f6' },
            width: 2,
          });
        });

        // If initialDocId provided, start with that document and its connections
        if (initialDocId) {
          const initialNodeId = `document:${initialDocId}`;
          if (nodeMap.has(initialNodeId)) {
            // Highlight initial node
            const initialNode = nodeMap.get(initialNodeId);
            initialNode.color = { background: '#8b5cf6', border: '#6d28d9' };
            initialNode.size = 25;
          }
        }

        setNodes(Array.from(nodeMap.values()));
        setEdges(edgeList);
      } catch (error) {
        console.error('Error loading graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGraphData();
  }, [tenantId, projectId, initialDocId]);

  // Get node label from artifact
  const getNodeLabel = async (type, id) => {
    try {
      switch (type) {
        case 'document':
          const docRef = doc(db, 'stea_docs', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data().title || `Doc ${id.slice(0, 8)}`;
          }
          return `Doc ${id.slice(0, 8)}`;
        
        case 'epic':
          const epicRef = doc(db, 'stea_epics', id);
          const epicSnap = await getDoc(epicRef);
          if (epicSnap.exists()) {
            return epicSnap.data().name || `Epic ${id.slice(0, 8)}`;
          }
          return `Epic ${id.slice(0, 8)}`;
        
        case 'feature':
          const featureRef = doc(db, 'stea_features', id);
          const featureSnap = await getDoc(featureRef);
          if (featureSnap.exists()) {
            return featureSnap.data().name || `Feature ${id.slice(0, 8)}`;
          }
          return `Feature ${id.slice(0, 8)}`;
        
        case 'card':
          const cardRef = doc(db, 'stea_cards', id);
          const cardSnap = await getDoc(cardRef);
          if (cardSnap.exists()) {
            return cardSnap.data().title || `Card ${id.slice(0, 8)}`;
          }
          return `Card ${id.slice(0, 8)}`;
        
        default:
          return `${type} ${id.slice(0, 8)}`;
      }
    } catch (error) {
      console.error(`Error loading ${type} label:`, error);
      return `${type} ${id.slice(0, 8)}`;
    }
  };

  const getNodeSize = (type) => {
    const sizes = {
      document: 20,
      epic: 18,
      feature: 16,
      card: 14,
      testcase: 14,
      testrun: 14,
      commit: 12,
      pr: 12,
      figmaComponent: 14,
    };
    return sizes[type] || 12;
  };

  const handleNodeClick = useCallback((node) => {
    const { type, artifactId } = node;
    
    switch (type) {
      case 'document':
        router.push(`/apps/stea/ruby?doc=${artifactId}`);
        break;
      case 'epic':
      case 'feature':
      case 'card':
        router.push(`/apps/stea/filo?${type}=${artifactId}`);
        break;
      case 'testcase':
      case 'testrun':
        router.push(`/apps/stea/hans?test=${artifactId}`);
        break;
      default:
        // For other types, could open in new tab or show details
        console.log(`Navigate to ${type}:${artifactId}`);
    }
  }, [router]);

  // Initialize vis-network
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    if (typeof window === 'undefined') return; // Skip SSR

    // Dynamically import vis-network
    let networkInstance = null;
    const loadNetwork = async () => {
      try {
        const visNetworkModule = await import('vis-network');
        const { Network: VisNetwork } = visNetworkModule;
        
        const filteredNodes = nodes.filter(node => filterTypes[node.type]);
        const filteredEdges = edges.filter(edge => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          return fromNode && toNode && filterTypes[fromNode.type] && filterTypes[toNode.type];
        });

        const data = {
          nodes: filteredNodes,
          edges: filteredEdges,
        };

        const options = {
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: {
              size: 14,
              face: 'system-ui',
            },
          },
          edges: {
            width: 2,
            smooth: {
              type: 'continuous',
            },
            font: {
              size: 12,
              align: 'middle',
            },
          },
          physics: {
            enabled: true,
            stabilization: {
              iterations: 200,
            },
            barnesHut: {
              gravitationalConstant: -2000,
              centralGravity: 0.3,
              springLength: 95,
              springConstant: 0.04,
              damping: 0.09,
            },
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
            zoomView: true,
            dragView: true,
          },
        };

        networkInstance = new VisNetwork(containerRef.current, data, options);

        // Event handlers
        networkInstance.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              setSelectedNode(node);
              handleNodeClick(node);
            }
          } else {
            setSelectedNode(null);
          }
        });

        networkInstance.on('hoverNode', (params) => {
          // Highlight connected nodes
          const nodeId = params.node;
          const connectedNodeIds = new Set();
          
          edges.forEach(edge => {
            if (edge.from === nodeId) connectedNodeIds.add(edge.to);
            if (edge.to === nodeId) connectedNodeIds.add(edge.from);
          });

          // Update node colors
          const updatedNodes = filteredNodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, color: { background: node.color, border: '#000', borderWidth: 3 } };
            }
            if (connectedNodeIds.has(node.id)) {
              return { ...node, color: { background: node.color, border: '#3b82f6', borderWidth: 2 } };
            }
            return node;
          });

          networkInstance.setData({ nodes: updatedNodes, edges: filteredEdges });
        });

        networkInstance.on('blurNode', () => {
          // Reset colors
          networkInstance.setData({ nodes: filteredNodes, edges: filteredEdges });
        });

        networkRef.current = networkInstance;
      } catch (error) {
        console.error('Error loading vis-network:', error);
      }
    };

    loadNetwork();

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [nodes, edges, filterTypes, handleNodeClick]);

  const filteredNodes = nodes.filter(node => {
    if (!filterTypes[node.type]) return false;
    if (searchQuery) {
      return node.label.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const filteredEdges = edges.filter(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    return fromNode && toNode && filterTypes[fromNode.type] && filterTypes[toNode.type];
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-600">Loading knowledge graph...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="border-b border-neutral-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">Filter:</span>
            {Object.keys(filterTypes).map(type => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterTypes[type]}
                  onChange={(e) => setFilterTypes({ ...filterTypes, [type]: e.target.checked })}
                  className="rounded border-neutral-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm text-neutral-600 capitalize">{typeIcons[type]} {type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span>{filteredNodes.length} nodes</span>
          <span>{filteredEdges.length} connections</span>
          {selectedNode && (
            <span className="text-rose-600">
              Selected: {selectedNode.label} ({selectedNode.type})
            </span>
          )}
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 relative bg-neutral-50">
        <div ref={containerRef} className="h-full w-full" />
        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-4xl">🔗</div>
              <p className="text-neutral-600">No connections found</p>
              <p className="mt-1 text-sm text-neutral-500">
                Create DocLinks between documents and artifacts to see the graph
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-neutral-200 bg-neutral-50 p-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          <span className="font-medium">Legend:</span>
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

