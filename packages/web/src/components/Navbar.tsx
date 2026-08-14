import React, { useEffect, useState } from 'react';
import {
  Feather,
  History,
  Settings as SettingsIcon,
  Chrome,
  Sun,
  Moon,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { WebSettings } from '../types';
import { webRateLimiter } from '../services/rate-limiter';

interface NavbarProps {
  settings: WebSettings;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenExtensionGuide: () => void;
  onToggleTheme: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenSettings,
  onOpenHistory,
  onOpenExtensionGuide,
  onToggleTheme,
  historyCount,
}) => {
  const [rateLimit, setRateLimit] = useState(webRateLimiter.getState());

  useEffect(() => {
    return webRateLimiter.subscribe(setRateLimit);
  }, []);

  const tokenPercent = Math.max(0, Math.min(100, (rateLimit.tokensRemaining / rateLimit.maxTokens) * 100));

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Brand Mark & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <img
            src="/logo.png"
            alt="WriteFix AI"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '18px',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              WriteFix
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)',
              }}
            >
              Studio
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-1px' }}>
            Executive Writing & Grammar Suite
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Rate limit status pill */}
        <div
          title={
            rateLimit.isThrottled
              ? `Cooldown active: ${rateLimit.cooldownSeconds}s remaining`
              : `Token Budget: ${rateLimit.tokensRemaining} of ${rateLimit.maxTokens} available`
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: rateLimit.isThrottled ? 'var(--danger-bg)' : 'var(--bg-surface-elevated)',
            border: `1px solid ${rateLimit.isThrottled ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
            fontSize: '12px',
            color: rateLimit.isThrottled ? 'var(--danger)' : 'var(--text-secondary)',
          }}
        >
          <Zap size={13} color={rateLimit.isThrottled ? 'var(--danger)' : 'var(--accent-amber)'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600 }}>
              {rateLimit.isThrottled ? `${rateLimit.cooldownSeconds}s Cooldown` : `${rateLimit.tokensRemaining}/${rateLimit.maxTokens}`}
            </span>
            {!rateLimit.isThrottled && (
              <div
                style={{
                  width: '36px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--border-subtle)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${tokenPercent}%`,
                    height: '100%',
                    backgroundColor: tokenPercent < 25 ? 'var(--danger)' : 'var(--primary)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Provider Badge */}
        <button
          onClick={onOpenSettings}
          title="Active AI Provider. Click to configure API keys & models."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {settings.activeProvider.replace('-', ' ')}
          </span>
          <SlidersHorizontal size={12} color="var(--text-muted)" style={{ marginLeft: '2px' }} />
        </button>

        {/* Extension Guide */}
        <button
          onClick={onOpenExtensionGuide}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 13px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <Chrome size={14} color="var(--primary)" />
          <span>Chrome Extension</span>
        </button>

        {/* History */}
        <button
          onClick={onOpenHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 13px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <History size={14} color="var(--text-secondary)" />
          <span>History</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-hover)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            {historyCount}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={settings.theme === 'light' ? 'Switch to Dark Obsidian Theme' : 'Switch to Light Alabaster Theme'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {settings.theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings & API Keys"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <SettingsIcon size={15} />
        </button>
      </div>
    </header>
  );
};
