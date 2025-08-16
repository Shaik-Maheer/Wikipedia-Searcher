

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react"; // icons

const RESULTS_PER_PAGE = 6;

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        (!("darkMode" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("searchHistory")) || [];
    } catch {
      return [];
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const html = document.documentElement;
    darkMode ? html.classList.add("dark") : html.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }, [history]);
  
  useEffect(() => {
    searchWikipedia(null, "India"); // ✅ default search
  }, []);

  
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const fetchSuggestion = async (term) => {
    const suggestEndpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      term
    )}&limit=1&namespace=0&format=json&origin=*`;
    try {
      const res = await fetch(suggestEndpoint);
      const data = await res.json();
      const suggested = data[1][0];
      if (suggested && suggested.toLowerCase() !== term.toLowerCase()) {
        return suggested;
      }
      return null;
    } catch {
      return null;
    }
  };

  const searchWikipedia = async (e, searchTerm = null) => {
    if (e) e.preventDefault();

    const q = searchTerm !== null ? searchTerm : query.trim();
    if (!q) return;

    setLoading(true);
    setQuery(q);
    setCurrentPage(1);
    setSuggestion(null);

    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      q
    )}&utf8=&srlimit=50&format=json&origin=*`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      const searchResults = data.query?.search || [];
      setResults(searchResults);

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.term !== q);
        return [{ term: q, timestamp: Date.now() }, ...filtered].slice(0, 50);
      });

      if (searchResults.length <= 3) {
        const sugg = await fetchSuggestion(q);
        setSuggestion(sugg);
      } else {
        setSuggestion(null);
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleString();
  const handleModalClick = (e) => {
    if (e.target.id === "modalOverlay") setModalOpen(false);
  };

  const paginatedResults = results.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );
  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);

  const deleteHistoryItem = (term) => {
    setHistory((prev) => prev.filter((item) => item.term !== term));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push("...");
      }
    }
    return pages.map((page, idx) =>
      page === "..." ? (
        <span key={idx} className="px-2">
          ...
        </span>
      ) : (
        <button
          key={idx}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-1 rounded ${
            currentPage === page
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {page}
        </button>
      )
    );
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col p-6 transition-colors duration-500 overflow-hidden
      ${
        darkMode
          ? "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]"
          : "bg-gradient-to-br from-gray-100 via-gray-200 to-white"
      }`}
    >
      {/* Glowing Blobs Background */}
      <div
        className={`absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-pulse 
        ${
          darkMode ? "bg-blue-700/40" : "bg-gray-400/30"
        }`}
      ></div>
      <div
        className={`absolute bottom-[-200px] right-[-200px] w-[400px] h-[400px] rounded-full blur-3xl opacity-30 animate-pulse 
        ${
          darkMode ? "bg-cyan-600/40" : "bg-gray-500/20"
        }`}
      ></div>

<h1
  className={`text-5xl md:text-6xl font-extrabold text-center mb-4
    bg-clip-text text-transparent inline-block
    ${
      darkMode
      ? "bg-gradient-to-r from-blue-400 via- from-blue-600 to-emerald-400"
       : "bg-gradient-to-r from-blue-400 via- from-blue-600 to-emerald-400"
    }`}
>
  Wikipedia Searcher
</h1>


      {/* Search Form */}
      <form
        onSubmit={searchWikipedia}
        className="mb-6 max-w-4xl mx-auto flex justify-center gap-3 relative z-10"
        autoComplete="off"
      >
      
      {/* Input */}
{/* Search Input with Gradient Outline */}
<div className="w-full max-w-xl p-[2px] rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-emerald-400">
<input
  type="text"
  value={query}   // <-- bind state
  onChange={(e) => setQuery(e.target.value)}  // <-- update state
  placeholder="Search Wikipedia..."
  className="w-full px-6 py-3 rounded-full
             bg-gray-200 dark:bg-gray-800
             text-gray-900 dark:text-gray-100
             placeholder-gray-500 dark:placeholder-gray-400
             border-none focus:outline-none
             transition duration-200"
/>

</div>


{/* Button */}
<button
  type="submit"
  className="px-6 py-3 rounded-full
             bg-gradient-to-r from-blue-400 to-blue-600
             text-white font-semibold
             hover:scale-105 transform transition duration-200 shadow-lg"
>
  Search
</button>


      </form>

      {/* Suggestion */}
      {suggestion && (
        <p className="max-w-4xl mx-auto mb-4 text-center text-sm text-yellow-700 dark:text-yellow-400 relative z-10">
          Did you mean?{" "}
          <button
            className="underline hover:text-yellow-900 dark:hover:text-yellow-200"
            onClick={() => searchWikipedia(null, suggestion)}
          >
            {suggestion}
          </button>
        </p>
      )}

      {/* History */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between relative z-10">
        <div className="flex flex-wrap gap-2">
          {history.slice(0, 3).map(({ term }, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full"
            >
              <button
                className="hover:underline"
                onClick={() => searchWikipedia(null, term)}
              >
                {term}
              </button>
              <button
                onClick={() => deleteHistoryItem(term)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 font-bold"
              >
                ×
              </button>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No history yet.
            </p>
          )}
        </div>
        {history.length > 3 && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-blue-600 hover:underline text-sm p-3"
          >
            View All History
          </button>
        )}
      </div>

      {/* History Modal */}
      {modalOpen && (
        <div
          id="modalOverlay"
          onClick={handleModalClick}
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-6 max-w-lg w-full shadow-lg">
<h2 className="text-xl font-bold mb-4">Search History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map(({ term, timestamp }, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded"
                >
                  <div>
                    <button
                      onClick={() => searchWikipedia(null, term)}
                      className="font-semibold hover:underline"
                    >
                      {term}
                    </button>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatTime(timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHistoryItem(term)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
  <button
    onClick={() => setModalOpen(false)}
    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
  >
    Back to Search
  </button>

  <button
    onClick={clearHistory}
    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
  >
    Clear All
  </button>
</div>


          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
  <p className="text-center relative z-10 text-gray-900 dark:text-gray-100">
    Loading...
  </p>
)}
      {!loading && results.length === 0 && query.trim() !== "" && (
        <p className="max-w-4xl mx-auto text-center text-red-600 dark:text-red-400 relative z-10">
          No results found. Please check your spelling or try different terms.
        </p>
      )}

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {paginatedResults.map((page) => {
          const url =
            "https://en.wikipedia.org/wiki/" +
            encodeURIComponent(page.title.replace(/ /g, "_"));
          return (
            <a
              key={page.pageid}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block transform hover:scale-105 transition duration-300 ease-in-out 
              border border-transparent hover:border-green-500 dark:hover:border-blue-500 
              shadow-md hover:shadow-xl p-4 rounded-lg bg-white dark:bg-gray-800"
            >
              <h2 className="text-blue-600 text-xl font-semibold hover:underline">
                {page.title}
              </h2>
              <p className="text-green-600 text-sm mb-1">{url}</p>
              <p
                className="text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: page.snippet + "..." }}
              />
            </a>
          );
        })}
      </div>

     {/* Pagination */}
{!loading && results.length > RESULTS_PER_PAGE && (
  <div className="flex justify-center items-center mt-6 gap-2 relative z-10">
    {/* Prev Button */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      className={`px-3 py-1 rounded disabled:opacity-50 
        ${
          currentPage === 1
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white hover:opacity-90"
        }`}
    >
      Prev
    </button>

    {/* Pagination Numbers with Ellipsis */}
    {(() => {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
          pages.push(i);
        } else if (
          (i === currentPage - 2 && currentPage > 3) ||
          (i === currentPage + 2 && currentPage < totalPages - 2)
        ) {
          pages.push("...");
        }
      }
      return pages.map((page, idx) =>
        page === "..." ? (
          <span key={idx} className="px-2 select-none">
            ...
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded 
              ${
                currentPage === page
                  ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white font-bold shadow-md"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
          >
            {page}
          </button>
        )
      );
    })()}

    {/* Next Button */}
    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      className={`px-3 py-1 rounded disabled:opacity-50 
        ${
          currentPage === totalPages
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white hover:opacity-90"
        }`}
    >
      Next
    </button>
  </div>
)}


      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-50 
             bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-gray-700 dark:to-gray-900 
             hover:scale-110 transition"
      >
        {darkMode ? (
          <Sun className="h-6 w-6 text-yellow-300" /> // 🌞
        ) : (
          <Moon className="h-6 w-6 text-gray-200" /> // 🌙
        )}
      </button>

      {/* Footer */}
      <footer className="mt-auto text-center py-4 text-sm relative z-10">
        <div className="inline-block text-gray-500 dark:text-gray-400 select-none">
          Built with ❤️ by Shaik Maheer
        </div>
      </footer>
    </div>
  );
}
