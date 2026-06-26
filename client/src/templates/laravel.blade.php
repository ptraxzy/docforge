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
          <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Documentation</p>
          <template x-for="(doc, key) in docs" :key="key">
            <button @click="activeTab = key" 
                    :class="activeTab === key ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-950/40 dark:text-primary-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'"
                    class="flex w-full items-center rounded-lg px-3 py-2 text-sm">
              <svg class="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span x-text="doc.title"></span>
            </button>
          </template>
        </nav>
      </aside>

      <!-- Center Main Content -->
      <main class="min-w-0 flex-1 py-8 lg:py-12">
        <article class="prose max-w-3xl dark:prose-invert prose-slate prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:underline prose-pre:bg-slate-900 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl">
          <div x-html="activeDoc.html"></div>
        </article>
      </main>

      <!-- Right Sidebar Table of Contents (TOC) -->
      <aside class="hidden w-64 shrink-0 lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] py-12">
        <div x-show="activeDoc.toc && activeDoc.toc.length > 0">
          <h3 class="font-display text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">On This Page</h3>
          <ul class="space-y-2 border-l border-slate-200 dark:border-slate-800">
            <template x-for="item in activeDoc.toc" :key="item.id">
              <li :class="item.level === 3 ? 'pl-6' : 'pl-4'">
                <a :href="'#' + item.id" 
                   class="block text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                   x-text="item.text"></a>
              </li>
            </template>
          </ul>
        </div>
      </aside>

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
        searchQuery: '',
        searchResults: [],
        mobileSidebarOpen: false,
        docs: {},
        
        init() {
          this.docs = window.DOCS_DATA || {};
          
          const keys = Object.keys(this.docs);
          if (keys.length > 0) {
            const hash = window.location.hash.slice(2);
            if (keys.includes(hash)) {
              this.activeTab = hash;
            } else {
              this.activeTab = keys[0];
            }
          }
          
          this.$watch('darkMode', val => localStorage.setItem('darkMode', val));
          
          window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(2);
            if (Object.keys(this.docs).includes(hash)) {
              this.activeTab = hash;
            }
          });
          
          this.$watch('activeTab', () => {
            window.location.hash = '/' + this.activeTab;
            this.highlightCode();
            this.mobileSidebarOpen = false;
          });
          
          this.$nextTick(() => this.highlightCode());
        },
        
        get activeDoc() {
          return this.docs[this.activeTab] || { title: '', html: '', toc: [] };
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
        }
      }
    }
  </script>
</body>
</html>
