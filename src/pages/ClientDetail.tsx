import type { ReactNode } from 'react'
import { useState } from 'react'
import { ArrowLeft, Mail, Pencil, Phone, Trash2, UserCheck, UserX } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import EditClientModal from '../components/EditClientModal'
import DeleteRecordModal from '../components/DeleteRecordModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { cases } from '../data/mockData'
import { useToast } from '../context/ToastContext'
import { useRole } from '../context/RoleContext'
import type { Client } from '../types'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useRole()
  const { clients, bookings, updateClient, removeClient } = usePrototypeData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const client = clients.find((c) => c.id === id)

  if (!client) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><p className="text-sm font-medium text-slate-800">Client not found</p><Link to="/clients" className="mt-4 inline-flex text-sm font-medium text-brand-600">Back to clients</Link></div>

  const active = cases.filter((c) => c.client === client.name && c.status !== 'Completed')
  const completed = cases.filter((c) => c.client === client.name && c.status === 'Completed')
  const linkedBookings = bookings.filter((booking) => booking.client === client.name)
  const total = Math.max(1, client.activeCases + client.completedCases)
  const completedRate = Math.round(client.completedCases / total * 100)
  const canManageRecords = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const blockedReason = !canManageRecords
    ? 'Your current role does not have permission to remove client master records.'
    : active.length + completed.length + linkedBookings.length > 0
      ? `This client is linked to ${active.length} active case(s), ${completed.length} completed case(s) and ${linkedBookings.length} booking(s). Historical commercial and medicolegal records must be preserved. Deactivate the client instead of deleting it.`
      : undefined

  const toggleStatus = () => {
    const nextStatus: Client['status'] = client.status === 'Active' ? 'Inactive' : 'Active'
    updateClient(client.id, { ...client, status: nextStatus })
    showToast(nextStatus === 'Inactive' ? 'Client deactivated.' : 'Client reactivated.')
  }

  return <div className="mx-auto max-w-[1400px] space-y-4">
    <header>
      <button onClick={() => navigate('/clients')} className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"><ArrowLeft size={14}/> Back to clients</button>
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold text-slate-900">{client.name}</h1><StatusBadge status={client.status}/></div><p className="mt-1 text-xs text-slate-400">{client.type} · {client.id}</p></div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Pencil size={13}/> Edit client</button>
          {canManageRecords && <button onClick={toggleStatus} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">{client.status === 'Active' ? <UserX size={13}/> : <UserCheck size={13}/>} {client.status === 'Active' ? 'Deactivate client' : 'Reactivate client'}</button>}
          {canManageRecords && <button onClick={() => setRemoveOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 size={13}/> Remove client</button>}
        </div>
      </div>
    </header>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <main className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Section title="Organisation information"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info l="Client type" v={client.type}/><Info l="Organisation number" v={client.organisationNumber || 'Not recorded'}/><Info l="Address" v={client.address || 'Not recorded'}/><Info l="Last activity" v={client.lastActivity}/></div></Section>
        <Section title="Contact people"><div className="space-y-2">{(client.contactPeople ?? []).map((contact) => <div key={contact.id} className="grid gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-[1fr_1fr_1fr]"><div><p className="text-sm font-medium text-slate-800">{contact.name}</p><p className="mt-0.5 text-xs text-slate-400">{contact.role}</p></div><div className="flex items-center gap-1.5 text-xs text-slate-600"><Mail size={13}/>{contact.email || 'No email'}</div><div className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={13}/>{contact.phone || 'No phone'}</div></div>)}</div></Section>
        <Section title="Service & communication"><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><Info l="Communication details" v={client.communicationDetails || 'Not recorded'}/><Info l="Service requirements" v={client.serviceRequirements || 'Not recorded'}/><Info l="Standard instructions" v={client.standardInstructions || 'Not recorded'}/><Info l="Report delivery preference" v={client.reportDeliveryPreference || 'Not recorded'}/><Info l="Agreed fees" v={client.agreedFees || 'Not recorded'}/></div></Section>
        <Section title="Related cases"><div className="grid gap-3 sm:grid-cols-2"><CaseGroup title="Active cases" count={client.activeCases} records={active}/><CaseGroup title="Completed cases" count={client.completedCases} records={completed}/></div></Section>
      </main>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-3 text-sm font-semibold text-slate-900">Primary contact</h2><p className="text-sm font-medium text-slate-700">{client.primaryContact}</p><p className="mt-2 break-all text-xs text-slate-500">{client.email || 'No email recorded'}</p><p className="mt-1 text-xs text-slate-500">{client.phone || 'No phone recorded'}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-3 text-sm font-semibold text-slate-900">Performance summary</h2><div className="space-y-3"><Metric l="Active cases" v={`${client.activeCases}`}/><Metric l="Completed cases" v={`${client.completedCases}`}/><Metric l="Completion share" v={`${completedRate}%`}/><Metric l="Account status" v={client.status}/></div><p className="mt-3 text-[11px] text-slate-400">Prototype operational summary based on current client records.</p></div>
      </aside>
    </div>

    {editing && <EditClientModal client={client} onClose={() => setEditing(false)} onSave={(next) => { updateClient(client.id, next); setEditing(false); showToast('Client profile updated.') }}/>} 
    {removeOpen && <DeleteRecordModal
      title="Remove client"
      recordName={`${client.name} · ${client.id}`}
      impact="This permanently removes the client master record from the prototype. Use this only for an incorrectly created, unlinked client."
      blockedReason={blockedReason}
      confirmLabel="Remove client"
      onClose={() => setRemoveOpen(false)}
      onConfirm={() => {
        removeClient(client.id)
        showToast(`${client.name} removed.`)
        setRemoveOpen(false)
        navigate('/clients')
      }}
    />}
  </div>
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="border-b border-slate-100 p-4 last:border-0"><h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>{children}</section> }
function Info({ l, v }: { l: string; v: string }) { return <div><p className="text-[11px] uppercase tracking-wide text-slate-400">{l}</p><p className="mt-1 text-sm leading-5 text-slate-700">{v}</p></div> }
function Metric({ l, v }: { l: string; v: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{l}</span><span className="text-sm font-semibold text-slate-800">{v}</span></div> }
function CaseGroup({ title, count, records }: { title: string; count: number; records: typeof cases }) { return <div className="rounded-lg border border-slate-100 p-3"><div className="mb-2 flex justify-between"><p className="text-xs font-semibold text-slate-700">{title}</p><span className="text-xs text-slate-400">{count}</span></div>{records.length ? records.slice(0, 4).map((record) => <Link key={record.ref} to={`/cases/${record.ref}`} className="block py-1.5 text-xs text-brand-600 hover:text-brand-700">{record.ref} · {record.patient}</Link>) : <p className="text-xs text-slate-400">No seeded case records to display.</p>}</div> }
