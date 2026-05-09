"use client";

import React, { useState } from "react";
import { AppConfig, FieldConfig, PageConfig, ViewConfig } from "../../types";
import { apiClient } from "../../lib/api-client";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/use-app-store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function DynamicForm({ view, page, config }: { view: ViewConfig; page?: PageConfig; config: AppConfig; locale: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const t = useAppStore(s => s.getTranslation);

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

  let fieldsToRender = (entityConfig
    ? entityConfig.fields.filter(f => !f.hidden)
    : pageFields.map(normalizeField).filter(f => !f.hidden))
    .filter(Boolean); // Safe filter for null/undefined fields

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

    let hasErr = false;
    const newErrs: Record<string, string> = {};
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
        ? `/dynamic/${config.app?.id || 'default'}/${entityConfig.name}`
        : `/forms/${config.app?.id || 'default'}/${page?.slug || view.id}`;

      console.log(`[DynamicForm] Submitting to ${endpoint}`, formData);

      const res = await apiClient.post(endpoint, entityConfig ? formData : { data: formData });
      console.log(`[DynamicForm] Response:`, res.data);

      if (entityConfig) {
        console.log(`[DynamicForm] Invalidating query cache for records`);
        await queryClient.invalidateQueries({ queryKey: ["records", config.app?.id || 'default', entityConfig.name] });
        await queryClient.refetchQueries({ queryKey: ["records", config.app?.id || 'default', entityConfig.name] });
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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="overflow-hidden rounded-[8px] border border-border bg-white shadow-sm shadow-black/[0.03]">
        <div className="border-b border-border bg-[#fbfaf7] px-6 py-5">
          <h2 className="text-xl font-semibold text-foreground">{view.title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Fill the required fields and submit to create a record.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {submitted && (
            <div className="flex items-center gap-2 rounded-[8px] border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Record submitted successfully
            </div>
          )}

          {fieldsToRender.length === 0 ? (
            <div className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              No fields to render. Please configure form fields in the page definition.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {fieldsToRender.map((field, idx) => {
                const fieldName = field.name || `field_${idx}`;
                const fieldLabel = field.label || field.name || "Untitled Field";

                let InputCmp = (
                  <Input
                    className="bg-[#fbfaf7]"
                    type="text"
                    value={formData[fieldName] || ""}
                    onChange={e => handleChange(fieldName, e.target.value)}
                  />
                );

                if (field.type === "textarea") {
                  InputCmp = <Textarea className="bg-[#fbfaf7]" value={formData[fieldName] || ""} onChange={e => handleChange(fieldName, e.target.value)} rows={4} />;
                } else if (field.type === "number") {
                  InputCmp = <Input className="bg-[#fbfaf7]" type="number" min={field.min} max={field.max} value={formData[fieldName] || ""} onChange={e => handleChange(fieldName, e.target.value)} />;
                } else if (field.type === "boolean") {
                  InputCmp = <Checkbox checked={!!formData[fieldName]} onCheckedChange={checked => handleChange(fieldName, checked)} />;
                } else if (field.type === "date" || field.type === "calendar") {
                  InputCmp = <Input className="bg-[#fbfaf7]" type="date" value={formData[fieldName] || ""} onChange={e => handleChange(fieldName, e.target.value)} />;
                } else if (field.type === "file" || field.type === "upload") {
                  InputCmp = <Input className="bg-[#fbfaf7]" type="file" onChange={e => handleChange(fieldName, e.target.files?.[0])} />;
                } else if (field.type === "richtext" || field.type === "html") {
                  InputCmp = (
                    <div
                      className="min-h-[100px] w-full rounded-md border border-input bg-[#fbfaf7] px-3 py-2 text-sm text-foreground outline-none whitespace-pre-wrap focus-visible:ring-1 focus-visible:ring-ring"
                      contentEditable
                      onBlur={e => handleChange(fieldName, e.currentTarget.innerText)}
                      dangerouslySetInnerHTML={{ __html: formData[fieldName] || "" }}
                    />
                  );
                } else if (field.type === "select") {
                  InputCmp = (
                    <select value={formData[fieldName] || ""} onChange={e => handleChange(fieldName, e.target.value)} className="w-full rounded-md border border-input bg-[#fbfaf7] px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="" disabled>Select an option</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  );
                } else if ((field.type as string) === "unknown") {
                  InputCmp = (
                    <div>
                      {InputCmp}
                      <div className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">Unknown field type fallback</div>
                    </div>
                  );
                }

                const isFullWidth = field.type === "textarea" || field.type === "richtext" || field.type === "html" || field.type === "json";
                
                return (
                  <div key={fieldName} className={`space-y-2.5 ${isFullWidth ? "md:col-span-2" : ""}`}>
                    <Label className="flex items-center text-sm font-medium text-foreground">
                      {fieldLabel} {field.required && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                    {field.type === "boolean" ? (
                      <div className="flex h-10 w-fit items-center rounded-md border border-input bg-[#fbfaf7] px-3 py-2 shadow-sm">
                        {InputCmp}
                        <span className="ml-2 mr-2 text-sm text-muted-foreground">Enable</span>
                      </div>
                    ) : (
                      <div className="relative">{InputCmp}</div>
                    )}
                    {errors[fieldName] && <div className="mt-1.5 text-[11px] font-medium text-destructive">{errors[fieldName]}</div>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={() => window.history?.back && window.history.back()} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full min-w-[120px] sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submit") || "Create Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
