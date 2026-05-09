"use client";

import React, { useState, useEffect } from "react";
import { AppConfig, ViewConfig } from "../../types";
import { apiClient } from "../../lib/api-client";
import { useAppStore } from "../../store/use-app-store";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2, ArrowUp, ArrowDown, FileText, Trash2, Edit2, AlertTriangle, FileJson2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DynamicTable({ view, config, locale, changeView }: { view: ViewConfig; config: AppConfig; locale: string; changeView?: (viewId: string) => void }) {
  const entityConfig = config.entities.find(e => e.name === view.entity);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(view.layout?.pageSize || 20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("asc");

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(
    entityConfig?.fields.filter(f => !f.hidden).map(f => f.name) || []
  ));

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ columns: string[], rows: any[], sessionId: string } | null>(null);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const t = useAppStore(s => s.getTranslation);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     setCsvFile(file);

     const formData = new FormData();
     formData.append("file", file);

     setIsImporting(true);
     try {
       const res = await apiClient.post(`/csv/upload/${config.app?.id || 'default'}/${entityConfig?.name || 'default'}`, formData, {
         headers: { "Content-Type": "multipart/form-data" }
       });
       setCsvPreview({
          sessionId: res.data.sessionId,
          columns: res.data.columns,
          rows: res.data.preview
       });
       
       // Autocreate mappings
       const initialMapping: Record<string, string> = {};
       res.data.columns.forEach((col: string) => {
          const match = entityConfig?.fields.find(f => f.name.toLowerCase() === col.toLowerCase() || (f.label && f.label.toLowerCase() === col.toLowerCase()));
          if (match) {
             initialMapping[col] = match.name;
          }
       });
       setCsvMapping(initialMapping);
     } catch (err: any) {
       toast.error(err.response?.data?.error || "Failed to upload CSV");
     } finally {
       setIsImporting(false);
     }
  };

  const executeCsvImport = async () => {
      if (!csvPreview || !entityConfig) return;
      setIsImporting(true);

      const mappingPayload = Object.entries(csvMapping).map(([csvColumn, entityField]) => ({ csvColumn, entityField }));

      try {
        const res = await apiClient.post(`/csv/import/${config.app?.id || 'default'}/${entityConfig?.name || 'default'}`, {
           sessionId: csvPreview.sessionId,
           columnMapping: mappingPayload
        });
        
        toast.success(`Imported ${res.data.imported} records. Skipped ${res.data.skipped}.`);
        setImportDialogOpen(false);
        setCsvFile(null);
        setCsvPreview(null);
        setCsvMapping({});
        await refetch();
      } catch (err: any) {
         toast.error(err.response?.data?.error || "Import failed");
      } finally {
         setIsImporting(false);
      }
  };

  const appId = config.app?.id || 'default';
  const entity = entityConfig?.name || 'default';
  const isActiveTab = true;
  const {
    data: recordsResponse,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["records", appId, entity, page, limit, debouncedSearch, sortField, sortOrder],
    queryFn: async () => {
      if (!entityConfig) return { data: [], totalPages: 1, total: 0 };
      const res = await apiClient.get(`/dynamic/${appId}/${entity}`, {
        params: { page, limit, search: debouncedSearch, sort: sortField, order: sortOrder }
      });

      return {
        data: res.data.data || [],
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
      };
    },
    enabled: !!appId && !!entity && isActiveTab,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const records: any[] = recordsResponse?.data || [];
  const totalPageCount = recordsResponse?.totalPages || 1;
  const totalRecords = recordsResponse?.total || 0;

  const errObj: any = queryError;
  const error = queryError
    ? errObj?.response?.status === 404
      ? "Table not found. Please apply configuration first."
      : errObj?.message || "Failed to load data"
    : null;

  if (!entityConfig) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-[8px] border border-[#d7b56d]/50 bg-[#fff8e4] p-5 text-center">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-[#9a5b3f]" />
          <div className="text-sm font-semibold text-foreground">Entity not found</div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            This table points to an entity that is not present in the current config.
          </p>
        </div>
      </div>
    );
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else { setSortField(""); setSortOrder("asc"); } // tri-state
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleDelete = (id: string) => {
     setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
      if (!deleteConfirmId) return;
      setIsDeleting(true);
      try {
          await apiClient.delete(`/dynamic/${config.app?.id || 'default'}/${entityConfig?.name || 'default'}/${deleteConfirmId}`);
          await refetch();
          setDeleteConfirmId(null);
          toast.success("Record deleted successfully");
      } catch(e) {
          toast.error(t("error") || "Delete failed");
      } finally {
          setIsDeleting(false);
      }
  };

  if (error) {
    // If 500, table just does not exist yet - show empty
    const is500 = errObj?.response?.status === 500 || 
                  errObj?.message?.includes('500') ||
                  error.includes('500') ||
                  error.includes('Table not found');
    
    if (is500) {
      return (
        <div className="flex h-full min-h-72 items-center justify-center p-6">
          <div className="max-w-sm rounded-[8px] border border-border bg-white p-6 text-center shadow-sm">
            <FileJson2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/45" />
            <div className="text-sm font-semibold text-foreground">No records yet</div>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              Submit a form or apply the configuration to create the first table records.
            </p>
          </div>
        </div>
      )
    }
    
    // Real errors show the error message
    return (
      <div className="flex h-full min-h-72 items-center justify-center p-6">
        <div className="max-w-sm rounded-[8px] border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-red-600" />
          <div className="text-sm font-semibold text-red-800">Error loading data</div>
          <p className="mt-2 text-[13px] leading-6 text-red-700/80">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 bg-white" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Column definitions
  const columns = entityConfig?.fields?.filter(f => visibleColumns.has(f.name)) ?? [];
  const safeRecords = (records ?? []).filter(Boolean);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-border bg-white shadow-sm shadow-black/[0.03]">
       {/* Toolbar */}
       <div className="flex flex-col gap-3 border-b border-border bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-foreground">{view.title}</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {entityConfig.label || entityConfig.name} / {totalRecords} records
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
             {view.layout?.showSearch !== false && (
                <div className="relative min-w-0">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input 
                      type="text" 
                      placeholder={`Search ${(entityConfig.label || entityConfig.name).toLowerCase()}...`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-9 w-full bg-[#fbfaf7] pl-9 text-[13px] sm:w-72"
                   />
                </div>
             )}
             
             {view.actions?.map(action => {
                 if (action.type === 'create') {
                     return (
                         <Button key={action.label} size="sm" className="h-8" onClick={() => {
                             if (changeView) {
                               const formView = config.views.find(v => v.entity === entityConfig?.name && v.type === 'form');
                               if (formView) changeView(formView.id);
                               else toast.error("No corresponding form view found for this entity.");
                             }
                         }}>
                             <Plus className="w-4 h-4 mr-1.5" />
                             {t(action.label) || action.label}
                         </Button>
                     );
                 }
                 if (action.type === 'import_csv') {
                     return (
                         <Button key={action.label} variant="outline" size="sm" className="h-8 bg-white" onClick={() => setImportDialogOpen(true)}>
                             <FileText className="w-4 h-4 mr-1.5" />
                             {t(action.label) || action.label}
                         </Button>
                     );
                 }
                 return null;
             })}
          </div>
       </div>

       {/* Table Area */}
       <div className="smooth-scroll flex-1 overflow-auto bg-white">
          {loading && (!records || records.length === 0) ? (
             <div className="flex h-full w-full flex-col gap-2 p-4">
                {[...Array(6)].map((_, i) => <div key={i} className="soft-skeleton h-12 w-full rounded border border-border" />)}
             </div>
          ) : (!records || records.length === 0) ? (
             <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
                 <FileJson2 className="mb-4 h-12 w-12 text-muted-foreground/35" />
                 <p className="mb-1 text-[15px] font-semibold text-foreground">No {entityConfig.label || entityConfig.name} records yet</p>
                 <p className="mb-5 max-w-sm text-[13px] leading-6 text-muted-foreground">Start by adding a new record or importing a CSV file.</p>
                 <div className="flex flex-wrap justify-center gap-2">
                   {view.actions?.filter(action => action.type === "create" || action.type === "import_csv").slice(0, 2).map(action => (
                     <Button
                       key={`empty-${action.label}`}
                       size="sm"
                       variant={action.type === "import_csv" ? "outline" : "default"}
                       onClick={() => {
                         if (action.type === "import_csv") {
                           setImportDialogOpen(true);
                           return;
                         }
                         if (changeView) {
                           const formView = config.views.find(v => v.entity === entityConfig?.name && v.type === "form");
                           if (formView) changeView(formView.id);
                           else toast.error("No corresponding form view found for this entity.");
                         }
                       }}
                     >
                       {action.type === "import_csv" ? <FileText className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                       {t(action.label) || action.label}
                     </Button>
                   ))}
                 </div>
             </div>
          ) : (
             <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 z-10 border-b border-border bg-[#f4f2ec]">
                     <tr>
                         {columns.map(col => (
                             <th 
                               key={col.name} 
                               onClick={() => handleSort(col.name)}
                               className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase text-muted-foreground hover:bg-[#efede7]"
                             >
                                 <div className="flex items-center">
                                    {col.label}
                                    {sortField === col.name && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                                 </div>
                             </th>
                         ))}
                         <th className="w-16 px-4 py-2.5"></th>
                     </tr>
                 </thead>
                 <tbody className="text-[13px]">
                     {safeRecords.map((row, index) => {
                       if (!row) return null;
                       return (
                         <tr key={row?.id ?? row?._id ?? index} className="group border-t border-border transition-colors hover:bg-[#fbfaf7]">
                             {columns?.map(col => {
                               if (!col) return null;
                               return (
                                 <td key={col?.name ?? index} className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2.5 text-foreground">
                                     {renderCell(col, row?.[col?.name])}
                                 </td>
                               );
                             })}
                             <td className="px-4 py-2.5 text-right opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                 <Button variant="ghost" size="icon" className="mr-1 h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleDelete(row?.id ?? row?._id ?? index)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                             </td>
                         </tr>
                       );
                     })}
                 </tbody>
             </table>
          )}
       </div>

      {/* Pagination */}
      {totalPageCount > 1 && (
           <div className="flex items-center justify-between border-t border-border bg-[#fbfaf7] px-4 py-3 text-[13px]">
                 <div className="text-muted-foreground">
                 Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalRecords)} of {totalRecords}
               </div>
               <div className="flex items-center space-x-2">
                   <Button 
                     variant="outline"
                     size="sm"
                     disabled={page <= 1}
                     onClick={() => setPage(p => p - 1)}
                   >
                       Prev
                   </Button>
                   <Button 
                     variant="outline"
                     size="sm"
                     disabled={page >= totalPageCount}
                     onClick={() => setPage(p => p + 1)}
                   >
                       Next
                   </Button>
               </div>
           </div>
       )}

       <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Record
              </Button>
            </div>
          </DialogContent>
       </Dialog>

       <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-[600px] overflow-auto border bg-background">
             <DialogHeader>
                <DialogTitle>Import CSV to {entityConfig.label}</DialogTitle>
             </DialogHeader>

             {!csvPreview ? (
                <div className="flex flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-border p-10 transition-colors hover:border-foreground/30">
                   <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                   <p className="text-sm font-medium mb-2">Upload a CSV file</p>
                   <p className="text-xs text-muted-foreground mb-6">Select a file from your computer to import data.</p>
                   <Input type="file" accept=".csv" onChange={handleFileUpload} disabled={isImporting} className="hidden" id="csv-upload" />
                   <label htmlFor="csv-upload" className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      {isImporting ? "Uploading..." : "Select File"}
                   </label>
                </div>
             ) : (
                <div className="space-y-6">
                   <div>
                       <h3 className="font-medium text-sm mb-2">Map CSV Columns to Entity Fields</h3>
                       <p className="text-xs text-muted-foreground mb-4">Select which CSV column corresponds to each field in your application.</p>
                   </div>
                   
                   <div className="space-y-3">
                      {entityConfig.fields.map(field => (
                          <div key={field.name} className="flex items-center justify-between rounded-[8px] border border-border p-2 text-sm">
                              <span className="font-medium w-1/3 truncate" title={field.label}>{field.label} {field.required ? "*" : ""}</span>
                              <div className="flex-1 max-w-[200px]">
                                 <select 
                                   className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                   value={Object.keys(csvMapping).find(k => csvMapping[k] === field.name) || ""}
                                   onChange={e => {
                                      const newVal = e.target.value;
                                      setCsvMapping(prev => {
                                         const clone = { ...prev };
                                         // remove existing mappings to this field
                                         Object.keys(clone).forEach(k => { if(clone[k] === field.name) delete clone[k]; });
                                         if (newVal) clone[newVal] = field.name;
                                         return clone;
                                      });
                                   }}
                                 >
                                    <option value="">-- Ignore --</option>
                                    {csvPreview.columns.map(col => (
                                       <option key={col} value={col}>{col}</option>
                                    ))}
                                 </select>
                              </div>
                          </div>
                      ))}
                   </div>

                   <p className="text-xs text-muted-foreground">Previewing first 5 rows</p>
                   <div className="max-h-[150px] overflow-x-auto rounded-[8px] border border-border">
                       <table className="w-full text-left text-xs">
                           <thead className="bg-muted">
                               <tr>
                                   {csvPreview.columns.map(c => <th key={c} className="p-2 whitespace-nowrap">{c}</th>)}
                               </tr>
                           </thead>
                           <tbody>
                               {(csvPreview.rows ?? []).filter(Boolean).map((row, idx) => (
                                   <tr key={row?.id ?? row?._id ?? idx} className="border-t">
                                      {csvPreview.columns.map(c => <td key={c} className="p-2 whitespace-nowrap truncate max-w-[150px]">{row[c]}</td>)}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>

                   <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => { setCsvPreview(null); setCsvFile(null); setCsvMapping({}); }}>Cancel</Button>
                      <Button onClick={executeCsvImport} disabled={isImporting}>
                         {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                         Import Data
                      </Button>
                   </div>
                </div>
             )}
          </DialogContent>
       </Dialog>
    </div>
  );
}

function renderCell(field: any, val: any) {
    if (val === undefined || val === null || val === "") return <span className="text-muted-foreground">-</span>;
    if (field.type === "boolean") {
        return val ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">YES</span> : <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">NO</span>;
    }
    if (field.type === "select") {
        return <span className="rounded border border-border bg-[#fbfaf7] px-2 py-0.5 text-[11px] font-medium shadow-sm">{String(val)}</span>;
    }
    if (field.type === "json") {
        return <span className="font-mono text-[11px] text-muted-foreground">{JSON.stringify(val).substring(0, 30)}...</span>;
    }
    if (field.type === "date" || field.type === "calendar") {
        return <span className="text-foreground">{new Date(val).toLocaleDateString()}</span>;
    }
    if (field.type === "file" || field.type === "upload") {
        return <span className="inline-block max-w-[150px] cursor-pointer truncate text-xs text-[#0f6b7a] underline">{typeof val === "string" ? val : "File attachment"}</span>;
    }
    if (field.type === "richtext" || field.type === "html") {
        return <span className="text-muted-foreground truncate max-w-[200px] inline-block text-xs" dangerouslySetInnerHTML={{ __html: String(val).substring(0, 40) + "..." }} />;
    }
    return <span className="text-foreground">{String(val)}</span>;
}
