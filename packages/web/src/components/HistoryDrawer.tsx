import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { WebStorage } from '../services/storage';
import {
  X,
  Search,
  Star,
  Trash2,
  RotateCcw,
  Download,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onHistoryChange: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onRestore,
  onHistoryChange,
}) => {
  const [search, setSearch] = useState('');
  const [filterFav, setFilterFav] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const historyList = WebStorage.getHistory();

  if (!isOpen) return null;

  const filtered = historyList.filter((item) => {
    if (filterFav && !item.favorite) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return item.originalText.toLowerCase().includes(q) || item.correctedText.toLowerCase().includes(q);
  });

  const handleToggleFavorite = (id: string) => {
    WebStorage.toggleFavoriteHistory(id);
    onHistoryChange();
  };

  const handleDelete = (id: string) => {
    WebStorage.deleteHistory(id);
    onHistoryChange();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history entries? This cannot be undone.')) {
      WebStorage.clearHistory();
      onHistoryChange();
    }
  };

  const handleCopyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(historyList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writefix_history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 90,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '460px',
          maxWidth: '100vw',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
              Revision History
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface-hover)',
                color: 'var(--text-secondary)',
              }}
            >
              {historyList.length}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search past revisions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setFilterFav(!filterFav)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${filterFav ? 'var(--accent-amber-border)' : 'var(--border-subtle)'}`,
                backgroundColor: filterFav ? 'var(--accent-amber-subtle)' : 'var(--bg-surface-elevated)',
                color: filterFav ? 'var(--accent-amber)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Star size={12} fill={filterFav ? 'var(--accent-amber)' : 'none'} />
              <span>Starred Only</span>
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleExportJSON}
                title="Export history as JSON"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Download size={12} />
                Export
              </button>

              {historyList.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Clear all history"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    color: 'var(--danger)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Item Cards List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Clock size={32} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                  No history records found
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {search ? 'Try adjusting your search query' : 'Your corrected drafts will be automatically saved here'}
                </div>
              </div>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="premium-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary-border)',
                      }}
                    >
                      {item.mode.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'none',
                        color: item.favorite ? 'var(--accent-amber)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <Star size={14} fill={item.favorite ? 'var(--accent-amber)' : 'none'} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete entry"
                      style={{
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Excerpt */}
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.correctedText || item.originalText}
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.wordCount} words
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopyText(item.id, item.correctedText || item.originalText)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === item.id ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onRestore(item);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--primary-border)',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
