<!DOCTYPE html>
<html lang="en" x-data="docsApp()" :class="{ 'dark': darkMode }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ config('app.name', 'Laravel') }} - Documentation</title>
  
  <!-- Inter Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Plus Jakarta Sans', 'sans-serif'],
          },
          colors: {
            primary: {
              50: '#f5f3ff',
              100: '#ede9fe',
              200: '#ddd6fe',
              300: '#c4b5fd',
              400: '#a78bfa',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              800: '#5b21b6',
              900: '#4c1d95',
            }
          }
        }
      }
    }
  </script>
  
  <!-- Prism.js Dracula Theme -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
  
  <!-- Custom styles -->
  <style>
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .dark ::-webkit-scrollbar-thumb {
      background: #475569;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    pre[class*="language-"] {
      border-radius: 0.75rem;
      margin: 1.5rem 0;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background-color: #0f172a !important; /* slate-900 */
      color: #f8fafc !important; /* slate-50 */
    }
    pre[class*="language-"] code {
      background-color: transparent !important;
      color: inherit !important;
      padding: 0 !important;
      border-radius: 0 !important;
      font-size: 0.875rem !important;
    }
    
    /* Inline code styles */
    .prose code:not(pre code) {
      color: #7c3aed !important;
      background-color: #f1f5f9 !important;
      padding: 0.125rem 0.25rem !important;
      border-radius: 0.25rem !important;
    }
    .dark .prose code:not(pre code) {
      color: #a78bfa !important;
      background-color: #1e293b !important;
    }
  </style>

  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans transition-colors duration-200 antialiased dark:bg-slate-950 dark:text-slate-100">

  <!-- Navbar -->
  <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
    <div class="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <!-- Mobile Sidebar Toggle -->
        <button @click="mobileSidebarOpen = !mobileSidebarOpen" class="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" aria-label="Toggle menu">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-display text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400">DocForge Docs</span>
      </div>

      <!-- Header Operations -->
      <div class="flex items-center gap-4">
        <!-- Fuzzy Search Input -->
        <div class="relative w-48 sm:w-64">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input type="text" 
                 x-model="searchQuery" 
                 @input="search()" 
                 placeholder="Search documents..." 
                 class="w-full rounded-lg border border-slate-200 bg-slate-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 hover:bg-slate-200/70 focus:border-primary-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/80 dark:focus:bg-slate-950">
          
          <!-- Search Dropdown Results -->
          <div x-show="searchResults.length > 0" 
               @click.outside="searchResults = []" 
               class="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900" 
               x-cloak>
            <template x-for="result in searchResults" :key="result.key">
              <button @click="selectSearchResult(result.key)" class="flex w-full flex-col gap-1 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400" x-text="result.title"></span>
                <span class="text-xs text-slate-500 dark:text-slate-400" x-text="result.snippet"></span>
              </button>
            </template>
          </div>
        </div>

        <!-- Dark Mode Toggle -->
        <button @click="darkMode = !darkMode" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Toggle dark mode">
          <svg x-show="darkMode" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" x-cloak>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <svg x-show="!darkMode" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Sidebar / Content container -->
  <div class="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col lg:flex-row lg:gap-8">
      
      <!-- Left Sidebar Navigation -->
      <aside :class="{ 'translate-x-0': mobileSidebarOpen, '-translate-x-full': !mobileSidebarOpen }" 
             class="fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white px-4 pt-20 transition-transform duration-200 ease-in-out lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:border-none lg:bg-transparent lg:px-0 dark:border-slate-800 dark:bg-slate-950 lg:dark:bg-transparent">
        <nav class="space-y-1">
          <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Documentation</p>
          <template x-for="(doc, key) in docs" :key="key">
            <div class="space-y-1">
              <!-- Main Doc button -->
              <button @click="activeTab = key; activeSectionIdx = 0; expandedDocs[key] = !expandedDocs[key]" 
                      :class="activeTab === key ? 'bg-primary-50 font-semibold text-primary-600 dark:bg-primary-950/40 dark:text-primary-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'"
                      class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200">
                <div class="flex items-center min-w-0">
                  <svg class="mr-3 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="truncate text-left" x-text="doc.title"></span>
                </div>
                <svg x-show="getSections(doc.html).length > 1"
                     :class="expandedDocs[key] ? 'rotate-90' : ''" 
                     class="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <!-- Nested tree (H2 sections) -->
              <div x-show="expandedDocs[key] && getSections(doc.html).length > 1" 
                   class="ml-5 border-l border-slate-200 dark:border-slate-800 pl-3 py-1 space-y-1">
                <template x-for="(sec, idx) in getSections(doc.html)" :key="idx">
                  <div class="space-y-1">
                    <button @click="activeTab = key; activeSectionIdx = idx"
                            :class="(activeTab === key && activeSectionIdx === idx) ? 'text-primary-600 font-semibold border-l-2 border-primary-600 -ml-[13px] pl-[11px] dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'"
                            class="flex w-full items-center py-1.5 pr-3 text-xs rounded-r-md transition-all text-left">
                      <span class="truncate" x-text="(idx + 1) + '. ' + sec.title"></span>
                    </button>

                    <!-- H3 Sub-headings inside active H2 -->
                    <div x-show="activeTab === key && activeSectionIdx === idx && getActiveSectionToc(key, idx).filter(item => item.level === 3).length > 0"
                         class="ml-3 border-l border-slate-200 dark:border-slate-800 pl-2.5 py-0.5 space-y-1">
                      <template x-for="h3 in getActiveSectionToc(key, idx).filter(item => item.level === 3)" :key="h3.id">
                        <button @click="scrollToHeading(h3.id)"
                                :class="activeSection === h3.id ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'"
                                class="flex w-full items-center py-1 text-[11px] transition-all text-left">
                          <span class="truncate" x-text="h3.text"></span>
                        </button>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </nav>
      </aside>

      <!-- Center Main Content -->
      <main class="min-w-0 flex-1 py-8 lg:py-12">
        <article class="prose max-w-4xl dark:prose-invert prose-slate prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-slate-900 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl">
          <!-- Live HTML Injected by Alpine -->
          <div x-html="getSections(activeDoc.html)[activeSectionIdx]?.html || ''"></div>
        </article>

        <!-- Pagination Buttons -->
        <div x-show="prevButton || nextButton" class="mt-12 flex justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800" x-cloak>
          <template x-if="prevButton">
            <button @click="prevButton.onClick()"
                    class="flex flex-col items-start gap-1 rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-100/50 transition-all w-1/2 dark:border-slate-800 dark:hover:bg-slate-900/50">
              <span class="text-xs text-slate-400 uppercase tracking-wider dark:text-slate-500" x-text="prevButton.label"></span>
              <span class="text-sm font-bold text-primary-600 dark:text-primary-400">← <span x-text="prevButton.title"></span></span>
            </button>
          </template>
          <template x-if="!prevButton">
            <div class="w-1/2"></div>
          </template>
          
          <template x-if="nextButton">
            <button @click="nextButton.onClick()"
                    class="flex flex-col items-end gap-1 rounded-xl border border-slate-200 p-4 text-right hover:bg-slate-100/50 transition-all w-1/2 dark:border-slate-800 dark:hover:bg-slate-900/50">
              <span class="text-xs text-slate-400 uppercase tracking-wider dark:text-slate-500" x-text="nextButton.label"></span>
              <span class="text-sm font-bold text-primary-600 dark:text-primary-400"><span x-text="nextButton.title"></span> →</span>
            </button>
          </template>
          <template x-if="!nextButton">
            <div class="w-1/2"></div>
          </template>
        </div>
      </main>

    </div>
  </div>

  <!-- Prism Syntax Highlighting -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>

  <!-- Docs Database Injection Placeholder -->
  <script>
    window.DOCS_DATA = __DOCS_DATA_PLACEHOLDER__;
  </script>

  <!-- Application Controller -->
  <script>
    function docsApp() {
      return {
        darkMode: localStorage.getItem('darkMode') === 'true',
        activeTab: '',
        activeSectionIdx: 0,
        expandedDocs: {},
        activeSection: '',
        searchQuery: '',
        searchResults: [],
        mobileSidebarOpen: false,
        docs: {},
        
        init() {
          this.docs = window.DOCS_DATA || {};
          
          const keys = Object.keys(this.docs);
          if (keys.length > 0) {
            const hash = window.location.hash.slice(2);
            const parts = hash.split('#');
            const tabKey = parts[0];

            if (keys.includes(tabKey)) {
              this.activeTab = tabKey;
            } else {
              this.activeTab = keys[0];
            }

            keys.forEach(k => {
              this.expandedDocs[k] = (k === this.activeTab);
            });
          }
          
          this.$watch('darkMode', val => localStorage.setItem('darkMode', val));
          
          window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(2);
            const parts = hash.split('#');
            const tabKey = parts[0];
            if (Object.keys(this.docs).includes(tabKey)) {
              this.activeTab = tabKey;
            }
          });
          
          this.$watch('activeTab', (newVal) => {
            window.location.hash = '/' + newVal;
            this.activeSectionIdx = 0;
            this.expandedDocs[newVal] = true;
            this.highlightCode();
            this.mobileSidebarOpen = false;
            this.scrollToTop();
          });

          this.$watch('activeSectionIdx', () => {
            this.scrollToTop();
          });
          
          this.$nextTick(() => this.highlightCode());
          this.setupScrollSpy();
        },
        
        get activeDoc() {
          return this.docs[this.activeTab] || { title: '', html: '', toc: [] };
        },

        getSections(htmlStr) {
          if (!htmlStr) return [];
          const parts = htmlStr.split(/<h2(?=\s|>)/);
          const result = [];
          
          let hasIntro = parts[0] && parts[0].trim().length > 0;
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
        },

        getActiveSectionToc(docKey, secIdx) {
          const doc = this.docs[docKey];
          if (!doc || !doc.toc) return [];
          
          const result = [];
          let currentH2Index = -1;
          const parts = doc.html.split(/<h2(?=\s|>)/);
          const hasIntro = parts[0] && parts[0].trim().length > 0;
          
          for (const item of doc.toc) {
            if (item.level === 2) {
              currentH2Index++;
            }
            const itemSectionIdx = hasIntro ? currentH2Index + 1 : currentH2Index;
            const normalizedIdx = Math.max(0, itemSectionIdx);
            
            if (normalizedIdx === secIdx) {
              result.push(item);
            }
          }
          return result;
        },

        scrollToHeading(id) {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.location.hash = '/' + this.activeTab + '#' + id;
          }
        },

        scrollToTop() {
          this.$nextTick(() => {
            const article = document.querySelector('article');
            if (article) {
              article.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          });
        },

        setupScrollSpy() {
          window.addEventListener('scroll', () => {
            const headings = Array.from(document.querySelectorAll('article h2, article h3'));
            let current = '';
            for (const heading of headings) {
              const top = heading.getBoundingClientRect().top;
              if (top < 150) {
                current = heading.id;
              } else {
                break;
              }
            }
            this.activeSection = current;
          });
        },
        
        highlightCode() {
          this.$nextTick(() => {
            if (window.Prism) {
              window.Prism.highlightAll();
            }
            // Add Copy Buttons
            const codeBlocks = document.querySelectorAll('pre');
            codeBlocks.forEach(pre => {
              if (pre.querySelector('.copy-btn')) return;
              
              pre.style.position = 'relative';
              const button = document.createElement('button');
              button.className = 'copy-btn absolute right-3 top-3 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-400 hover:text-white backdrop-blur opacity-0 transition-opacity duration-150';
              button.textContent = 'Copy';
              
              pre.addEventListener('mouseenter', () => button.classList.remove('opacity-0'));
              pre.addEventListener('mouseleave', () => button.classList.add('opacity-0'));
              
              button.addEventListener('click', () => {
                const code = pre.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                  button.textContent = 'Copied!';
                  setTimeout(() => button.textContent = 'Copy', 2000);
                });
              });
              
              pre.appendChild(button);
            });
          });
        },
        
        search() {
          if (!this.searchQuery.trim()) {
            this.searchResults = [];
            return;
          }
          const query = this.searchQuery.toLowerCase();
          this.searchResults = Object.entries(this.docs)
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
                snippet: snippet
              };
            });
        },
        
        selectSearchResult(key) {
          this.activeTab = key;
          this.searchQuery = '';
          this.searchResults = [];
        },

        get prevButton() {
          const keys = Object.keys(this.docs);
          const currentDocIdx = keys.indexOf(this.activeTab);
          const sections = this.getSections(this.activeDoc.html);
          
          if (this.activeSectionIdx > 0) {
            return {
              label: 'Previous',
              title: sections[this.activeSectionIdx - 1].title,
              onClick: () => { this.activeSectionIdx--; }
            };
          } else if (currentDocIdx > 0) {
            const prevDocKey = keys[currentDocIdx - 1];
            const prevDocSections = this.getSections(this.docs[prevDocKey].html);
            return {
              label: `Previous: ${this.docs[prevDocKey].title}`,
              title: prevDocSections[prevDocSections.length - 1].title,
              onClick: () => {
                this.activeTab = prevDocKey;
                this.$nextTick(() => {
                  this.activeSectionIdx = prevDocSections.length - 1;
                });
              }
            };
          }
          return null;
        },

        get nextButton() {
          const keys = Object.keys(this.docs);
          const currentDocIdx = keys.indexOf(this.activeTab);
          const sections = this.getSections(this.activeDoc.html);
          
          if (this.activeSectionIdx < sections.length - 1) {
            return {
              label: 'Next',
              title: sections[this.activeSectionIdx + 1].title,
              onClick: () => { this.activeSectionIdx++; }
            };
          } else if (currentDocIdx < keys.length - 1) {
            const nextDocKey = keys[currentDocIdx + 1];
            return {
              label: `Next: ${this.docs[nextDocKey].title}`,
              title: this.getSections(this.docs[nextDocKey].html)[0]?.title || 'Overview',
              onClick: () => {
                this.activeTab = nextDocKey;
                this.$nextTick(() => {
                  this.activeSectionIdx = 0;
                });
              }
            };
          }
          return null;
        }
      }
    }
  </script>
</body>
</html>
