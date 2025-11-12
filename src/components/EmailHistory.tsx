import { useState, useEffect, useMemo } from 'react';
import { Mail, Calendar, User, Paperclip, CheckCircle, XCircle, Trash2, ExternalLink, Search, Filter, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailHistoryItem {
  id: string;
  meeting_id: string | null;
  recipients: string;
  cc_recipients: string | null;
  subject: string;
  method: string;
  html_body: string | null;
  attachments_count: number;
  total_attachments_size: number | null;
  status: string;
  error_message: string | null;
  message_id: string | null;
  sent_at: string;
  email_open_events?: Array<{
    recipient_email: string | null;
    opened_at: string;
  }>;
}

interface EmailHistoryProps {
  userId: string;
  onViewMeeting?: (meetingId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const EmailHistory = ({ userId, onViewMeeting }: EmailHistoryProps) => {
  const [emails, setEmails] = useState<EmailHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<EmailHistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openRecipientsEmailId, setOpenRecipientsEmailId] = useState<string | null>(null);
  
  // États des filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'gmail' | 'smtp'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'failed'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEmailHistory();
  }, [userId]);

  useEffect(() => {
    if (openRecipientsEmailId && expandedEmail !== openRecipientsEmailId) {
      setOpenRecipientsEmailId(null);
    }
  }, [expandedEmail, openRecipientsEmailId]);

  const loadEmailHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_history')
        .select('*, email_open_events(recipient_email, opened_at)')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(50); // Derniers 50 emails

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (!confirm('Supprimer cet email de l\'historique ?')) return;

    try {
      const { error } = await supabase
        .from('email_history')
        .delete()
        .eq('id', emailId);

      if (error) throw error;

      setEmails(emails.filter(e => e.id !== emailId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Il y a moins d\'une heure';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatExactDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      gmail: { color: 'bg-red-100 text-red-700', label: 'Gmail' },
      smtp: { color: 'bg-blue-100 text-blue-700', label: 'SMTP' },
      local: { color: 'bg-gray-100 text-gray-700', label: 'Local' }
    };
    const badge = badges[method as keyof typeof badges] || badges.local;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const parseRecipientList = (list: string | null) => {
    if (!list) return [] as string[];
    return list
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const buildRecipientStatuses = (email: EmailHistoryItem) => {
    const toRecipients = parseRecipientList(email.recipients).map(address => ({ email: address, type: 'À' }));
    const ccRecipients = parseRecipientList(email.cc_recipients).map(address => ({ email: address, type: 'CC' }));
    const recipients = [...toRecipients, ...ccRecipients];

    const openedMap = new Map<string, string>();
    (email.email_open_events || []).forEach(evt => {
      if (evt.recipient_email) {
        openedMap.set(evt.recipient_email.trim().toLowerCase(), evt.opened_at);
      }
    });

    return recipients.map(rec => {
      const key = rec.email.trim().toLowerCase();
      return {
        ...rec,
        openedAt: openedMap.get(key) || null,
      };
    });
  };

  // Fonction de filtrage
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // Filtre de recherche (sujet, destinataires)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSubject = email.subject.toLowerCase().includes(query);
        const matchesRecipients = email.recipients.toLowerCase().includes(query);
        const matchesCC = email.cc_recipients?.toLowerCase().includes(query);
        if (!matchesSubject && !matchesRecipients && !matchesCC) return false;
      }

      // Filtre de méthode
      if (filterMethod !== 'all' && email.method !== filterMethod) return false;

      // Filtre de statut
      if (filterStatus !== 'all' && email.status !== filterStatus) return false;

      // Filtre de date
      if (filterDateRange !== 'all') {
        const emailDate = new Date(email.sent_at);
        const now = new Date();
        const diffMs = now.getTime() - emailDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (filterDateRange === 'today' && diffHours > 24) return false;
        if (filterDateRange === 'week' && diffHours > 24 * 7) return false;
        if (filterDateRange === 'month' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }, [emails, searchQuery, filterMethod, filterStatus, filterDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

  const paginationRange = useMemo(() => {
    if (totalPages <= 1) {
      return [1] as Array<number | 'dots'>;
    }

    const range: Array<number | 'dots'> = [];
    const lastPage = totalPages;
    const delta = 1;

    const addPage = (page: number) => {
      if (!range.includes(page)) {
        range.push(page);
      }
    };

    addPage(1);

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(lastPage - 1, currentPage + delta);

    if (left > 2) {
      range.push('dots');
    }

    for (let page = left; page <= right; page++) {
      addPage(page);
    }

    if (right < lastPage - 1) {
      range.push('dots');
    }

    if (lastPage > 1) {
      addPage(lastPage);
    }

    return range;
  }, [currentPage, totalPages]);

  // Reset page quand les filtres changent
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMethod, filterStatus, filterDateRange]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMethod('all');
    setFilterStatus('all');
    setFilterDateRange('all');
  };

  const hasActiveFilters = searchQuery || filterMethod !== 'all' || filterStatus !== 'all' || filterDateRange !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">Aucun email envoyé</p>
        <p className="text-gray-400 text-sm mt-2">
          Vos emails apparaîtront ici après l'envoi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec compteur et bouton filtres */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-cocoa-900">
          Historique des emails ({filteredEmails.length}/{emails.length})
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            hasActiveFilters
              ? 'bg-coral-500 text-white hover:bg-coral-600'
              : 'bg-coral-100 text-coral-700 hover:bg-coral-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-white text-coral-600 rounded-full text-xs font-bold">
              {[searchQuery, filterMethod !== 'all', filterStatus !== 'all', filterDateRange !== 'all'].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-gradient-to-br from-coral-50 to-sunset-50 rounded-2xl p-6 border-2 border-coral-200 space-y-4 animate-slideDown">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par sujet, destinataire..."
              className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-coral-200 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cocoa-400 hover:text-cocoa-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filtres rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Méthode */}
            <div>
              <label className="block text-sm font-semibold text-cocoa-700 mb-2">
                Méthode d'envoi
              </label>
              <div className="relative">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-coral-200 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-all bg-white text-cocoa-800 font-semibold cursor-pointer hover:border-coral-300 hover:shadow-md appearance-none pr-10"
                >
                  <option value="all">Toutes</option>
                  <option value="gmail">Gmail</option>
                  <option value="smtp">SMTP</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coral-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-cocoa-700 mb-2">
                Statut
              </label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-coral-200 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-all bg-white text-cocoa-800 font-semibold cursor-pointer hover:border-coral-300 hover:shadow-md appearance-none pr-10"
                >
                  <option value="all">Tous</option>
                  <option value="sent">Envoyés</option>
                  <option value="failed">Échecs</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coral-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Période */}
            <div>
              <label className="block text-sm font-semibold text-cocoa-700 mb-2">
                Période
              </label>
              <div className="relative">
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-coral-200 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-all bg-white text-cocoa-800 font-semibold cursor-pointer hover:border-coral-300 hover:shadow-md appearance-none pr-10"
                >
                  <option value="all">Toutes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coral-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bouton réinitialiser */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-white text-coral-600 rounded-xl font-semibold hover:bg-coral-50 transition-all border-2 border-coral-200"
              >
                <X className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message si aucun résultat */}
      {filteredEmails.length === 0 && emails.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-gray-200">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Aucun email trouvé</p>
          <p className="text-gray-400 text-sm mt-2">
            Essayez de modifier vos filtres
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-all"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      <div className="space-y-3">
        {paginatedEmails.map((email) => {
          const recipientStatuses = buildRecipientStatuses(email);
          const totalRecipients = recipientStatuses.length;
          const openedCount = recipientStatuses.filter(r => r.openedAt).length;

          return (
            <div
              key={email.id}
              className="bg-white rounded-xl border-2 border-coral-100 hover:border-coral-300 transition-all overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Sujet */}
                    <div className="flex items-center gap-2 mb-2">
                      {email.status === 'sent' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <h4 className="font-semibold text-cocoa-900 truncate">
                        {email.subject}
                      </h4>
                    </div>

                    {/* Destinataires */}
                    <div className="flex items-center gap-2 text-sm text-cocoa-600 mb-2">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {email.recipients}
                        {email.cc_recipients && ` +${email.cc_recipients.split(',').length} CC`}
                      </span>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-cocoa-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(email.sent_at)}
                      </div>
                      {email.attachments_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {email.attachments_count} PJ ({formatSize(email.total_attachments_size)})
                        </div>
                      )}
                      {getMethodBadge(email.method)}
                      {totalRecipients > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-coral-50 border border-coral-200 px-2 py-0.5 text-coral-600 font-semibold">
                          <Eye className="w-3 h-3" />
                          {openedCount}/{totalRecipients} ouvert{openedCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {totalRecipients > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRecipientsEmailId(prev => prev === email.id ? null : email.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-coral-200 text-coral-600 hover:bg-coral-50 transition-colors text-xs font-semibold"
                        title="Voir le suivi des destinataires"
                      >
                        <Eye className="w-4 h-4" />
                        {openedCount}/{totalRecipients}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(email.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Détails étendus */}
              {expandedEmail === email.id && (
                <div className="border-t border-coral-100 bg-coral-50 p-4 space-y-3">
                  {email.cc_recipients && (
                    <div>
                      <span className="text-xs font-semibold text-cocoa-700">CC:</span>
                      <p className="text-sm text-cocoa-600 mt-1">{email.cc_recipients}</p>
                    </div>
                  )}

                  {email.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <span className="text-xs font-semibold text-red-700">Erreur:</span>
                      <p className="text-sm text-red-600 mt-1">{email.error_message}</p>
                    </div>
                  )}

                  {email.message_id && (
                    <div>
                      <span className="text-xs font-semibold text-cocoa-700">ID Message:</span>
                      <p className="text-xs text-cocoa-500 mt-1 font-mono">{email.message_id}</p>
                    </div>
                  )}

                  {totalRecipients > 0 && (
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRecipientsEmailId(prev => prev === email.id ? null : email.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-coral-200 rounded-lg text-sm font-semibold text-coral-600 hover:bg-coral-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Suivi des destinataires
                      </button>
                      {openRecipientsEmailId === email.id && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs uppercase text-cocoa-500 tracking-wide">
                                <th className="py-2 pr-4">Destinataire</th>
                                <th className="py-2 pr-4">Type</th>
                                <th className="py-2 pr-4">Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recipientStatuses.map((recipient) => (
                                <tr key={`${email.id}-${recipient.type}-${recipient.email}`} className="border-t border-coral-100">
                                  <td className="py-2 pr-4 font-medium text-cocoa-800">{recipient.email}</td>
                                  <td className="py-2 pr-4 text-cocoa-500">{recipient.type}</td>
                                  <td className="py-2 pr-4">
                                    {recipient.openedAt ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-600 font-semibold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Ouvert
                                      </span>
                                      <p className="text-xs text-cocoa-500">
                                        {formatExactDateTime(recipient.openedAt)}
                                      </p>
                                    </div>
                                   ) : (
                                     <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-gray-500 font-semibold">
                                       <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                       Pas encore ouvert
                                     </span>
                                   )}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 )}

                 <div className="flex flex-wrap gap-3">
                   {email.meeting_id && onViewMeeting && (
                     <button
                       onClick={() => onViewMeeting(email.meeting_id!)}
                       className="inline-flex items-center gap-2 text-sm text-coral-600 hover:text-coral-700 font-medium hover:underline"
                     >
                       <ExternalLink className="w-4 h-4" />
                       Voir la réunion associée
                     </button>
                   )}

                   {email.html_body && (
                     <button
                       onClick={() => setPreviewEmail(email)}
                       className="inline-flex items-center gap-2 text-sm text-sunset-600 hover:text-sunset-700 font-medium hover:underline"
                     >
                       <Mail className="w-4 h-4" />
                       Prévisualiser l'email
                     </button>
                   )}
                 </div>
               </div>
             )}
           </div>
         );
       })}
     </div>

     {/* Pagination */}
     {totalPages > 1 && (
       <div className="flex items-center justify-between mt-6 px-2">
         <div className="text-sm text-cocoa-600">
           Page {currentPage} sur {totalPages} • {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
         </div>
         <nav className="flex items-center gap-2" aria-label="Pagination des emails">
           <button
             onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
             disabled={currentPage === 1}
             className="h-10 w-10 flex items-center justify-center rounded-full border border-coral-200 text-coral-700 hover:bg-coral-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
             aria-label="Page précédente"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           <div className="flex items-center gap-1">
             {paginationRange.map((item, index) => (
               item === 'dots' ? (
                 <span key={`dots-${index}`} className="px-2 text-sm font-medium text-cocoa-400">...</span>
               ) : (
                 <button
                   key={`page-${item}`}
                   onClick={() => setCurrentPage(item)}
                   className={`min-w-[2.5rem] h-10 px-3 rounded-full text-sm font-semibold transition-all ${
                     currentPage === item
                       ? 'bg-coral-500 text-white shadow-md'
                       : 'border border-coral-200 text-coral-700 hover:bg-coral-100'
                   }`}
                   aria-current={currentPage === item ? 'page' : undefined}
                 >
                   {item}
                 </button>
               )
             ))}
           </div>
           <button
             onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
             disabled={currentPage === totalPages}
             className="h-10 w-10 flex items-center justify-center rounded-full border border-coral-200 text-coral-700 hover:bg-coral-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
             aria-label="Page suivante"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
         </nav>
       </div>
     )}

     {/* Modal de prévisualisation */}
     {previewEmail && (
       <div 
         className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={() => setPreviewEmail(null)}
       >
         <div 
           className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           onClick={(e) => e.stopPropagation()}
         >
           {/* Header */}
           <div className="p-6 border-b border-coral-100 bg-gradient-to-r from-coral-50 to-sunset-50">
             <div className="flex items-start justify-between gap-4">
               <div className="flex-1">
                 <h3 className="text-xl font-bold text-cocoa-900 mb-2">
                   {previewEmail.subject}
                 </h3>
                 <div className="space-y-1 text-sm text-cocoa-600">
                   <div className="flex items-center gap-2">
                     <span className="font-semibold">À:</span>
                     <span>{previewEmail.recipients}</span>
                   </div>
                   {previewEmail.cc_recipients && (
                     <div className="flex items-center gap-2">
                       <span className="font-semibold">CC:</span>
                       <span>{previewEmail.cc_recipients}</span>
                     </div>
                   )}
                   <div className="flex items-center gap-3">
                     <span>{formatDate(previewEmail.sent_at)}</span>
                     {getMethodBadge(previewEmail.method)}
                     {previewEmail.first_opened_at && (
                       <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-600 font-semibold">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         Ouvert {formatExactDateTime(previewEmail.first_opened_at)}{previewEmail.first_opened_recipient ? ` • ${previewEmail.first_opened_recipient}` : ''}
                       </span>
                     )}
                     {previewEmail.attachments_count > 0 && (
                       <span className="flex items-center gap-1">
                         <Paperclip className="w-3 h-3" />
                         {previewEmail.attachments_count} PJ
                       </span>
                     )}
                   </div>
                 </div>
               </div>
               <button
                 onClick={() => setPreviewEmail(null)}
                 className="text-cocoa-400 hover:text-cocoa-600 transition-colors"
               >
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
           </div>

           {/* Corps de l'email */}
           <div className="flex-1 overflow-y-auto p-6">
             <div 
               className="prose prose-sm max-w-none"
               dangerouslySetInnerHTML={{ __html: previewEmail.html_body || '' }}
             />
           </div>

           {/* Footer */}
           <div className="p-4 border-t border-coral-100 bg-gray-50 flex justify-end">
             <button
               onClick={() => setPreviewEmail(null)}
               className="px-6 py-2 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-colors"
             >
               Fermer
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

