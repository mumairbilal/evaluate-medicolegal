import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PageToolbar from '../components/PageToolbar'
import NewDoctorModal from '../components/NewDoctorModal'
import { useTableFilter } from '../hooks/useTableFilter'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useToast } from '../context/ToastContext'
import { useState } from 'react'
import { cases } from '../data/mockData'

export default function Doctors() {
  const { doctors, appointments, reports, addDoctor } = usePrototypeData()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable, tableSortOptions, activeTableSort, setActiveTableSort } =
    useTableFilter(doctors, ['name', 'speciality', 'location'], [
      { key: 'availability', label: 'Availability', options: ['Available', 'Limited Availability', 'Fully Booked', 'On Leave'] },
      { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
    ])

  return (
    <div className="space-y-4">
      <PageToolbar
        searchPlaceholder="Search doctors by name, speciality or location..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        actionLabel="Add doctor"
        onAction={() => setModalOpen(true)}
        filterDefs={filterDefs}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFilterAvailable={dateFilterAvailable}
        sortOptions={tableSortOptions}
        activeSort={activeTableSort}
        onSortChange={setActiveTableSort}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Medical expert panel</h2>
          <p className="text-xs text-slate-400 mt-0.5">Availability, active workload and report commitments in one register.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 font-medium">Doctor</th>
                <th className="px-4 py-2.5 font-medium">Speciality / location</th>
                <th className="px-4 py-2.5 font-medium">Availability</th>
                <th className="px-4 py-2.5 font-medium">Active cases</th>
                <th className="px-4 py-2.5 font-medium">Appointments</th>
                <th className="px-4 py-2.5 font-medium">Reports</th>
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="px-4 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 align-top">
                  <td className="px-4 py-3"><Link to={`/doctors/${d.id}`} className="font-semibold text-brand-600 hover:text-brand-700">{d.name}</Link><p className="text-[11px] text-slate-400 mt-1">{d.id}</p></td>
                  <td className="px-4 py-3"><p className="text-xs text-slate-700">{d.speciality}</p><p className="text-[11px] text-slate-400 mt-1">{d.location}</p></td>
                  <td className="px-4 py-3"><StatusBadge status={d.availability} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{cases.filter((item) => item.doctor === d.name && item.status !== 'Completed').length}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{appointments.filter((item) => item.doctor === d.name && item.status === 'Scheduled').length}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{reports.filter((item) => item.doctor === d.name && item.status !== 'Delivered').length}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-right"><Link to={`/doctors/${d.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">Open <ArrowRight size={13}/></Link></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-9 text-center text-slate-400 text-sm">No doctors match your search or filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <NewDoctorModal existingCount={doctors.length} onClose={() => setModalOpen(false)} onCreate={(doctor) => { addDoctor(doctor); setModalOpen(false); showToast(`${doctor.name} added to the medical expert panel.`) }} />}
    </div>
  )
}
