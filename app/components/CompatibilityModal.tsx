import React, { useState, useMemo } from 'react'
import { X, Search, CheckCircle, AlertCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Requisition } from '@/lib/types/requisitions'
import { MatchResult } from '@/lib/candidates'

interface CompatibilityModalProps {
  isOpen: boolean
  onClose: () => void
  requisitions: Requisition[]
  onAnalyze: (req: Requisition) => MatchResult
  candidateName: string
}

export default function CompatibilityModal({ 
  isOpen, 
  onClose, 
  requisitions, 
  onAnalyze,
  candidateName
}: CompatibilityModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => 
      (req.puesto_requerido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.departamento || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requisitions, searchTerm])

  if (!isOpen) return null

  const handleSelect = (req: Requisition) => {
    setSelectedReq(req)
    const res = onAnalyze(req)
    setResult(res)
  }

  const handleBack = () => {
    setSelectedReq(null)
    setResult(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedReq ? 'Resultado del Análisis' : 'Análisis de Compatibilidad'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedReq ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona una plaza aprobada para evaluar la compatibilidad de <strong>{candidateName}</strong>.
              </p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por puesto o departamento..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              <div className="space-y-2 mt-2">
                {filteredRequisitions.length > 0 ? (
                  filteredRequisitions.map(req => (
                    <button
                      key={req.id}
                      onClick={() => handleSelect(req)}
                      className="w-full text-left p-3 rounded-md border border-gray-200 hover:border-brand-accent hover:bg-brand-light/10 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-brand-dark">{req.puesto_requerido || 'Sin puesto'}</h4>
                          <p className="text-xs text-gray-500">{req.departamento || 'Sin departamento'} • {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Aprobada
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No se encontraron requisiciones aprobadas que coincidan con tu búsqueda.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-bold text-gray-900">{selectedReq.puesto_requerido || 'Sin puesto'}</h4>
                  <p className="text-sm text-gray-600">{selectedReq.departamento || 'Sin departamento'}</p>
                </div>
                <button  
                  onClick={handleBack}
                  className="text-sm text-brand-dark hover:underline flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Cambiar plaza
                </button>
              </div>

              {result && (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center border-8 text-4xl font-bold ${
                      result.score >= 80 ? 'border-green-500 text-green-600' :
                      result.score >= 50 ? 'border-yellow-500 text-yellow-600' :
                      'border-red-500 text-red-600'
                    }`}>
                      {result.score}%
                    </div>
                    <span className="text-sm font-medium text-gray-500 mt-3">Coincidencia Estimada</span>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 border-b pb-2">Detalle de coincidencias</h5>
                    {result.matches.map((match, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                        {match.status === 'match' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                        {match.status === 'partial' && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                        {match.status === 'missing' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-900">{match.item}</p>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{match.category}</span>
                          </div>
                          
                          {match.details && (
                            <p className="text-xs text-gray-600 mt-1">Requerido: {match.details}</p>
                          )}

                          {(match.reason || match.candidateValue) && (
                            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {match.reason && (
                                <div className="text-red-600">
                                  <span className="font-semibold">Razón:</span> {match.reason}
                                </div>
                              )}
                              {match.candidateValue && (
                                <div className="text-gray-600">
                                  <span className="font-semibold">Candidato:</span> {match.candidateValue}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.matches.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No se encontraron criterios específicos para evaluar.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
