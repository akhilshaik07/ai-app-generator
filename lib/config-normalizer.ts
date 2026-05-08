import { PageConfig } from '@/types'

export function normalizeToPages(raw: any): PageConfig[] {
  // FORMAT A: already has pages array
  if (Array.isArray(raw.pages) && raw.pages.length > 0) {
    return raw.pages.filter(Boolean).map((page: any) => ({
      id: page.id || page.slug || toSlug(page.name || page.title || 'page'),
      name: page.name || page.title || 'Unnamed Page',
      title: page.title || page.name || 'Unnamed Page',
      slug: page.slug || page.id || toSlug(page.name || page.title || 'page'),
      type: page.type || 'table',
      entity: page.entity,
      fields: Array.isArray(page.fields) ? page.fields.filter(Boolean) : [],
      actions: page.actions,
      layout: page.layout,
      description: page.description,
      icon: page.icon,
    }))
  }

  // FORMAT B: has entities + views
  if (Array.isArray(raw.entities) && Array.isArray(raw.views)) {
    return raw.views.filter(Boolean).map((view: any) => {
      const entity = raw.entities.find((e: any) => e.name === view.entity)
      return {
        id: view.id || view.slug || toSlug(view.title || view.entity || 'page'),
        name: view.title || view.entity || 'Unnamed',
        title: view.title || view.entity || 'Unnamed',
        slug: view.id || view.slug || toSlug(view.title || view.entity || 'page'),
        type: view.type || 'table',
        entity: view.entity || entity?.name,
        fields: entity?.fields || view.fields || [],
        actions: view.actions,
        layout: view.layout,
        description: view.description,
      }
    })
  }

  // FORMAT C: has entities but no views - auto-generate
  if (Array.isArray(raw.entities) && !Array.isArray(raw.views)) {
    const pages: PageConfig[] = []
    raw.entities.filter(Boolean).forEach((entity: any) => {
      pages.push({
        id: toSlug(entity.name),
        name: toLabel(entity.name),
        title: toLabel(entity.name),
        slug: toSlug(entity.name),
        type: 'table',
        entity: entity.name,
        fields: entity.fields || [],
      })
      pages.push({
        id: `add-${toSlug(entity.name)}`,
        name: `Add ${toLabel(entity.name)}`,
        title: `Add ${toLabel(entity.name)}`,
        slug: `add-${toSlug(entity.name)}`,
        type: 'form',
        entity: entity.name,
        fields: entity.fields || [],
      })
    })
    return pages
  }

  return []
}

function toSlug(str: any): string {
  const s = typeof str === 'string' ? str : String(str || '');
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toLabel(str: any): string {
  const s = typeof str === 'string' ? str : String(str || '');
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
