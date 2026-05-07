"use client";

import React, { useState } from "react";
import { AppConfig, FieldConfig, PageConfig, ViewConfig } from "../../types";
import { apiClient } from "../../lib/api-client";
import { Loader2 } from "lucide-react";
import { useAppStore } from "../../store/use-app-store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function DynamicForm({ view, page, config }: { view: ViewConfig; page?: PageConfig; config: AppConfig; locale: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const t = useAppStore(s => s.getTranslation);

  // If entity is specified, try to get entity config for field validation
  const entityConfig = view.entity ? config.entities.find(e => e.name === view.entity) : null;
  const pageFields = Array.isArray(page?.fields) ? page.fields : [];

  const normalizeField = (field: FieldConfig | string): FieldConfig => {
    if (typeof field === "string") {
      return {
        name: field,
        label: field,
        type: "text",
      };
    }

    return field;
  };

  // Use entity fields if available, otherwise use view-defined fields
  let fieldsToRender = entityConfig
    ? entityConfig.fields.filter(f => !f.hidden)
    : pageFields.map(normalizeField).filter(f => !f.hidden);

  // If view specifies fields, filter by those
  if (view.fields && view.fields.length > 0 && entityConfig) {
    fieldsToRender = fieldsToRender.filter(f => view.fields!.includes(f.name));
  } else if (view.fields && view.fields.length > 0 && !entityConfig && pageFields.length > 0) {
    fieldsToRender = fieldsToRender.filter(f => view.fields!.includes(f.name));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSubmitted(false);

    // Basic Validation
    let hasErr = false;
    const newErrs: any = {};
    fieldsToRender.forEach(f => {
      if (f.required && !formData[f.name]) {
        newErrs[f.name] = "This field is required";
        hasErr = true;
      }
    });

    if (hasErr) {
       setErrors(newErrs);
       setLoading(false);
       return;
    }

    try {
      const endpoint = entityConfig
        ? `/dynamic/${config.app.id}/${entityConfig.name}`
        : `/forms/${config.app.id}/${page?.slug || view.id}`;

      console.log(`[DynamicForm] Submitting to ${endpoint}`, formData);
      
      const res = await apiClient.post(endpoint, entityConfig ? formData : { data: formData });
      console.log(`[DynamicForm] Response:`, res.data);
      
      if (entityConfig) {
        console.log(`[DynamicForm] Invalidating query cache for records`);
        await queryClient.invalidateQueries({ queryKey: ["records", config.app.id, entityConfig.name] });
        // Force a refetch immediately
        await queryClient.refetchQueries({ queryKey: ["records", config.app.id, entityConfig.name] });
      }
      
      toast.success(t("success") || "Record created successfully");
      setFormData({});
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e: any) {
      console.error(`[DynamicForm] Error:`, e);
      toast.error(t("error") || (e.response?.data?.message || "Failed to submit form"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, val: any) => {
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Card className="border shadow-sm">
        <div className="px-6 py-5 border-b bg-muted/20">
          <h2 className="text-xl font-semibold text-foreground">{view.title}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {submitted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-mono">
              ✓ Record submitted successfully
            </div>
          )}

          {fieldsToRender.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <span className="text-amber-600 text-lg mr-2">⚠</span>
              No fields to render. Please configure form fields in the page definition.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldsToRender.map(field => {
           let InputCmp = <Input type="text" value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} />;
           
           if (field.type === "textarea") {
               InputCmp = <Textarea value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} rows={4} />;
           } else if (field.type === "number") {
               InputCmp = <Input type="number" min={field.min} max={field.max} value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} />;
           } else if (field.type === "boolean") {
               InputCmp = <Checkbox checked={!!formData[field.name]} onCheckedChange={checked => handleChange(field.name, checked)} />;
           } else if (field.type === "date" || field.type === "calendar") {
               InputCmp = <Input type="date" value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} />;
           } else if (field.type === "file" || field.type === "upload") {
               InputCmp = <Input type="file" onChange={e => handleChange(field.name, e.target.files?.[0])} />;
           } else if (field.type === "richtext" || field.type === "html") {
               // A simple rich text fallback using a div contentEditable
               InputCmp = (
                 <div
                   className="min-h-[100px] w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none text-foreground whitespace-pre-wrap"
                   contentEditable
                   onBlur={e => handleChange(field.name, e.currentTarget.innerText)}
                   dangerouslySetInnerHTML={{ __html: formData[field.name] || "" }}
                 />
               );
           } else if (field.type === "select") {
               InputCmp = (
                 <select value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none text-foreground">
                    <option value="" disabled>Select an option</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
               );
           } else if ((field.type as string) === "unknown") {
               InputCmp = (
                   <div>
                       {InputCmp}
                       <div className="text-[10px] mt-1 bg-warning/20 text-warning inline-block px-1.5 py-0.5 rounded">Unknown field type fallback</div>
                   </div>
               )
           }

           const isFullWidth = field.type === "textarea" || field.type === "richtext" || field.type === "html" || field.type === "json";
           return (
             <div key={field.name} className={`space-y-2.5 ${isFullWidth ? 'md:col-span-2' : ''}`}>
               <Label className="flex items-center text-sm font-medium text-foreground">
                 {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
               </Label>
               {field.type === "boolean" ? (
                 <div className="flex items-center h-10 rounded-md border border-input px-3 py-2 bg-background shadow-sm w-fit">
                    {InputCmp}
                    <span className="ml-2 text-sm text-muted-foreground mr-2">Enable</span>
                 </div>
               ) : (
                 <div className="relative">
                    {InputCmp}
                 </div>
               )}
               {errors[field.name] && <div className="text-[11px] font-medium text-destructive mt-1.5">{errors[field.name]}</div>}
             </div>
           );
        })}
            </div>
          )}

          <div className="pt-6 border-t flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.history?.back && window.history.back()} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[120px]">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('submit') || "Create Record"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
