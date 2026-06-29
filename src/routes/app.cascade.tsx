import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactFlow, { Background, BackgroundVariant, Controls, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { ArrowRight } from "lucide-react";
import { PageHeader, Kpi, SeverityBadge } from "@/components/Kpi";
import { GraphNode, type GraphNodeData } from "@/components/ocel/GraphNode";
import { computeCascade } from "@/lib/cascade";
import { db, matBy } from "@/lib/mockData";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/app/cascade")({ component: CascadePage });

const nodeTypes = { ocel: GraphNode };

function CascadePage() {
  const { theme } = useTheme();
  const [shortageId, setShortageId] = useState<string>(db.shortages[0]?.id ?? "");
  const result = useMemo(() => computeCascade(shortageId), [shortageId]);
  const criticalSet = useMemo(() => new Set(result.criticalPath.map((n) => n.id)), [result]);

  // Edge/background colors resolved from CSS vars so they track the active theme
  const edgeColors = useMemo(() => {
    if (typeof window === "undefined") return { label: "#888", critical: "#e11", normal: "#c90", marker: "#c90", bg: "#333" };
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string) => cs.getPropertyValue(name).trim();
    return {
      label: v("--muted-foreground"),
      critical: v("--destructive"),
      normal: `color-mix(in oklch, ${v("--primary")} 45%, transparent)`,
      marker: `color-mix(in oklch, ${v("--primary")} 65%, transparent)`,
      bg: `color-mix(in oklch, ${v("--border")} 70%, transparent)`,
    };
  }, [theme]);

  const { rfNodes, rfEdges } = useMemo(() => {
    const rfNodes: Node<GraphNodeData>[] = [];
    result.layers.forEach((layer, depth) => {
      layer.slice(0, 14).forEach((n, ri) => {
        rfNodes.push({
          id: n.id, type: "ocel",
          position: { x: depth * 230, y: ri * 96 },
          data: {
            label: n.label, type: n.type, status: n.status, risk: n.risk,
            criticality: n.criticality, lastUpdate: n.lastUpdate,
            highlight: n.id === shortageId ? "focus" : criticalSet.has(n.id) ? "path" : null,
          },
        });
      });
    });
    const allowed = new Set(rfNodes.map((n) => n.id));
    const rfEdges: Edge[] = result.edges.filter((e) => allowed.has(e.source) && allowed.has(e.target)).map((e) => ({
      id: e.id, source: e.source, target: e.target, label: e.relation,
      labelStyle: { fontSize: 8, fill: edgeColors.label },
      style: { stroke: criticalSet.has(e.source) && criticalSet.has(e.target) ? edgeColors.critical : edgeColors.normal,
               strokeWidth: criticalSet.has(e.source) && criticalSet.has(e.target) ? 2.5 : 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.marker },
    }));
    return { rfNodes, rfEdges };
  }, [result, criticalSet, shortageId, edgeColors]);

  return (
    <div>
      <PageHeader title="Shortage Cascade Intelligence"
        subtitle="Weighted BFS propagation across the OCEL graph · supplier → PO → material → production → delivery"
        actions={
          <select value={shortageId} onChange={(e) => setShortageId(e.target.value)}
            className="h-8 px-2 bg-input border border-border rounded text-xs font-mono">
            {db.shortages.map((s) => {
              const m = matBy(s.materialId)!;
              return <option key={s.id} value={s.id}>{s.id} · {m.sku} · {s.severity}</option>;
            })}
          </select>
        } />

      <div className="grid grid-cols-6 gap-3 mb-4">
        <Kpi label="Cascade Depth" value={result.depth} sub="propagation levels" tone="warning" />
        <Kpi label="Cascade Width" value={result.width} sub="max layer size" />
        <Kpi label="Risk Score" value={result.riskScore} sub={<><SeverityBadge severity={result.riskScore > 75 ? "critical" : result.riskScore > 50 ? "high" : "medium"} /></>} tone="critical" />
        <Kpi label="Financial Impact" value={`$${(result.financialImpact / 1000).toFixed(0)}k`} sub="cumulative exposure" tone="critical" />
        <Kpi label="Recovery" value={`${result.recoveryDays}d`} sub="estimated" />
        <Kpi label="Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} sub="propagation model" tone="info" />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 panel p-0 overflow-hidden" style={{ height: 520 }}>
          <div className="border-b border-border px-3 py-2 flex items-center justify-between">
            <span className="tech-label">Propagation Graph · layered DAG</span>
            <span className="text-[10px] font-mono text-muted-foreground">{result.affected.length} affected objects</span>
          </div>
          <ReactFlow nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes}
            fitView minZoom={0.2} maxZoom={1.5} proOptions={{ hideAttribution: true }}>
            <Background color={edgeColors.bg} gap={28} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-card !border-border" />
          </ReactFlow>
        </div>

        <div className="col-span-4 space-y-3">
          <div className="panel p-4">
            <div className="tech-label mb-2">Critical Path</div>
            <div className="flex flex-col gap-1.5">
              {result.criticalPath.map((n, i) => (
                <div key={n.id} className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground w-5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-primary truncate">{n.label}</span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider text-muted-foreground">{n.type}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <div className="tech-label mb-2">AI Explanation</div>
            <ul className="text-[11px] space-y-1.5 text-foreground/85 leading-relaxed">
              {result.explanation.map((e, i) => (
                <li key={i} className="flex gap-1.5"><ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" /><span>{e}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
