"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Save, Upload, ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react";
import CanvasOverlay from "@/components/CanvasOverlay";
import { useCanvasEditor } from "@/../hooks/useCanvasEditor";
import SiteLogo from "@/components/SiteLogo";

export default function TemplateEditorPage() {
  const router = useRouter();
  const {
    canvasRef,
    zoom,
    setZoom,
    snapLineY,
    setSnapLineY,
    drawGrid,
    drawSnapLine,
  } = useCanvasEditor();

  const [fields, setFields] = useState<any[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [selection, setSelection] = useState<any | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState<any | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);

  const width = 800;
  const height = 1000;

  const saveHistory = (next: any[]) => {
    setHistory((prev) => [...prev.slice(-19), fields]);
    setRedoStack([]);
    setFields(next);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRedoStack((r) => [fields, ...r]);
    setFields(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(redoStack.slice(1));
    setHistory((h) => [...h, fields]);
    setFields(next);
  };

  useEffect(() => {
    const selected = localStorage.getItem("selectedClient") || "";
    setSelectedClient(selected);
    setBackgroundImage(`http://localhost:8000/exports/${selected}.png`);
    const loadExisting = localStorage.getItem("loadExistingTemplate") === "true";
    if (loadExisting && selected) {
      fetch(`http://localhost:8000/exports/${selected}.json`)
        .then((res) => res.json())
        .then((data) => setFields(Array.isArray(data) ? data : []))
        .catch(() => console.error("Failed to load template"));
      localStorage.removeItem("loadExistingTemplate");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const lib = await import("pdfjs-dist/build/pdf");
      lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      setPdfjsLib(lib);
    })();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result instanceof ArrayBuffer) {
          const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
          const page = await pdf.getPage(1);
          setPdfPage(page);
          drawOverlay(page);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setPdfPage(null);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = url;
    }
  };

  const drawOverlay = async (page = pdfPage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (page) {
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx!, viewport }).promise;
    } else if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        drawFieldsAndSelection(ctx);
      };
      img.src = backgroundImage;
      return;
    }

    drawFieldsAndSelection(ctx);
  };

  const drawFieldsAndSelection = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return;
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    fields.forEach(f => ctx.strokeRect(f.x, f.y, f.width, f.height));
    if (selection) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
    }
  };

  useEffect(() => { drawOverlay(); }, [fields, selection, pdfPage, backgroundImage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode || !isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelection({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
    });
  };

  const handleMouseUp = () => {
    if (!drawMode) return;
    setIsDrawing(false);
  };

  const confirmSelection = () => {
    if (!selection || !newFieldName.trim()) return;
    const updated = [...fields];
    const fieldData = { ...selection, name: newFieldName, type: newFieldType };
    if (editIndex !== null) updated[editIndex] = fieldData;
    else updated.push(fieldData);
    saveHistory(updated);
    setSelection(null);
    setNewFieldName("");
    setNewFieldType("text");
    setEditIndex(null);
  };

  const saveTemplate = async () => {
    const imageBase64 = canvasRef.current?.toDataURL("image/png");
    const payload = {
      client: selectedClient,
      fields,
      image: imageBase64,
    };
    const res = await fetch("http://localhost:8000/api/save-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Template saved: " + data.saved_to);
      router.push("/home");
    } else {
      alert("Error: " + (data.error || "Unknown"));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <SiteLogo />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Template Editor: {selectedClient}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setDrawMode(!drawMode)} variant={drawMode ? "default" : "outline"}>
            {drawMode ? "Draw Mode: ON" : "Draw Mode: OFF"}
          </Button>
          <Button onClick={() => setZoom(zoom + 0.1)}><ZoomIn size={16} /></Button>
          <Button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><ZoomOut size={16} /></Button>
          <Button onClick={handleUndo}><Undo2 size={16} /></Button>
          <Button onClick={handleRedo}><Redo2 size={16} /></Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/home")}>Back to Home</Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">1. Upload document. 2. Select field. 3. Name it and set type. 4. Save.</div>

      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-4">
          <label className="text-sm font-medium flex items-center gap-2">
            <Upload size={16} /> Upload PDF / Image
            <Input type="file" accept="application/pdf,image/*" onChange={handleImageUpload} />
          </label>

          <div className="relative border">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              width={width}
              height={height}
              className="relative z-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input placeholder="Field name" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
            <Select value={newFieldType} onValueChange={setNewFieldType}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={confirmSelection}><Save size={16} className="mr-1" /> Save Field</Button>
          </div>
        </div>

        <div className="w-full border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Fields</h2>
          <table className="table-auto w-full text-sm">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Type</th><th>X</th><th>Y</th><th>W</th><th>H</th><th></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={i} className="border-t">
                  <td>{i + 1}</td>
                  <td>
                    <Input value={f.name} onChange={(e) => {
                      const copy = [...fields];
                      copy[i].name = e.target.value;
                      setFields(copy);
                    }} />
                  </td>
                  <td>{f.type}</td>
                  <td>{f.x}</td><td>{f.y}</td><td>{f.width}</td><td>{f.height}</td>
                  <td className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setSelection({ x: f.x, y: f.y, width: f.width, height: f.height });
                      setNewFieldName(f.name);
                      setNewFieldType(f.type);
                      setEditIndex(i);
                    }}><Pencil size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      const copy = [...fields];
                      copy.splice(i, 1);
                      saveHistory(copy);
                    }}><Trash2 size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save size={16} className="mr-2" /> Save Template
        </Button>
      </div>
    </div>
  );
}
