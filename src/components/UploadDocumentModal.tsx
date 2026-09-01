import { useRef, useState } from 'react'
import Modal from './Modal'
import { cases } from '../data/mockData'
import { AlertTriangle, CheckCircle2, FileText, Loader2, RefreshCw, UploadCloud, X } from 'lucide-react'
import type { DocumentItem } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const MAX_SIZE_MB = 25

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type PendingFile = {
  file: File
  status: 'ready' | 'error'
  errorMessage?: string
  duplicateId?: string
}

export default function UploadDocumentModal({
  onClose,
  onUpload,
  existingCount,
  uploadedBy,
  defaultCaseRef = '',
  lockCase = false,
  defaultPatient = '',
  existingDocuments = [],
}: {
  onClose: () => void
  onUpload: (docs: DocumentItem[]) => void
  existingCount: number
  uploadedBy: string
  defaultCaseRef?: string
  lockCase?: boolean
  defaultPatient?: string
  existingDocuments?: DocumentItem[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const replacementRef = useRef<HTMLInputElement>(null)
  const replacementIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<PendingFile[]>([])
  const [caseRef, setCaseRef] = useState(defaultCaseRef)
  const [category, setCategory] = useState('Medical Records')
  const [confidentiality, setConfidentiality] = useState<'Standard' | 'Sensitive' | 'Highly Confidential'>('Standard')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)

  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']

  const validateFile = (file: File, targetCaseRef = caseRef): PendingFile => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(ext)) return { file, status: 'error', errorMessage: 'Unsupported file type. Choose PDF, DOC, DOCX, JPG or PNG.' }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return { file, status: 'error', errorMessage: `File is too large. Maximum size is ${MAX_SIZE_MB}MB.` }
    const duplicate = existingDocuments.find((document) => document.caseRef === targetCaseRef && document.name.trim().toLowerCase() === file.name.trim().toLowerCase())
    return { file, status: 'ready', duplicateId: duplicate?.id }
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list).map((file) => validateFile(file))])
    setUploadFailed(false)
  }

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const chooseReplacement = (index: number) => {
    replacementIndex.current = index
    replacementRef.current?.click()
  }

  const replaceFile = (list: FileList | null) => {
    if (!list?.[0] || replacementIndex.current === null) return
    const index = replacementIndex.current
    setFiles((prev) => prev.map((entry, i) => i === index ? validateFile(list[0]) : entry))
    replacementIndex.current = null
  }

  const selectedCase = cases.find((c) => c.ref === caseRef)
  const readyFiles = files.filter((f) => f.status === 'ready')

  const handleUpload = () => {
    if (!caseRef) {
      setError('Select the related case before uploading.')
      return
    }
    if (readyFiles.length === 0) {
      setError('Add at least one valid file to upload.')
      return
    }
    setError('')
    setUploadFailed(false)
    setUploading(true)

    window.setTimeout(() => {
      try {
        const now = 'Just now'
        const newDocs: DocumentItem[] = readyFiles.map((entry, i) => {
          const duplicate = entry.duplicateId ? existingDocuments.find((document) => document.id === entry.duplicateId) : undefined
          const nextVersionNumber = duplicate ? (Number.parseInt(duplicate.version.replace(/\D/g, ''), 10) || 1) + 1 : 1
          const version = `v${nextVersionNumber}`
          return {
            id: `D-${Date.now()}-${existingCount + i}`,
            name: entry.file.name,
            caseRef,
            patient: selectedCase?.patient ?? defaultPatient ?? 'Unknown patient',
            category,
            uploadedBy,
            uploadDate: now,
            version,
            size: formatSize(entry.file.size),
            status: 'Processing',
            aiStatus: 'Processing',
            confidentiality,
            notes: description,
            pageCount: Math.max(1, Math.min(120, Math.ceil(entry.file.size / (180 * 1024)))),
            duplicateOf: duplicate?.id,
            versionHistory: [
              {
                version,
                date: now,
                author: uploadedBy,
                size: formatSize(entry.file.size),
                changeSummary: duplicate ? `Uploaded as a new version of ${duplicate.name}` : 'Initial upload',
              },
              ...(duplicate?.versionHistory ?? []),
            ],
          }
        })
        setUploading(false)
        setDone(true)
        onUpload(newDocs)
      } catch {
        setUploading(false)
        setUploadFailed(true)
        setError('The upload could not be completed. Your selected files have been kept so you can retry.')
      }
    }, 900)
  }

  return (
    <Modal title="Upload documents" description="Add one or more documents to a case document library." onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className={label}>Related case</label>
          <select
            className={`${field} disabled:bg-slate-50 disabled:text-slate-500`}
            value={caseRef}
            onChange={(e) => {
              const nextCaseRef = e.target.value
              setCaseRef(nextCaseRef)
              setFiles((current) => current.map((entry) => validateFile(entry.file, nextCaseRef)))
            }}
            disabled={lockCase}
          >
            {!lockCase && <option value="">Select a case...</option>}
            {cases.map((c) => <option key={c.ref} value={c.ref}>{c.ref} — {c.patient}</option>)}
            {defaultCaseRef && !cases.some((c) => c.ref === defaultCaseRef) && <option value={defaultCaseRef}>{defaultCaseRef} — {defaultPatient}</option>}
          </select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
        >
          <UploadCloud className="mx-auto mb-2 text-slate-400" size={24} />
          <p className="text-sm text-slate-600 font-medium">Drag and drop files, or click to select files</p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG and PNG up to {MAX_SIZE_MB}MB each</p>
          <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <input ref={replacementRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => replaceFile(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {files.map((entry, i) => (
              <div key={`${entry.file.name}-${i}`} className={`rounded-lg border px-3 py-2 text-sm ${entry.status === 'error' ? 'border-red-100 bg-red-50' : entry.duplicateId ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.duplicateId ? <AlertTriangle size={14} className="text-amber-500 shrink-0" /> : <FileText size={14} className={entry.status === 'error' ? 'text-red-400 shrink-0' : 'text-slate-400 shrink-0'} />}
                    <div className="min-w-0">
                      <p className="truncate text-slate-700">{entry.file.name}</p>
                      {entry.status === 'error' ? <p className="text-xs text-red-600">{entry.errorMessage}</p> : entry.duplicateId ? <p className="text-xs text-amber-700">A file with this name already exists in this case. It will be uploaded as a new version.</p> : <p className="text-xs text-slate-400">{formatSize(entry.file.size)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {entry.status === 'error' && <button type="button" onClick={() => chooseReplacement(i)} className="text-xs font-medium text-brand-700 hover:text-brand-800">Replace</button>}
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Category</label>
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Medical Records</option><option>Instruction</option><option>Draft Report</option><option>Prepared Bundle</option><option>Correspondence</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={label}>Confidentiality</label>
            <select className={field} value={confidentiality} onChange={(e) => setConfidentiality(e.target.value as typeof confidentiality)}>
              <option>Standard</option><option>Sensitive</option><option>Highly Confidential</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Description (optional)</label>
          <textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context for the document or this version" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg" disabled={uploading}>Cancel</button>
        <button
          onClick={handleUpload}
          disabled={uploading || done}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-70 rounded-lg"
        >
          {uploading && <Loader2 size={14} className="animate-spin" />}
          {done && <CheckCircle2 size={14} />}
          {uploadFailed && !uploading && <RefreshCw size={14} />}
          {uploading ? 'Uploading…' : done ? 'Uploaded' : uploadFailed ? 'Retry upload' : `Upload ${readyFiles.length || ''} document${readyFiles.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </Modal>
  )
}
