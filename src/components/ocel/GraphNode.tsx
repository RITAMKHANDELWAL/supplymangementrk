import { Handle, Position, type NodeProps } from "reactflow";
import { getObjTypeMeta, type ObjType } from "@/lib/ocelGraph";
import { useTheme } from "@/lib/theme";

export interface GraphNodeData {
  label: string;
  type: ObjType;
  status: string;
  risk: number;
  criticality: "A" | "B" | "C";
  lastUpdate: string;
  highlight?: "path" | "focus" | "root" | null;
}

export function GraphNode({ data }: NodeProps<GraphNodeData>) {
  const { theme } = useTheme();
  const meta = getObjTypeMeta(theme)[data.type];
  const ring =
    data.highlight === "focus" ? "ring-2 ring-primary [box-shadow:var(--glow-gold)]" :
    data.highlight === "path"  ? "ring-2 ring-accent" :
    data.highlight === "root"  ? "ring-2 ring-destructive" : "ring-1 ring-border";
  const riskTone = data.risk > 75 ? "text-destructive" : data.risk > 45 ? "text-primary" : "text-success";
  return (
    <div className={`bg-card/90 backdrop-blur rounded-md ${ring} px-2.5 py-2 min-w-[150px] max-w-[170px]`}>
      <Handle type="target" position={Position.Left} className="!bg-primary/60 !w-1.5 !h-1.5 !border-0" />
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: meta.color }}>{meta.label}</span>
        <span className={`text-[9px] font-mono ${riskTone}`}>{data.risk}</span>
      </div>
      <div className="font-mono text-[11px] mt-1 truncate">{data.label}</div>
      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-muted-foreground font-mono">
        <span className="px-1 rounded border border-border">{data.criticality}</span>
        <span className="truncate">{data.status}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary/60 !w-1.5 !h-1.5 !border-0" />
    </div>
  );
}