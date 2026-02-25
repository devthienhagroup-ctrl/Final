import React, { useState } from 'react'
import { useAuth } from '../app/auth.store'
import { apiFetch } from '../api/client'

const defaults: Record<string, string> = {
  categories: JSON.stringify(
    {
      status: 'active',
      translations: [
        { languageCode: 'vi', name: 'Chăm sóc da', slug: 'cham-soc-da' },
        { languageCode: 'en', name: 'Skincare', slug: 'skincare' },
      ],
    },
    null,
    2,
  ),
  products: JSON.stringify(
    {
      sku: 'SPA-SAMPLE-001',
      categoryId: 1,
      price: 489000,
      status: 'active',
      translations: [
        { languageCode: 'vi', name: 'Serum Spa', slug: 'serum-spa' },
        { languageCode: 'en', name: 'Spa Serum', slug: 'spa-serum' },
      ],
    },
    null,
    2,
  ),
  attributes: JSON.stringify(
    {
      code: 'material',
      valueType: 'text',
      translations: [
        { languageCode: 'vi', displayName: 'Chất liệu' },
        { languageCode: 'en', displayName: 'Material' },
      ],
    },
    null,
    2,
  ),
  ingredients: JSON.stringify(
    {
      code: 'vitamin_c',
      translations: [
        { languageCode: 'vi', displayName: 'Vitamin C' },
        { languageCode: 'en', displayName: 'Vitamin C' },
      ],
    },
    null,
    2,
  ),
}

function Panel({ resource }: { resource: 'categories' | 'products' | 'attributes' | 'ingredients' }) {
  const { token } = useAuth()
  const [payload, setPayload] = useState(defaults[resource])
  const [id, setId] = useState('')
  const [result, setResult] = useState('')

  const callApi = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE') => {
    try {
      const path = `/catalog/${resource}${id ? `/${id}` : ''}`
      const body = method === 'POST' || method === 'PATCH' ? JSON.parse(payload) : undefined
      const data = await apiFetch<any>(path, {
        method,
        token,
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult(error?.message || 'Request failed')
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, textTransform: 'capitalize' }}>{resource}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input className="input" placeholder="ID (for get one/patch/delete)" value={id} onChange={(e) => setId(e.target.value)} />
        <textarea className="input" style={{ minHeight: 180, fontFamily: 'monospace' }} value={payload} onChange={(e) => setPayload(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => callApi('GET')}>GET</button>
          <button className="btn btn-primary" onClick={() => callApi('POST')}>POST</button>
          <button className="btn" onClick={() => callApi('PATCH')}>PATCH</button>
          <button className="btn btn-danger" onClick={() => callApi('DELETE')}>DELETE</button>
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
      </div>
    </div>
  )
}

export function CatalogCrudPage() {
  return (
    <div>
      <h2>Catalog CRUD (Simple Admin)</h2>
      <p className="muted">Trang đơn giản để tương tác API CRUD cho category, sản phẩm, thuộc tính, thành phần.</p>
      <Panel resource="categories" />
      <Panel resource="products" />
      <Panel resource="attributes" />
      <Panel resource="ingredients" />
    </div>
  )
}
