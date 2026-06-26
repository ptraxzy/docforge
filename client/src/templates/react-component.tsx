import React, { useState, useEffect, useRef } from 'react';

interface DocPage {
  title: string;
  html: string;
  toc: Array<{ text: string; id: string; level: number }>;
  plainText: string;
}

declare global {
  interface Window {
    Prism?: {
      highlightAll: () => void;
    };
  }
}

// Global placeholder injected by compiler
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DOCS_DATA: Record<string, DocPage> = __DOCS_DATA_PLACEHOLDER__;

export default function Docs() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const keys = Object.keys(DOCS_DATA);
    return keys[0] || '';
  });
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ key: string; title: string; snippet: string }>>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>(() => {
    const keys = Object.keys(DOCS_DATA);
    const initial: Record<string, boolean> = {};
    if (keys.length > 0) {
      initial[keys[0]] = true;
    }
    return initial;
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  // Parse HTML into sections divided by H2 headings
  const getSections = (htmlStr: string): Array<{ title: string; html: string }> => {
    if (!htmlStr) return [];
    const parts = htmlStr.split(/<h2(?=\s|>)/);
    const result: Array<{ title: string; html: string }> = [];
    
    // Check if there is introduction text before the first H2
    const hasIntro = parts[0] && parts[0].trim().length > 0;
    if (hasIntro) {
      result.push({
        title: 'Overview',
        html: parts[0]
      });
    }
    
    for (let i = 1; i < parts.length; i++) {
      const sectionHtml = '<h2' + parts[i];
      const match = sectionHtml.match(/<h2[^>]*>(.*?)<\/h2>/);
      const title = match ? match[1].replace(/<[^>]*>/g, '') : `Section ${i}`;
      result.push({
        title: title,
        html: sectionHtml
      });
    }
    
    if (result.length === 0) {
      result.push({
        title: 'Overview',
        html: htmlStr
      });
    }
    
    return result;
  };

  const activeDoc = DOCS_DATA[activeTab] || { title: '', html: '', toc: [] };
  const sections = getSections(activeDoc.html);

  // Dynamically load Prism.js if not loaded, then highlight
  const highlightCode = () => {
    setTimeout(() => {
      if (window.Prism) {
        window.Prism.highlightAll();
      } else {
        // Load Prism via script tag dynamically if it doesn't exist
        const scriptId = 'prism-js-cdn';
        if (!document.getElementById(scriptId)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
          script.onload = () => {
            // Load autoloader
            const autoloader = document.createElement('script');
            autoloader.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
            autoloader.onload = () => {
              if (window.Prism) window.Prism.highlightAll();
            };
            document.body.appendChild(autoloader);
          };
          document.body.appendChild(script);
        }
      }

      // Append code blocks copy buttons
      const preBlocks = document.querySelectorAll('pre');
      preBlocks.forEach((pre) => {
        if (pre.querySelector('.copy-btn')) return;
        pre.style.position = 'relative';
        const button = document.createElement('button');
        button.className = 'copy-btn absolute right-3 top-3 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-400 hover:text-white backdrop-blur opacity-0 transition-opacity duration-150';
        button.textContent = 'Copy';
        
        pre.addEventListener('mouseenter', () => button.classList.remove('opacity-0'));
        pre.addEventListener('mouseleave', () => button.classList.add('opacity-0'));
        
        button.addEventListener('click', () => {
          const code = pre.querySelector('code')?.innerText || '';
          navigator.clipboard.writeText(code).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => { button.textContent = 'Copy'; }, 2000);
          });
        });
        pre.appendChild(button);
      });
    }, 50);
  };

  // Initialize and check window/localStorage on mount to prevent SSR hydration mismatch
  useEffect(() => {
    const keys = Object.keys(DOCS_DATA);
    if (keys.length > 0) {
      const fullHash = typeof window !== 'undefined' ? window.location.hash : '';
      const parts = fullHash.slice(2).split('#');
      const hash = parts[0];
      const sectionId = parts[1];

      let initialActive = keys[0];
      if (keys.includes(hash)) {
        initialActive = hash;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initialActive);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedDocs({ [initialActive]: true });

      if (sectionId) {
        const docSections = getSections(DOCS_DATA[initialActive].html);
        const sIdx = docSections.findIndex(s => s.html.includes(`id="${sectionId}"`) || s.html.includes(`id='${sectionId}'`));
        if (sIdx !== -1) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveSectionIdx(sIdx);
        }
      }
    }

    const savedDark = typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkMode(savedDark);
  }, []);

  // Handle outside click for search
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen for external hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash;
      const parts = fullHash.slice(2).split('#');
      const tabKey = parts[0];
      const sectionId = parts[1];

      if (DOCS_DATA[tabKey]) {
        setActiveTab(tabKey);
        setExpandedDocs(prev => ({
          ...prev,
          [tabKey]: true
        }));
        
        if (sectionId) {
          const docSections = getSections(DOCS_DATA[tabKey].html);
          const sIdx = docSections.findIndex(s => s.html.includes(`id="${sectionId}"`) || s.html.includes(`id='${sectionId}'`));
          if (sIdx !== -1) {
            setActiveSectionIdx(sIdx);
            return;
          }
        }
        setActiveSectionIdx(0);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top of article container when page/section changes
  useEffect(() => {
    if (articleRef.current) {
      articleRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [activeTab, activeSectionIdx]);

  // Sync active tab state changes
  useEffect(() => {
    if (activeTab) {
      window.location.hash = '/' + activeTab;
      highlightCode();
      setTimeout(() => {
        setMobileSidebarOpen(false);
      }, 0);
    }
  }, [activeTab]);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Scroll Spy logic for active Table of Contents (TOC) link
  useEffect(() => {
    const handleScroll = () => {
      const headings = Array.from(document.querySelectorAll('article h2, article h3'));
      let currentSection = '';
      
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top < 150) {
          currentSection = heading.id;
        } else {
          break;
        }
      }
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, activeSectionIdx]);

  // Filter TOC to only show items that are inside the active paginated section
  const getActiveSectionToc = () => {
    if (!activeDoc.toc) return [];
    const result = [];
    let currentH2Index = -1;
    const parts = activeDoc.html.split(/<h2(?=\s|>)/);
    const hasIntro = parts[0] && parts[0].trim().length > 0;
    
    for (const item of activeDoc.toc) {
      if (item.level === 2) {
        currentH2Index++;
      }
      const itemSectionIdx = hasIntro ? currentH2Index + 1 : currentH2Index;
      const normalizedIdx = Math.max(0, itemSectionIdx);
      
      if (normalizedIdx === activeSectionIdx) {
        result.push(item);
      }
    }
    return result;
  };

  const activeSectionToc = getActiveSectionToc();



  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const query = val.toLowerCase();
    const results = Object.entries(DOCS_DATA)
      .filter(([, doc]) => doc.plainText.toLowerCase().includes(query) || doc.title.toLowerCase().includes(query))
      .map(([key, doc]) => {
        const index = doc.plainText.toLowerCase().indexOf(query);
        let snippet = doc.plainText.slice(Math.max(0, index - 30), Math.min(doc.plainText.length, index + 50));
        if (snippet.length < doc.plainText.length) {
          snippet = '...' + snippet + '...';
        }
        return {
          key,
          title: doc.title,
          snippet
        };
      });
    setSearchResults(results);
  };

  const handleSelectResult = (key: string) => {
    setActiveTab(key);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-[var(--doc-bg)] text-[var(--doc-text)] font-sans transition-colors duration-200 antialiased">
      <style>{`
        :root {
          --doc-primary: #6366f1; /* Indigo-500 */
          --doc-primary-hover: #4f46e5;
          --doc-primary-bg: #e0e7ff;
          --doc-bg: #f8fafc;
          --doc-card-bg: #ffffff;
          --doc-text: #0f172a;
          --doc-text-muted: #475569;
          --doc-border: #e2e8f0;
          --doc-header-bg: rgba(255, 255, 255, 0.8);
        }
        .dark {
          --doc-primary: #818cf8; /* Indigo-400 */
          --doc-primary-hover: #a5b4fc;
          --doc-primary-bg: rgba(99, 102, 241, 0.15);
          --doc-bg: #090d16;
          --doc-card-bg: #0f172a;
          --doc-text: #f1f5f9;
          --doc-text-muted: #94a3b8;
          --doc-border: #1e293b;
          --doc-header-bg: rgba(9, 13, 22, 0.8);
        }

        /* Complete Typography & Layout resets for Markdown HTML inside .prose */
        .prose h1 {
          font-size: 2.25rem !important;
          font-weight: 800 !important;
          line-height: 1.25 !important;
          margin-top: 0 !important;
          margin-bottom: 1.5rem !important;
          color: var(--doc-text) !important;
          letter-spacing: -0.025em !important;
        }
        .prose h2 {
          font-size: 1.75rem !important;
          font-weight: 700 !important;
          line-height: 1.35 !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1rem !important;
          padding-bottom: 0.5rem !important;
          border-bottom: 1px solid var(--doc-border) !important;
          color: var(--doc-text) !important;
          letter-spacing: -0.02em !important;
        }
        .prose h3 {
          font-size: 1.35rem !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
          color: var(--doc-text) !important;
        }
        .prose p {
          font-size: 1rem !important;
          line-height: 1.75 !important;
          margin-top: 0 !important;
          margin-bottom: 1.25rem !important;
          color: var(--doc-text-muted) !important;
        }
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 1.25rem !important;
        }
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 1.25rem !important;
        }
        .prose li {
          margin-top: 0.4rem !important;
          margin-bottom: 0.4rem !important;
          color: var(--doc-text-muted) !important;
          line-height: 1.65 !important;
        }
        .prose strong {
          font-weight: 700 !important;
          color: var(--doc-text) !important;
        }
        .prose a {
          color: var(--doc-primary) !important;
          text-decoration: none !important;
          font-weight: 500 !important;
          border-bottom: 1px dashed var(--doc-primary);
          transition: all 0.2s ease;
        }
        .prose a:hover {
          color: var(--doc-primary-hover) !important;
          border-bottom-style: solid;
        }
        .prose hr {
          border: 0 !important;
          border-top: 1px solid var(--doc-border) !important;
          margin: 2.5rem 0 !important;
        }

        /* Sidebar Navigation Hover Effects */
        .sidebar-btn {
          border-left: 3px solid transparent;
          transition: all 0.2s ease-in-out;
        }
        .sidebar-btn-active {
          background-color: var(--doc-primary-bg) !important;
          color: var(--doc-primary) !important;
          border-left-color: var(--doc-primary) !important;
          font-weight: 600;
        }
        .sidebar-btn:hover:not(.sidebar-btn-active) {
          background-color: rgba(99, 102, 241, 0.05) !important;
          color: var(--doc-text) !important;
          transform: translateX(2px);
        }

        /* Table of Contents Styling */
        .toc-link {
          border-left: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .toc-link:hover {
          color: var(--doc-primary) !important;
          border-left-color: var(--doc-border) !important;
        }
        .toc-link-active {
          color: var(--doc-primary) !important;
          border-left-color: var(--doc-primary) !important;
          font-weight: 600;
        }

        /* Prose Code Block Overrides */
        .prose pre[class*="language-"] {
          background-color: #0c1017 !important;
          border: 1px solid var(--doc-border);
          border-radius: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .prose pre[class*="language-"] code {
          background-color: transparent !important;
          color: #e2e8f0 !important;
          padding: 0 !important;
          border-radius: 0 !important;
          font-size: 0.875rem !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .prose code:not(pre code) {
          color: var(--doc-primary) !important;
          background-color: var(--doc-primary-bg) !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
        }

        /* Alert/Callout Blocks Styling */
        .prose blockquote {
          border-left: 4px solid var(--doc-primary) !important;
          background-color: var(--doc-primary-bg) !important;
          color: var(--doc-text) !important;
          padding: 1rem 1.25rem !important;
          border-radius: 8px;
          font-style: normal !important;
          quotes: none !important;
          margin: 1.5rem 0 !important;
        }
        .prose blockquote p::before, .prose blockquote p::after {
          content: none !important;
        }

        /* Modern Table Styling */
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-size: 0.9rem;
        }
        .prose th {
          border-bottom: 2px solid var(--doc-border) !important;
          color: var(--doc-text) !important;
          font-weight: 600 !important;
          padding: 0.75rem 1rem !important;
          background-color: rgba(99, 102, 241, 0.02);
        }
        .prose td {
          border-bottom: 1px solid var(--doc-border) !important;
          padding: 0.75rem 1rem !important;
          color: var(--doc-text-muted) !important;
        }
        .prose tr:hover {
          background-color: rgba(99, 102, 241, 0.02);
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--doc-border)] bg-[var(--doc-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="rounded-lg p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 lg:hidden" aria-label="Toggle menu">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-display text-xl font-bold tracking-tight text-[var(--doc-primary)]">DocForge Docs</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div ref={searchContainerRef} className="relative w-48 sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search documents..." 
                className="w-full rounded-lg border border-[var(--doc-border)] bg-slate-200/40 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 hover:bg-slate-200/70 focus:border-[var(--doc-primary)] focus:bg-[var(--doc-card-bg)] dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
              />
              
              {searchResults.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-[var(--doc-border)] bg-[var(--doc-card-bg)] p-2 shadow-xl ring-1 ring-black/5">
                  {searchResults.map((result) => (
                    <button key={result.key} onClick={() => handleSelectResult(result.key)} className="flex w-full flex-col gap-1 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                      <span className="text-sm font-semibold text-[var(--doc-primary)]">{result.title}</span>
                      <span className="text-xs text-[var(--doc-text-muted)]">{result.snippet}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode */}
            <button onClick={() => setDarkMode(!darkMode)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50" aria-label="Toggle dark mode">
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          
          {/* Left Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-[var(--doc-border)] bg-[var(--doc-card-bg)] px-4 pt-20 transition-transform duration-200 ease-in-out lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:border-none lg:bg-transparent lg:px-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <nav className="space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-[var(--doc-text-muted)] mb-2">Documentation</p>
              {Object.entries(DOCS_DATA).map(([key, doc]) => {
                const isDocActive = activeTab === key;
                const isExpanded = expandedDocs[key];
                const docSections = getSections(doc.html);
                
                return (
                  <div key={key} className="space-y-1">
                    <button 
                      onClick={() => {
                        if (activeTab === key) {
                          setExpandedDocs(prev => ({
                            ...prev,
                            [key]: !prev[key]
                          }));
                        } else {
                          setActiveTab(key);
                          setActiveSectionIdx(0);
                          setExpandedDocs(prev => ({
                            ...prev,
                            [key]: true
                          }));
                        }
                      }} 
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm sidebar-btn ${isDocActive ? 'sidebar-btn-active font-semibold' : 'text-[var(--doc-text-muted)]'}`}
                    >
                      <div className="flex items-center min-w-0">
                        <svg className="mr-3 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate text-left">{doc.title}</span>
                      </div>
                      {docSections.length > 1 && (
                        <svg 
                          className={`h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>

                    {/* Sub-sections (H2 nested tree) */}
                    {isExpanded && docSections.length > 1 && (
                      <div className="ml-5 border-l border-[var(--doc-border)] pl-3 py-1 space-y-1">
                        {docSections.map((sec, idx) => {
                          const isSectionActive = isDocActive && activeSectionIdx === idx;
                          return (
                            <div key={idx} className="space-y-1">
                              <button
                                onClick={() => {
                                  setActiveTab(key);
                                  setActiveSectionIdx(idx);
                                }}
                                className={`flex w-full items-center py-1.5 pr-3 text-xs rounded-r-md transition-all text-left ${isSectionActive ? 'text-[var(--doc-primary)] font-semibold border-l-2 border-[var(--doc-primary)] -ml-[13px] pl-[11px]' : 'text-[var(--doc-text-muted)] hover:text-[var(--doc-text)]'}`}
                              >
                                <span className="truncate">{idx + 1}. {sec.title}</span>
                              </button>

                              {/* H3 Sub-headings inside active H2 */}
                              {isSectionActive && activeSectionToc && activeSectionToc.filter(item => item.level === 3).length > 0 && (
                                <div className="ml-3 border-l border-slate-200 dark:border-slate-800 pl-2.5 py-0.5 space-y-1">
                                  {activeSectionToc.filter(item => item.level === 3).map((h3) => {
                                    const isH3Active = activeSection === h3.id;
                                    return (
                                      <button
                                        key={h3.id}
                                        onClick={() => {
                                          const element = document.getElementById(h3.id);
                                          if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            window.location.hash = '/' + activeTab + '#' + h3.id;
                                          }
                                        }}
                                        className={`flex w-full items-center py-1 text-[11px] transition-all text-left ${isH3Active ? 'text-[var(--doc-primary)] font-semibold' : 'text-[var(--doc-text-muted)] hover:text-[var(--doc-text)]'}`}
                                      >
                                        <span className="truncate">{h3.text}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Center Content */}
          <main className="min-w-0 flex-1 py-8 lg:py-12">
            <article ref={articleRef} className="prose max-w-4xl dark:prose-invert prose-slate prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-a:text-[var(--doc-primary)] hover:prose-a:underline prose-img:rounded-xl">
              <div dangerouslySetInnerHTML={{ __html: sections[activeSectionIdx]?.html || '' }} />
            </article>

            {(() => {
              const keys = Object.keys(DOCS_DATA);
              const currentDocIdx = keys.indexOf(activeTab);

              // Get previous item info
              let prevButton = null;
              if (activeSectionIdx > 0) {
                prevButton = {
                  label: 'Previous',
                  title: sections[activeSectionIdx - 1].title,
                  onClick: () => setActiveSectionIdx(activeSectionIdx - 1)
                };
              } else if (currentDocIdx > 0) {
                const prevDocKey = keys[currentDocIdx - 1];
                const prevDocSections = getSections(DOCS_DATA[prevDocKey].html);
                prevButton = {
                  label: `Previous: ${DOCS_DATA[prevDocKey].title}`,
                  title: prevDocSections[prevDocSections.length - 1].title,
                  onClick: () => {
                    setActiveTab(prevDocKey);
                    setActiveSectionIdx(prevDocSections.length - 1);
                    setExpandedDocs(prev => ({
                      ...prev,
                      [prevDocKey]: true
                    }));
                  }
                };
              }

              // Get next item info
              let nextButton = null;
              if (activeSectionIdx < sections.length - 1) {
                nextButton = {
                  label: 'Next',
                  title: sections[activeSectionIdx + 1].title,
                  onClick: () => setActiveSectionIdx(activeSectionIdx + 1)
                };
              } else if (currentDocIdx < keys.length - 1) {
                const nextDocKey = keys[currentDocIdx + 1];
                const nextDocSections = getSections(DOCS_DATA[nextDocKey].html);
                nextButton = {
                  label: `Next: ${DOCS_DATA[nextDocKey].title}`,
                  title: nextDocSections[0]?.title || 'Overview',
                  onClick: () => {
                    setActiveTab(nextDocKey);
                    setActiveSectionIdx(0);
                    setExpandedDocs(prev => ({
                      ...prev,
                      [nextDocKey]: true
                    }));
                  }
                };
              }

              if (!prevButton && !nextButton) return null;

              return (
                <div className="mt-12 flex justify-between gap-4 border-t border-[var(--doc-border)] pt-6">
                  {prevButton ? (
                    <button
                      onClick={prevButton.onClick}
                      className="flex flex-col items-start gap-1 rounded-xl border border-[var(--doc-border)] p-4 text-left hover:bg-slate-200/10 transition-all w-1/2"
                    >
                      <span className="text-xs text-[var(--doc-text-muted)] uppercase tracking-wider">{prevButton.label}</span>
                      <span className="text-sm font-bold text-[var(--doc-primary)]">← {prevButton.title}</span>
                    </button>
                  ) : (
                    <div className="w-1/2" />
                  )}
                  {nextButton ? (
                    <button
                      onClick={nextButton.onClick}
                      className="flex flex-col items-end gap-1 rounded-xl border border-[var(--doc-border)] p-4 text-right hover:bg-slate-200/10 transition-all w-1/2"
                    >
                      <span className="text-xs text-[var(--doc-text-muted)] uppercase tracking-wider">{nextButton.label}</span>
                      <span className="text-sm font-bold text-[var(--doc-primary)]">{nextButton.title} →</span>
                    </button>
                  ) : (
                    <div className="w-1/2" />
                  )}
                </div>
              );
            })()}
          </main>

        </div>
      </div>

    </div>
  );
}
