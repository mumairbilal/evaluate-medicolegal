import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { cases, patients as initialPatients } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import PageToolbar from '../components/PageToolbar'
import NewPatientModal from '../components/NewPatientModal'
import { useTableFilter } from '../hooks/useTableFilter'
import { loadPatients, savePatients } from '../utils/patientStorage'
import type { Patient } from '../types'

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients(initialPatients))
  const [modalOpen, setModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    savePatients(patients)
  }, [patients])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalOpen(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enrichedPatients = useMemo(() => patients.map((patient) => ({
    ...patient,
    linkedCases: cases.filter((c) => c.patient === patient.name).length,
  })), [patients])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable, tableSortOptions, activeTableSort, setActiveTableSort } =
    useTableFilter(enrichedPatients, ['name', 'dob', 'email', 'phone'], [
      { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
    ])

  return (
    <div>
      <PageToolbar
        searchPlaceholder="Search patients by name, DOB, email or phone..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        actionLabel="Create patient"
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Patient name</th>
                <th className="px-4 py-3 font-medium">Date of birth</th>
                <th className="px-4 py-3 font-medium">Contact information</th>
                <th className="px-4 py-3 font-medium">Linked cases</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/patients/${p.id}`} className="font-medium text-brand-600">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.dob}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{p.email}</p>
                    <p className="text-xs text-slate-400">{p.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.linkedCases}</td>
                  <td className="px-4 py-3 text-slate-500">{p.lastActivity ?? p.lastAppointment}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No patients match your search or filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <NewPatientModal
          existingPatients={patients}
          onClose={() => setModalOpen(false)}
          onUseExisting={(patient) => {
            setModalOpen(false)
            navigate(`/patients/${patient.id}`)
          }}
          onCreate={(p) => {
            setPatients((prev) => [p, ...prev])
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
