import { useState } from 'react';
import type { AppInfo } from '../types';
import {
  PlayIcon,
  HuaweiIcon,
  ExternalLinkIcon,
  CheckIcon,
  AlertIcon,
  XIcon,
  BugIcon,
} from './icons';

interface ResultsTableProps {
  results: AppInfo[];
}

const defaultPlayUrl = (pkg: string) =>
  `https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}`;

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
        <table className="table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Package Name</th>
              <th>App Name</th>
              <th>Publisher</th>
              <th>Category</th>
              <th>Play Store</th>
              <th>AppGallery</th>
              <th>App ID</th>
              <th>Status</th>
              <th>Debug</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => {
              const play = result.googlePlay;
              const ag = result.huaweiAppGallery;
              const hasPlay = !!play?.version;
              const playUrl = play?.playStoreUrl || defaultPlayUrl(result.packageName);
              const hasAg = !!ag?.version;

              return (
                <>
                  <tr key={idx}>
                    <td className="text-[var(--ink-faint)]">{idx + 1}</td>
                    <td>
                      <span className="font-mono text-[13px] text-sky-700">
                        {result.packageName}
                      </span>
                    </td>
                    <td className="font-medium text-[var(--ink)]">{result.appName || '-'}</td>
                    <td className="text-emerald-700">{result.publisherName || '-'}</td>
                    <td>
                      <span className="chip">{result.category || '-'}</span>
                    </td>

                    {/* Play Store — clickable version opens the Play Store page */}
                    <td>
                      {hasPlay ? (
                        <div className="flex flex-col gap-1 items-start">
                          <a
                            href={playUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-glass link-play"
                            title={`Buka ${playUrl}`}
                          >
                            <PlayIcon className="w-3 h-3 shrink-0" />
                            {play!.version}
                            <ExternalLinkIcon className="w-3 h-3 opacity-60" />
                          </a>
                          {(() => {
                            const src = play!.source || result.source;
                            if (!src) return null;
                            const isPrimary = /googleplayscraper|playstoredesktop|devicesimulation/i.test(src);
                            return (
                              <span
                                className={`chip ${isPrimary ? 'chip-ok' : 'chip-neutral'} !text-[9px] !py-0.5`}
                                title={isPrimary ? 'Version from Google Play directly' : `Fallback source: ${src}`}
                              >
                                {isPrimary ? 'Play Store' : src}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="chip chip-neutral">
                          {play?.error ? 'Not found' : '-'}
                        </span>
                      )}
                    </td>

                    {/* AppGallery — clickable version opens the AppGallery page */}
                    <td>
                      {hasAg ? (
                        <div className="flex flex-col gap-1 items-start">
                          <a
                            href={ag!.appGalleryUrl || 'https://appgallery.huawei.com/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-glass link-ag"
                            title={ag!.appGalleryUrl}
                          >
                            <HuaweiIcon className="w-3 h-3 shrink-0" />
                            {ag!.version}
                            <ExternalLinkIcon className="w-3 h-3 opacity-60" />
                          </a>
                          {ag!.downloadCount ? (
                            <span className="text-[10px] text-[var(--ink-faint)] pl-1">
                              {ag!.downloadCount} downloads
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="chip chip-neutral">
                          {ag?.error ? 'Not found' : '-'}
                        </span>
                      )}
                    </td>

                    {/* AppGallery App ID — clickable, opens the AppGallery page */}
                    <td>
                      {hasAg && ag!.appGalleryAppId ? (
                        <a
                          href={ag!.appGalleryUrl || `https://appgallery.huawei.com/app/${ag!.appGalleryAppId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-glass link-ag font-mono !text-[12px]"
                          title={`Buka ${ag!.appGalleryUrl || ag!.appGalleryAppId}`}
                        >
                          {ag!.appGalleryAppId}
                          <ExternalLinkIcon className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="chip chip-neutral">-</span>
                      )}
                    </td>

                    <td>
                      {result.error ? (
                        <span className="chip chip-fail">
                          <AlertIcon className="w-3.5 h-3.5" />
                          {result.error.length > 28 ? `${result.error.slice(0, 28)}…` : result.error}
                        </span>
                      ) : (
                        <span className="chip chip-ok">
                          <CheckIcon className="w-3.5 h-3.5" />
                          OK
                        </span>
                      )}
                    </td>
                    <td>
                      {result.debug_steps && (
                        <button
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          className="btn btn-ghost !px-3 !py-1 !text-xs"
                        >
                          <BugIcon className="w-3.5 h-3.5" />
                          {expandedRow === idx ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === idx && result.debug_steps && (
                    <tr className="bg-slate-100/70">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="text-xs font-mono space-y-1.5">
                          <div className="font-semibold text-[var(--ink-muted)] mb-2 uppercase tracking-wider text-[10px]">
                            Debug Steps
                          </div>
                          {Object.entries(result.debug_steps).map(([step, status]) => {
                            const statusStr = String(status);
                            const ok = statusStr.startsWith('Success');
                            const fail = statusStr.startsWith('Failed');
                            return (
                              <div key={step} className="flex gap-2 items-center">
                                <span
                                  className={
                                    ok
                                      ? 'text-emerald-400'
                                      : fail
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }
                                >
                                  {ok ? (
                                    <CheckIcon className="w-3.5 h-3.5" />
                                  ) : fail ? (
                                    <XIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <AlertIcon className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <span className="text-sky-700 min-w-[110px]">{step}:</span>
                                <span className="text-[var(--ink-muted)]">{statusStr}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
