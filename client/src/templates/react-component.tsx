import React, { useState, useEffect, useRef } from 'react';

interface DocPage {
  title: string;
  html: string;
  toc: Array<{ text: string; id: string; level: number }>;
  plainText: string;
}

// Global placeholder injected by compiler
const DOCS_DATA: Record<string, DocPage> = __DOCS_DATA_PLACEHOLDER__;

export default function Docs() {
  const [activeTab, setActiveTab] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ key: string; title: string; snippet: string }>>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    // Read local storage and hash
    const darkSetting = localStorage.getItem('darkMode') === 'true';
    setDarkMode(darkSetting);
    if (darkSetting) document.documentElement.classList.add('dark');

    const keys = Object.keys(DOCS_DATA);
    if (keys.length > 0) {
      const hash = window.location.hash.slice(2);
      if (keys.includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab(keys[0]);
      }
    }

    // Handle outside click for search
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
      const hash = window.location.hash.slice(2);
      if (DOCS_DATA[hash]) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state changes
  useEffect(() => {
    if (activeTab) {
      window.location.hash = '/' + activeTab;
      highlightCode();
      setMobileSidebarOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const activeDoc = DOCS_DATA[activeTab] || { title: '', html: '', toc: [] };

  // Dynamically load Prism.js if not loaded, then highlight
  const highlightCode = () => {
    setTimeout(() => {
      // @ts-ignore
      if (window.Prism) {
        // @ts-ignore
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
              // @ts-ignore
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const query = val.toLowerCase();
    const results = Object.entries(DOCS_DATA)
      .filter(([key, doc]) => doc.plainText.toLowerCase().includes(query) || doc.title.toLowerCase().includes(query))
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200 antialiased dark:bg-slate-950 dark:text-slate-100">
      
      {/* Header */}
      <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" aria-label="Toggle menu">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-display text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400">DocForge Docs</span>
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
                className="w-full rounded-lg border border-slate-200 bg-slate-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 hover:bg-slate-200/70 focus:border-primary-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/80 dark:focus:bg-slate-950"
              />
              
              {searchResults.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900">
                  {searchResults.map((result) => (
                    <button key={result.key} onClick={() => handleSelectResult(result.key)} className="flex w-full flex-col gap-1 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{result.title}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{result.snippet}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode */}
            <button onClick={() => setDarkMode(!darkMode)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Toggle dark mode">
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
          <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white px-4 pt-20 transition-transform duration-200 ease-in-out lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:border-none lg:bg-transparent lg:px-0 dark:border-slate-800 dark:bg-slate-950 lg:dark:bg-transparent ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <nav className="space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Documentation</p>
              {Object.entries(DOCS_DATA).map(([key, doc]) => (
                <button 
                  key={key} 
                  onClick={() => setActiveTab(key)} 
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm ${activeTab === key ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-950/40 dark:text-primary-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'}`}
                >
                  <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {doc.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Center Content */}
          <main className="min-w-0 flex-1 py-8 lg:py-12">
            <article className="prose max-w-3xl dark:prose-invert prose-slate prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-slate-900 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl">
              <div dangerouslySetInnerHTML={{ __html: activeDoc.html }} />
            </article>
          </main>

          {/* Right Sidebar (TOC) */}
          <aside className="hidden w-64 shrink-0 lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] py-12">
            {activeDoc.toc && activeDoc.toc.length > 0 && (
              <div>
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">On This Page</h3>
                <ul className="space-y-2 border-l border-slate-200 dark:border-slate-800">
                  {activeDoc.toc.map((item) => (
                    <li key={item.id} className={item.level === 3 ? 'pl-6' : 'pl-4'}>
                      <a href={`#${item.id}`} className="block text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

        </div>
      </div>

    </div>
  );
}
