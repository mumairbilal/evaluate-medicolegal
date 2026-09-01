import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Folder,
  GripVertical,
  Layers3,
  Minus,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import PageToolbar from '../components/PageToolbar'
import DocumentAiSummaryPanel from '../components/DocumentAiSummaryPanel'
import DeleteRecordModal from '../components/DeleteRecordModal'
import StatusBadge from '../components/StatusBadge'
import UploadDocumentModal from '../components/UploadDocumentModal'
import { cases } from '../data/mockData'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import { useTableFilter } from '../hooks/useTableFilter'
import type { AiStatus, DocumentItem } from '../types'

const categories = ['All documents', 'Medical Records', 'Instruction', 'Correspondence', 'Draft Report', 'Prepared Bundle', 'Other']
const documentCategories = categories.filter((category) => category !== 'All documents')
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
const smallButton = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function normalisedName(name: string) {
  return name.toLowerCase().replace(/\bv\d+\b/g, '').replace(/\s+/g, ' ').trim()
}

function versionNumber(version: string) {
  return Number.parseInt(version.replace(/\D/g, ''), 10) || 1
}

export default function Documents() {
  const { role } = useRole()
  const { showToast } = useToast()
  const { documents, reports, addDocuments, updateDocument, removeDocument } = usePrototypeData()
  const [view, setView] = useState<'workspace' | 'preparation'>('workspace')
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryNav, setCategoryNav] = useState('All documents')
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [foldersOpen, setFoldersOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [previewPage, setPreviewPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [noteDraft, setNoteDraft] = useState('')
  const [showVersions, setShowVersions] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null)

  const filterDefs = useMemo(() => [
    { key: 'caseRef' as keyof DocumentItem, label: 'Case', options: [...new Set(documents.map((document) => document.caseRef))] },
    { key: 'status' as keyof DocumentItem, label: 'Review status', options: ['Not Started', 'Processing', 'Review Required', 'Approved'] },
    { key: 'aiStatus' as keyof DocumentItem, label: 'AI status', options: ['Not Started', 'Processing', 'Completed', 'Review Required', 'Failed', 'Approved'] },
    { key: 'uploadedBy' as keyof DocumentItem, label: 'Uploaded by', options: [...new Set(documents.map((document) => document.uploadedBy))] },
  ], [documents])

  const { search, setSearch, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } = useTableFilter(
    documents,
    ['name', 'caseRef', 'patient', 'category', 'uploadedBy'],
    filterDefs,
  )

  const visibleDocuments = useMemo(() => {
    const categoryFiltered = categoryNav === 'All documents' ? filtered : filtered.filter((document) => document.category === categoryNav)
    return [...categoryFiltered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'case') return a.caseRef.localeCompare(b.caseRef)
      if (sort === 'version') return versionNumber(b.version) - versionNumber(a.version)
      return b.id.localeCompare(a.id)
    })
  }, [filtered, categoryNav, sort])

  const selectedDocument = documents.find((document) => document.id === selectedId)

  const openDocumentPreview = (id: string) => {
    setSelectedId(id)
    setPreviewOpen(true)
  }

  const workspaceGridClass = foldersOpen
    ? previewOpen
      ? 'grid-cols-[170px_minmax(0,1fr)_310px]'
      : 'grid-cols-[170px_minmax(0,1fr)]'
    : previewOpen
      ? 'grid-cols-[minmax(0,1fr)_310px]'
      : 'grid-cols-[minmax(0,1fr)]'

  useEffect(() => {
    if (!selectedDocument) return
    setPreviewPage(1)
    setZoom(100)
    setRotation(0)
    setNoteDraft(selectedDocument.notes ?? '')
    setShowVersions(false)
  }, [selectedDocument?.id])

  const categoryCount = (category: string) => category === 'All documents' ? documents.length : documents.filter((document) => document.category === category).length
  const canDeleteDocumentRole = ['booking-administrator', 'operations-manager', 'file-preparation', 'system-administrator'].includes(role.id)

  const toggleRow = (id: string) => setSelectedRows((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const downloadDocument = (document: DocumentItem) => {
    downloadText(
      `${document.name.replace(/\.[^.]+$/, '')}-prototype.txt`,
      `Evaluate Medicolegal — prototype document export\n\nFile: ${document.name}\nCase: ${document.caseRef}\nPatient: ${document.patient}\nCategory: ${document.category}\nVersion: ${document.version}\nUploaded by: ${document.uploadedBy}\nUploaded: ${document.uploadDate}\nReview status: ${document.status}\nAI status: ${document.aiStatus ?? 'Not Started'}\n\nThis prototype does not retain the original binary file.`,
    )
    showToast(`${document.name} download prepared.`)
  }

  const approveSelected = () => {
    selectedRows.forEach((id) => updateDocument(id, (document) => ({ ...document, status: 'Approved' })))
    showToast(`${selectedRows.length} document${selectedRows.length === 1 ? '' : 's'} marked approved.`)
    setSelectedRows([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Review, organise and prepare case documents in one workspace.</p>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button onClick={() => setView('workspace')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'workspace' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Document workspace</button>
          <button onClick={() => setView('preparation')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'preparation' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>File preparation</button>
        </div>
      </div>

      {view === 'workspace' ? (
        <>
          <PageToolbar
            searchPlaceholder="Search documents by file, case, patient or uploader…"
            searchValue={search}
            onSearchChange={setSearch}
            resultCount={visibleDocuments.length}
            actionLabel="Upload documents"
            onAction={() => setModalOpen(true)}
            filterDefs={filterDefs}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dateFilterAvailable={dateFilterAvailable}
            sortOptions={[
              { key: 'newest', label: 'Recently added' },
              { key: 'name', label: 'File name (A–Z)' },
              { key: 'case', label: 'Case reference' },
              { key: 'version', label: 'Version (highest)' },
            ]}
            activeSort={sort}
            onSortChange={setSort}
          />

          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
              <p className="text-sm font-medium text-brand-800">{selectedRows.length} selected</p>
              <div className="flex items-center gap-2">
                <button className={smallButton} onClick={approveSelected}><FileCheck2 size={14} /> Mark approved</button>
                <button className={smallButton} onClick={() => setSelectedRows([])}><X size={14} /> Clear selection</button>
              </div>
            </div>
          )}

          <div className={`grid min-h-[610px] ${workspaceGridClass} overflow-hidden rounded-xl border border-slate-200 bg-white transition-[grid-template-columns] duration-200`}>
            {foldersOpen && (
            <aside className="border-r border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 px-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Folders & categories</p>
                <button
                  type="button"
                  onClick={() => setFoldersOpen(false)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  aria-label="Collapse folders and categories"
                  title="Collapse folders"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryNav(category)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm ${categoryNav === category ? 'bg-white font-medium text-brand-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70'}`}
                  >
                    <span className="flex min-w-0 items-center gap-2"><Folder size={14} className="shrink-0" /><span className="truncate">{category}</span></span>
                    <span className="text-xs text-slate-400">{categoryCount(category)}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3">
                <button onClick={() => setModalOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-2 py-3 text-xs font-medium text-slate-500 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700">
                  <UploadCloud size={15} /> Upload files
                </button>
              </div>
            </aside>
            )}

            <section className={`min-w-0 ${previewOpen ? 'border-r border-slate-200' : ''}`}>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {!foldersOpen && (
                      <button
                        type="button"
                        onClick={() => setFoldersOpen(true)}
                        className={smallButton}
                        title="Show folders and categories"
                      >
                        <Folder size={13} /> Folders <ChevronRight size={13} />
                      </button>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-800">Document list</h2>
                      <p className="truncate text-xs text-slate-400">Click a document to open its preview and full metadata.</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-400">{visibleDocuments.length} shown</span>
                    {selectedDocument && !previewOpen && (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className={smallButton}
                        title="Show selected document preview"
                      >
                        <FileText size={13} /> Preview <ChevronLeft size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="max-h-[555px] overflow-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-10 px-3 py-2.5"><input type="checkbox" className="rounded border-slate-300" checked={visibleDocuments.length > 0 && visibleDocuments.every((document) => selectedRows.includes(document.id))} onChange={(event) => setSelectedRows(event.target.checked ? visibleDocuments.map((document) => document.id) : [])} /></th>
                      <th className="px-3 py-2.5 font-medium">File</th>
                      <th className="px-3 py-2.5 font-medium">Category</th>
                      <th className="px-3 py-2.5 font-medium">Uploaded by</th>
                      <th className="px-3 py-2.5 font-medium">Review</th>
                      <th className="px-3 py-2.5 font-medium">AI</th>
                      <th className="px-3 py-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleDocuments.map((document) => (
                      <tr key={document.id} onClick={() => openDocumentPreview(document.id)} className={`cursor-pointer hover:bg-slate-50 ${selectedDocument?.id === document.id ? 'bg-brand-50/40' : ''}`}>
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}><input type="checkbox" className="rounded border-slate-300" checked={selectedRows.includes(document.id)} onChange={() => toggleRow(document.id)} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="shrink-0 text-slate-400" />
                            <div className="min-w-0"><p className="max-w-[220px] truncate font-medium text-slate-800">{document.name}</p><p className="text-xs text-brand-600">{document.caseRef} · {document.patient}</p></div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{document.category}</td>
                        <td className="px-3 py-3 text-slate-600"><p>{document.uploadedBy}</p><p className="mt-0.5 text-[11px] text-slate-400">{document.uploadDate} · {document.version} · {document.size}</p></td>
                        <td className="px-3 py-3"><StatusBadge status={document.status} /></td>
                        <td className="px-3 py-3"><StatusBadge status={document.aiStatus ?? 'Not Started'} /></td>
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex gap-1">
                            <button className="text-xs font-medium text-brand-700 hover:text-brand-800" onClick={() => openDocumentPreview(document.id)}>Open</button>
                            <button className="text-slate-400 hover:text-slate-600" aria-label={`Download ${document.name}`} onClick={() => downloadDocument(document)}><Download size={14} /></button>
                            {canDeleteDocumentRole && <button className="text-red-400 hover:text-red-600" aria-label={`Delete ${document.name}`} title="Delete document" onClick={() => setDeleteTarget(document)}><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleDocuments.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No documents match the current search, filters or category.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {previewOpen && selectedDocument && (
            <DocumentPreview
              document={selectedDocument}
              page={previewPage}
              setPage={setPreviewPage}
              zoom={zoom}
              setZoom={setZoom}
              rotation={rotation}
              setRotation={setRotation}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              showVersions={showVersions}
              setShowVersions={setShowVersions}
              onUpdate={(updater) => selectedDocument && updateDocument(selectedDocument.id, updater)}
              onDownload={() => selectedDocument && downloadDocument(selectedDocument)}
              onDelete={canDeleteDocumentRole ? () => selectedDocument && setDeleteTarget(selectedDocument) : undefined}
              onSaveNote={() => {
                if (!selectedDocument) return
                updateDocument(selectedDocument.id, (document) => ({ ...document, notes: noteDraft }))
                showToast('Document note saved.')
              }}
              onToast={showToast}
              onCollapse={() => setPreviewOpen(false)}
            />
            )}
          </div>
        </>
      ) : (
        <FilePreparationWorkspace
          documents={documents}
          updateDocument={updateDocument}
          addDocuments={addDocuments}
          uploadedBy={role.name}
          showToast={showToast}
        />
      )}

      {deleteTarget && (() => {
        const linkedReports = reports.filter((report) => report.sourceDocumentIds?.includes(deleteTarget.id))
        const canDeleteRole = ['booking-administrator', 'operations-manager', 'file-preparation', 'system-administrator'].includes(role.id)
        const blockedReason = !canDeleteRole
          ? 'Your current role does not have permission to delete document records.'
          : linkedReports.length > 0
            ? `This document is referenced by ${linkedReports.length} report(s). Remove or replace the report source reference before deleting the document.`
            : deleteTarget.category === 'Prepared Bundle' && deleteTarget.status === 'Approved'
              ? 'Approved prepared bundles are retained as workflow evidence. Create a replacement version instead of deleting the approved bundle.'
              : undefined
        return <DeleteRecordModal
          title="Delete document"
          recordName={`${deleteTarget.name} · ${deleteTarget.caseRef} · ${deleteTarget.version}`}
          impact="This permanently removes the document record, notes and version metadata from the prototype document library."
          blockedReason={blockedReason}
          confirmLabel="Delete document"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            removeDocument(deleteTarget.id)
            setSelectedRows((current) => current.filter((id) => id !== deleteTarget.id))
            if (selectedId === deleteTarget.id) {
              setSelectedId(null)
              setPreviewOpen(false)
            }
            showToast(`${deleteTarget.name} deleted.`)
            setDeleteTarget(null)
          }}
        />
      })()}

      {modalOpen && (
        <UploadDocumentModal
          existingCount={documents.length}
          uploadedBy={role.name}
          existingDocuments={documents}
          onClose={() => setModalOpen(false)}
          onUpload={(items) => {
            addDocuments(items)
            setModalOpen(false)
            setSelectedId(items[0]?.id ?? null)
            showToast(`${items.length} document${items.length === 1 ? '' : 's'} added to the document library.`)
          }}
        />
      )}
    </div>
  )
}

function DocumentPreview({
  document,
  page,
  setPage,
  zoom,
  setZoom,
  rotation,
  setRotation,
  noteDraft,
  setNoteDraft,
  showVersions,
  setShowVersions,
  onUpdate,
  onDownload,
  onDelete,
  onSaveNote,
  onToast,
  onCollapse,
}: {
  document?: DocumentItem
  page: number
  setPage: (page: number) => void
  zoom: number
  setZoom: (zoom: number) => void
  rotation: number
  setRotation: (rotation: number) => void
  noteDraft: string
  setNoteDraft: (note: string) => void
  showVersions: boolean
  setShowVersions: (value: boolean) => void
  onUpdate: (updater: (current: DocumentItem) => DocumentItem) => void
  onDownload: () => void
  onDelete?: () => void
  onSaveNote: () => void
  onToast: (message: string) => void
  onCollapse: () => void
}) {
  if (!document) return <aside className="flex items-center justify-center p-6 text-sm text-slate-400">Select a document to preview it.</aside>
  const pageCount = document.pageCount ?? 1

  return (
    <aside className="min-w-0 overflow-y-auto bg-slate-50/60">
      <div className="border-b border-slate-200 bg-white px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{document.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{document.caseRef} · {document.version} · {document.size}</p>
          </div>
          <button
            type="button"
            onClick={onCollapse}
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Collapse document preview"
            title="Collapse preview"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <div className="flex items-center gap-1">
          <button className={smallButton} onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}><ChevronLeft size={13} /></button>
          <span className="min-w-[62px] text-center text-xs text-slate-500">{page} / {pageCount}</span>
          <button className={smallButton} onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page >= pageCount}><ChevronRight size={13} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button className={smallButton} onClick={() => setZoom(Math.max(70, zoom - 10))}><Minus size={13} /></button>
          <span className="text-[11px] text-slate-500">{zoom}%</span>
          <button className={smallButton} onClick={() => setZoom(Math.min(150, zoom + 10))}><Plus size={13} /></button>
          <button className={smallButton} title="Rotate page" onClick={() => setRotation((rotation + 90) % 360)}><RotateCw size={13} /></button>
        </div>
      </div>

      <div className="flex h-56 items-center justify-center overflow-hidden bg-slate-200/70 p-5">
        <div style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }} className="flex h-44 w-32 origin-center flex-col rounded-sm bg-white p-3 shadow-sm transition-transform">
          <div className="mb-2 h-2 w-14 rounded bg-slate-200" />
          <div className="space-y-1.5">{Array.from({ length: 8 }, (_, index) => <div key={index} className={`h-1 rounded bg-slate-100 ${index % 3 === 0 ? 'w-20' : 'w-full'}`} />)}</div>
          <div className="mt-auto text-center text-[8px] text-slate-300">Page {page}</div>
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-700">Document information</p><div className="flex items-center gap-1"><button className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600" onClick={onDownload} title="Download"><Download size={14} /></button>{onDelete && <button className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={onDelete} title="Delete document"><Trash2 size={14} /></button>}</div></div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <dt className="text-slate-400">Uploaded by</dt><dd className="text-right text-slate-600">{document.uploadedBy}</dd>
            <dt className="text-slate-400">Upload date</dt><dd className="text-right text-slate-600">{document.uploadDate}</dd>
            <dt className="text-slate-400">Version</dt><dd className="text-right text-slate-600">{document.version}</dd>
            <dt className="text-slate-400">File size</dt><dd className="text-right text-slate-600">{document.size}</dd>
            <dt className="text-slate-400">Confidentiality</dt><dd className="text-right text-slate-600">{document.confidentiality ?? 'Standard'}</dd>
            <dt className="text-slate-400">Review status</dt><dd className="text-right"><StatusBadge status={document.status} /></dd>
            <dt className="text-slate-400">AI status</dt><dd className="text-right"><StatusBadge status={document.aiStatus ?? 'Not Started'} /></dd>
          </dl>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select className={inputClass} value={document.category} onChange={(event) => onUpdate((current) => ({ ...current, category: event.target.value }))}>{documentCategories.map((category) => <option key={category}>{category}</option>)}</select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Review status</label>
          <select className={inputClass} value={document.status} onChange={(event) => onUpdate((current) => ({ ...current, status: event.target.value as DocumentItem['status'] }))}>
            <option>Not Started</option><option>Processing</option><option>Review Required</option><option>Approved</option>
          </select>
        </div>

        <DocumentAiSummaryPanel
          document={document}
          onUpdate={onUpdate}
          onToast={onToast}
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
          <textarea rows={3} className={inputClass} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add a review or preparation note…" />
          <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800" onClick={onSaveNote}><Save size={13} /> Save note</button>
        </div>

        <div className="border-t border-slate-200 pt-3">
          {onDelete && <button onClick={onDelete} className="mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete document</button>}
          <button className="flex w-full items-center justify-between text-xs font-semibold text-slate-700" onClick={() => setShowVersions(!showVersions)}>
            <span>Version history</span><span className="text-slate-400">{document.versionHistory?.length ?? 1} version{(document.versionHistory?.length ?? 1) === 1 ? '' : 's'}</span>
          </button>
          {showVersions && <div className="mt-2 space-y-2">{(document.versionHistory ?? []).map((version) => <div key={`${version.version}-${version.date}`} className="rounded-lg border border-slate-200 bg-white p-2"><div className="flex justify-between"><span className="text-xs font-medium text-slate-700">{version.version}</span><span className="text-[11px] text-slate-400">{version.date}</span></div><p className="mt-1 text-[11px] text-slate-500">{version.author} · {version.size}</p><p className="mt-1 text-[11px] text-slate-500">{version.changeSummary}</p></div>)}</div>}
        </div>
      </div>
    </aside>
  )
}

function FilePreparationWorkspace({
  documents,
  updateDocument,
  addDocuments,
  uploadedBy,
  showToast,
}: {
  documents: DocumentItem[]
  updateDocument: (id: string, updater: DocumentItem | ((current: DocumentItem) => DocumentItem)) => void
  addDocuments: (items: DocumentItem[]) => void
  uploadedBy: string
  showToast: (message: string) => void
}) {
  const casesWithDocuments = useMemo(() => cases.filter((record) => documents.some((document) => document.caseRef === record.ref)), [documents])
  const [caseRef, setCaseRef] = useState(casesWithDocuments[0]?.ref ?? '')
  const caseDocuments = useMemo(() => documents.filter((document) => document.caseRef === caseRef && document.category !== 'Prepared Bundle'), [documents, caseRef])
  const [order, setOrder] = useState<string[]>([])
  const [included, setIncluded] = useState<string[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [prepPage, setPrepPage] = useState(1)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [removedPages, setRemovedPages] = useState<Record<string, number[]>>({})
  const [missingChecks, setMissingChecks] = useState<Record<string, boolean>>({})
  const [aiSummary, setAiSummary] = useState('')
  const [aiStatus, setAiStatus] = useState<AiStatus>('Review Required')
  const [aiGeneratedAt, setAiGeneratedAt] = useState('Just now')
  const [aiIssue, setAiIssue] = useState('')
  const [aiIssueDraft, setAiIssueDraft] = useState('')
  const [showAiIssue, setShowAiIssue] = useState(false)
  const [bundlePreview, setBundlePreview] = useState<{ name: string; documentIds: string[]; pages: number } | null>(null)
  const [bundlePreviewOpen, setBundlePreviewOpen] = useState(false)

  useEffect(() => {
    const ids = caseDocuments.map((document) => document.id)
    setOrder(ids)
    setIncluded(ids)
    setActiveDocId(ids[0] ?? null)
    setPrepPage(1)
    setRemovedPages({})
    setBundlePreview(null)
    setAiStatus('Review Required')
    setAiGeneratedAt('Just now')
    setAiIssue('')
    setAiIssueDraft('')
    setShowAiIssue(false)
    const selectedCase = cases.find((record) => record.ref === caseRef)
    setAiSummary(selectedCase ? `The file contains the current instruction and supporting records for ${selectedCase.patient}. Key records should be checked against the instruction before the final bundle is marked ready.` : '')
    setMissingChecks({
      instruction: caseDocuments.some((document) => /instruction/i.test(document.category) || /instruction/i.test(document.name)),
      records: caseDocuments.some((document) => document.category === 'Medical Records'),
      correspondence: caseDocuments.some((document) => document.category === 'Correspondence'),
    })
  }, [caseRef, caseDocuments.map((document) => document.id).join('|')])

  const orderedDocuments = order.map((id) => caseDocuments.find((document) => document.id === id)).filter(Boolean) as DocumentItem[]
  const activeDocument = caseDocuments.find((document) => document.id === activeDocId) ?? orderedDocuments[0]
  useEffect(() => { setPrepPage(1) }, [activeDocument?.id])
  const duplicatePairs = useMemo(() => {
    const groups = new Map<string, DocumentItem[]>()
    caseDocuments.forEach((document) => {
      const key = normalisedName(document.name)
      groups.set(key, [...(groups.get(key) ?? []), document])
    })
    return [...groups.values()].filter((group) => group.length > 1 || group.some((document) => document.duplicateOf))
  }, [caseDocuments])

  const moveDocument = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    setOrder((current) => {
      const next = current.filter((id) => id !== draggedId)
      const targetIndex = next.indexOf(targetId)
      next.splice(targetIndex, 0, draggedId)
      return next
    })
    setDraggedId(null)
  }

  const toggleIncluded = (id: string) => setIncluded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const removeCurrentPage = () => {
    if (!activeDocument) return
    const existing = removedPages[activeDocument.id] ?? []
    const pageCount = activeDocument.pageCount ?? 1
    if (existing.includes(prepPage)) {
      showToast(`Page ${prepPage} is already removed from the preparation copy.`)
      return
    }
    if (pageCount - existing.length <= 1) {
      showToast('At least one page must remain in the document.')
      return
    }
    const nextRemoved = [...existing, prepPage]
    setRemovedPages((current) => ({ ...current, [activeDocument.id]: nextRemoved }))
    const nextAvailable = Array.from({ length: pageCount }, (_, index) => index + 1).find((page) => page >= prepPage && !nextRemoved.includes(page))
      ?? Array.from({ length: pageCount }, (_, index) => index + 1).reverse().find((page) => !nextRemoved.includes(page))
      ?? 1
    setPrepPage(nextAvailable)
    showToast(`Page ${prepPage} removed from the preparation copy.`)
  }

  const restorePages = () => {
    if (!activeDocument) return
    setRemovedPages((current) => ({ ...current, [activeDocument.id]: [] }))
    showToast('Removed pages restored for this document.')
  }

  const generateBundle = () => {
    const selected = orderedDocuments.filter((document) => included.includes(document.id))
    if (selected.length === 0) {
      showToast('Select at least one document before generating a bundle.')
      return
    }
    const pages = selected.reduce((total, document) => total + Math.max(1, (document.pageCount ?? 1) - (removedPages[document.id]?.length ?? 0)), 0)
    const existingBundles = documents.filter((document) => document.caseRef === caseRef && document.category === 'Prepared Bundle')
    const nextVersion = Math.max(0, ...existingBundles.map((document) => versionNumber(document.version))) + 1
    setBundlePreview({ name: `Prepared bundle ${nextVersion}.pdf`, documentIds: selected.map((document) => document.id), pages })
    setBundlePreviewOpen(true)
    showToast('Bundle generated for final preview.')
  }

  const saveBundle = (markReady: boolean) => {
    if (!bundlePreview) {
      showToast('Generate the bundle before saving it.')
      return
    }
    const caseRecord = cases.find((record) => record.ref === caseRef)
    const existingBundles = documents.filter((document) => document.caseRef === caseRef && document.category === 'Prepared Bundle')
    const nextVersion = Math.max(0, ...existingBundles.map((document) => versionNumber(document.version))) + 1
    const version = `v${nextVersion}`
    const item: DocumentItem = {
      id: `D-BUNDLE-${Date.now()}`,
      name: bundlePreview.name,
      caseRef,
      patient: caseRecord?.patient ?? 'Unknown patient',
      category: 'Prepared Bundle',
      uploadedBy,
      uploadDate: 'Just now',
      version,
      size: `${Math.max(1, Math.round(bundlePreview.pages * 0.12 * 10) / 10)} MB`,
      status: markReady ? 'Approved' : 'Review Required',
      aiStatus: aiStatus === 'Approved' ? 'Approved' : 'Review Required',
      confidentiality: 'Sensitive',
      pageCount: bundlePreview.pages,
      notes: `Generated from ${bundlePreview.documentIds.length} selected source documents.`,
      versionHistory: [{ version, date: 'Just now', author: uploadedBy, size: `${bundlePreview.pages} pages`, changeSummary: markReady ? 'Final prepared bundle marked ready' : 'Prepared bundle version saved' }],
    }
    addDocuments([item])
    showToast(markReady ? 'Prepared file marked ready.' : `${version} saved to the document library.`)
    setBundlePreview(null)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-800">File preparation queue</h2><p className="text-xs text-slate-500 mt-1">Cases waiting for preparation, document review or bundle confirmation.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><th className="px-3 py-2.5">Case</th><th className="px-3 py-2.5">Patient</th><th className="px-3 py-2.5">Documents</th><th className="px-3 py-2.5">Missing</th><th className="px-3 py-2.5">Assigned preparer</th><th className="px-3 py-2.5">Priority</th><th className="px-3 py-2.5">Due date</th><th className="px-3 py-2.5">Preparation</th><th className="px-3 py-2.5">AI</th><th className="px-3 py-2.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{casesWithDocuments.map(record=>{const docs=documents.filter(d=>d.caseRef===record.ref);const source=docs.filter(d=>d.category!=='Prepared Bundle');const hasInstruction=source.some(d=>/instruction/i.test(d.category)||/instruction/i.test(d.name));const hasRecords=source.some(d=>d.category==='Medical Records');const missing=[!hasInstruction?'Instruction':'',!hasRecords?'Medical records':''].filter(Boolean);const ready=docs.some(d=>d.category==='Prepared Bundle'&&d.status==='Approved');const ai=source.some(d=>d.aiStatus==='Failed')?'Failed':source.some(d=>d.aiStatus==='Processing')?'Processing':source.some(d=>d.aiStatus==='Review Required')?'Review Required':'Completed';return <tr key={record.ref} className={caseRef===record.ref?'bg-brand-50/35':'hover:bg-brand-50/20'}><td className="px-3 py-2.5 font-medium text-brand-700">{record.ref}</td><td className="px-3 py-2.5 text-slate-700">{record.patient}</td><td className="px-3 py-2.5 text-slate-600">{source.length}</td><td className="px-3 py-2.5 text-slate-600">{missing.length?missing.join(', '):'None'}</td><td className="px-3 py-2.5 text-slate-600">{uploadedBy}</td><td className="px-3 py-2.5 text-slate-600">{record.priority}</td><td className="px-3 py-2.5 text-slate-500">{record.targetDate}</td><td className="px-3 py-2.5"><StatusBadge status={ready?'File Ready':'File Preparation'}/></td><td className="px-3 py-2.5"><StatusBadge status={ai}/></td><td className="px-3 py-2.5 text-right"><button onClick={()=>setCaseRef(record.ref)} className="text-xs font-medium text-brand-700 hover:text-brand-800">Open workspace</button></td></tr>})}</tbody></table></div>
      </div>
      <div className="flex items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[280px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">Preparation case</label>
          <select className={inputClass} value={caseRef} onChange={(event) => setCaseRef(event.target.value)}>
            {casesWithDocuments.map((record) => <option key={record.ref} value={record.ref}>{record.ref} — {record.patient}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{caseDocuments.length} source documents</span>
          <span>{included.length} included</span>
          <span>{duplicatePairs.length} duplicate group{duplicatePairs.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="grid min-h-[650px] grid-cols-[280px_minmax(0,1fr)_330px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <section className="border-r border-slate-200 bg-slate-50/60">
          <div className="border-b border-slate-200 bg-white px-3 py-3"><h2 className="text-sm font-semibold text-slate-800">Document order</h2><p className="text-xs text-slate-400">Drag to reorder and choose what to include.</p></div>
          <div className="max-h-[595px] space-y-2 overflow-y-auto p-3">
            {orderedDocuments.map((document) => (
              <div
                key={document.id}
                draggable
                onDragStart={() => setDraggedId(document.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveDocument(document.id)}
                onClick={() => setActiveDocId(document.id)}
                className={`cursor-pointer rounded-lg border bg-white p-2.5 ${activeDocument?.id === document.id ? 'border-brand-300 ring-2 ring-brand-500/10' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical size={15} className="mt-0.5 shrink-0 cursor-grab text-slate-300" />
                  <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={included.includes(document.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleIncluded(document.id)} />
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{document.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{document.category} · {document.pageCount ?? 1} pages</p></div>
                </div>
              </div>
            ))}
            {orderedDocuments.length === 0 && <div className="py-10 text-center text-sm text-slate-400">No source documents are available for this case.</div>}
          </div>
        </section>

        <section className="min-w-0 border-r border-slate-200 bg-slate-100/60">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
            <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-slate-800">{activeDocument?.name ?? 'Document preview'}</h2><p className="text-xs text-slate-400">Preparation copy — source file remains unchanged.</p></div>
            {activeDocument && <div className="flex items-center gap-1"><button className={smallButton} onClick={() => setPrepPage(Math.max(1, prepPage - 1))} disabled={prepPage <= 1}><ChevronLeft size={13} /></button><span className="min-w-[48px] text-center text-[11px] text-slate-500">{prepPage}/{activeDocument.pageCount ?? 1}</span><button className={smallButton} onClick={() => setPrepPage(Math.min(activeDocument.pageCount ?? 1, prepPage + 1))} disabled={prepPage >= (activeDocument.pageCount ?? 1)}><ChevronRight size={13} /></button><button className={smallButton} onClick={removeCurrentPage}><Trash2 size={13} /> Remove page</button><button className={smallButton} onClick={restorePages}><RefreshCw size={13} /> Restore</button></div>}
          </div>
          <div className="flex h-[520px] items-center justify-center p-6">
            {activeDocument ? (
              <div className="relative h-[430px] w-[305px] rounded-sm bg-white p-7 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><div className="h-2 w-28 rounded bg-slate-200" /><span className="text-[10px] text-slate-300">{activeDocument.version}</span></div>
                <div className="space-y-2">{Array.from({ length: 17 }, (_, index) => <div key={index} className={`h-1.5 rounded bg-slate-100 ${index % 4 === 0 ? 'w-4/5' : 'w-full'}`} />)}</div>
                <div className="absolute bottom-5 left-0 right-0 text-center text-[10px] text-slate-300">Viewing page {prepPage} · {Math.max(1, (activeDocument.pageCount ?? 1) - (removedPages[activeDocument.id]?.length ?? 0))} pages retained</div>
              </div>
            ) : <p className="text-sm text-slate-400">Select a document from the left.</p>}
          </div>
          {activeDocument && (removedPages[activeDocument.id]?.length ?? 0) > 0 && <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">Removed from preparation copy: page{removedPages[activeDocument.id]!.length === 1 ? '' : 's'} {removedPages[activeDocument.id]!.join(', ')}. The original document is unchanged.</div>}
        </section>

        <aside className="max-h-[650px] overflow-y-auto p-3">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Missing document checklist</p>
              <div className="space-y-2">
                {[
                  ['instruction', 'Instruction / letter of instruction'],
                  ['records', 'Core medical records'],
                  ['correspondence', 'Relevant correspondence'],
                ].map(([key, text]) => <label key={key} className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={Boolean(missingChecks[key])} onChange={() => setMissingChecks((current) => ({ ...current, [key]: !current[key] }))} /><span>{text}</span></label>)}
              </div>
              {!Object.values(missingChecks).every(Boolean) && <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> Confirm or obtain missing items before marking the file ready.</div>}
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Duplicate review</p><StatusBadge status={duplicatePairs.length ? 'Review Required' : 'Approved'} /></div>
              {duplicatePairs.length ? <div className="space-y-2">{duplicatePairs.map((group, index) => <div key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-2"><p className="text-[11px] font-medium text-amber-800">Possible duplicate group</p>{group.map((document) => <p key={document.id} className="mt-1 truncate text-[11px] text-amber-700">{document.version} · {document.name}</p>)}</div>)}</div> : <p className="text-[11px] text-slate-500">No duplicate file names detected in this case.</p>}
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="mb-2 flex items-center justify-between"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Sparkles size={13} /> AI summary review</p><StatusBadge status={aiStatus} /></div>
              <div className="mb-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-[11px] text-blue-700">AI-generated draft — human review required.</div>
              <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px]"><div><span className="text-slate-400">Generated</span><p className="mt-0.5 font-medium text-slate-600">{aiGeneratedAt}</p></div><div><span className="text-slate-400">Sources</span><p className="mt-0.5 font-medium text-slate-600">{included.length} document{included.length === 1 ? '' : 's'}</p></div></div>
              <div className="mb-2 flex flex-wrap gap-1">{orderedDocuments.filter((document) => included.includes(document.id)).slice(0, 3).map((document) => <span key={document.id} className="max-w-full truncate rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-600">{document.name}</span>)}{included.length > 3 && <span className="rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-500">+{included.length - 3} more</span>}</div>
              {aiStatus === 'Processing' ? <div className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-3 text-xs text-blue-700">AI processing in progress. You can continue preparing the file while this runs.</div> : <textarea className={inputClass} rows={5} value={aiSummary} onChange={(event) => { setAiSummary(event.target.value); setAiStatus('Review Required') }} />}
              <div className="mt-2 flex flex-wrap gap-2">
                <button className={smallButton} disabled={aiStatus === 'Processing'} onClick={() => { if (!aiSummary.trim()) { showToast('Add a summary before approving it.'); return } setAiStatus('Approved'); showToast('AI summary approved after human review.') }}><Check size={13} /> Approve</button>
                <button className={smallButton} disabled={aiStatus === 'Processing'} onClick={() => { setAiStatus('Processing'); showToast('AI summary regeneration started.'); window.setTimeout(() => { setAiSummary((current) => `${current.split(' Updated review:')[0]} Updated review: source documents should be checked against the latest case instruction.`); setAiStatus('Review Required'); setAiGeneratedAt('Just now'); showToast('AI summary draft regenerated for human review.') }, 650) }}><RefreshCw size={13} /> Regenerate</button>
                <button className={smallButton} onClick={() => { setAiIssueDraft(aiIssue); setShowAiIssue((current) => !current) }}><AlertTriangle size={13} /> Report issue</button>
              </div>
              {aiIssue && !showAiIssue && <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700"><span className="font-medium">Reported issue:</span> {aiIssue}</div>}
              {showAiIssue && <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2"><textarea className={inputClass} rows={2} value={aiIssueDraft} onChange={(event) => setAiIssueDraft(event.target.value)} placeholder="Describe an omission, incorrect source reference or other AI issue…" /><div className="mt-2 flex gap-2"><button className={smallButton} onClick={() => { if (!aiIssueDraft.trim()) { showToast('Describe the AI issue before submitting it.'); return } setAiIssue(aiIssueDraft.trim()); setAiStatus('Review Required'); setShowAiIssue(false); showToast('AI issue recorded for review.') }}>Submit issue</button><button className={smallButton} onClick={() => setShowAiIssue(false)}>Cancel</button></div></div>}
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">Bundle generation</p>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700" onClick={generateBundle}><Layers3 size={15} /> Generate PDF bundle</button>
              {bundlePreview && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="flex items-start gap-2"><FilePlus2 size={16} className="mt-0.5 text-brand-600" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{bundlePreview.name}</p><p className="mt-1 text-[11px] text-slate-500">{bundlePreview.documentIds.length} documents · {bundlePreview.pages} pages</p></div></div><div className="mt-3 flex flex-wrap gap-2"><button className={smallButton} onClick={() => setBundlePreviewOpen(true)}><FileText size={13} /> Preview bundle</button><button className={smallButton} onClick={() => saveBundle(false)}><Save size={13} /> Save as version</button><button className={smallButton} onClick={() => saveBundle(true)}><FileCheck2 size={13} /> Mark file ready</button></div></div>}
            </div>
          </div>
        </aside>
      </div>
      {bundlePreview && bundlePreviewOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-ink-900/35" onClick={()=>setBundlePreviewOpen(false)}/><div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"><div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100"><div><h3 className="text-sm font-semibold text-slate-900">PDF bundle preview</h3><p className="text-xs text-slate-500 mt-1">{bundlePreview.name} · {bundlePreview.pages} pages · next saved version</p></div><button onClick={()=>setBundlePreviewOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16}/></button></div><div className="grid md:grid-cols-[260px_minmax(0,1fr)] min-h-[480px]"><aside className="border-r border-slate-200 p-4 bg-slate-50"><p className="text-xs font-semibold text-slate-700">Document index</p><div className="mt-3 space-y-2">{orderedDocuments.filter(d=>bundlePreview.documentIds.includes(d.id)).map((d,index)=><div key={d.id} className="rounded-lg border border-slate-200 bg-white p-2.5"><p className="text-xs font-medium text-slate-700">{index+1}. {d.name}</p><p className="text-[11px] text-slate-400 mt-1">{Math.max(1,(d.pageCount??1)-(removedPages[d.id]?.length??0))} pages · {d.version}</p></div>)}</div></aside><main className="bg-slate-100/70 flex items-center justify-center p-6"><div className="w-[330px] h-[430px] bg-white shadow-sm p-8 relative"><div className="h-2 w-32 rounded bg-slate-200 mb-5"/><div className="space-y-2">{Array.from({length:18},(_,i)=><div key={i} className={`h-1.5 rounded bg-slate-100 ${i%5===0?'w-4/5':'w-full'}`}/>)}</div><p className="absolute bottom-6 inset-x-0 text-center text-[10px] text-slate-300">Bundle page 1 of {bundlePreview.pages}</p></div></main></div><div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100"><button onClick={()=>downloadText(`${caseRef}-${bundlePreview.name}.txt`,`Evaluate Medicolegal prepared bundle preview\nCase: ${caseRef}\nBundle: ${bundlePreview.name}\nPages: ${bundlePreview.pages}\nDocuments:\n${orderedDocuments.filter(d=>bundlePreview.documentIds.includes(d.id)).map(d=>`- ${d.name}`).join('\n')}`)} className={smallButton}><Download size={13}/> Download preview</button><div className="flex gap-2"><button onClick={()=>saveBundle(false)} className={smallButton}><Save size={13}/> Save version</button><button onClick={()=>{saveBundle(true);setBundlePreviewOpen(false)}} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"><FileCheck2 size={13}/> Confirm bundle & mark ready</button></div></div></div></div>}
    </div>
  )
}
