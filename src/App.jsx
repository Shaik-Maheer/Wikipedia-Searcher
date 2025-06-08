import React, { useState, useEffect } from "react";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex flex-col">
      <h1 className="text-4xl font-bold mb-8 text-center">Wikipedia Searcher</h1>

      <form
        onSubmit={searchWikipedia}
        className="mb-6 max-w-4xl mx-auto flex justify-center"
        autoComplete="off"
      >
        <input
          type="text"
          placeholder="Search Wikipedia..."
          className="w-full max-w-xl px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:border-gray-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-r-md ml-2"
        >
          Search
        </button>
      </form>

      {suggestion && (
        <p className="max-w-4xl mx-auto mb-4 text-center text-sm text-yellow-700 dark:text-yellow-400">
          Did you mean?{" "}
          <button
            className="underline hover:text-yellow-900 dark:hover:text-yellow-200"
            onClick={() => searchWikipedia(null, suggestion)}
          >
            {suggestion}
          </button>
        </p>
      )}

      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {history.slice(0, 3).map(({ term }, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded"
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
                title="Delete this search"
                aria-label={`Delete ${term} from history`}
              >
                ×
              </button>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 italic">No history yet.</p>
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
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="ml-4 text-red-600 hover:underline text-sm p-3"
            title="Clear all search history"
          >
            Clear All
          </button>
        )}
      </div>

      {loading && <p className="text-center">Loading...</p>}

      {!loading && results.length === 0 && query.trim() !== "" && (
        <p className="max-w-4xl mx-auto text-center text-red-600 dark:text-red-400">
          No results found. Please check your spelling or try different terms.
        </p>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
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
              className="block"
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
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Dark Mode */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg z-50"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <footer className="mt-auto text-center py-4 text-sm">
        <div className="inline-block text-gray-500 dark:text-gray-400 select-none">
          Built with ❤️ by Shaik Maheer
        </div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <div
          id="modalOverlay"
          onClick={handleModalClick}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white dark:bg-gray-800 max-w-md w-full max-h-[70vh] overflow-y-auto rounded-lg shadow-lg p-6 m-4 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl font-bold"
              aria-label="Close history modal"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">Full Search History</h3>
            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic text-center">
                No search history yet.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map(({ term, timestamp }, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <span
                      className="flex-1"
                      onClick={() => {
                        searchWikipedia(null, term);
                        setModalOpen(false);
                      }}
                    >
                      {term}
                    </span>
                    <small className="text-gray-500 dark:text-gray-400 whitespace-nowrap mr-4">
                      {formatTime(timestamp)}
                    </small>
                    <button
                      onClick={() => deleteHistoryItem(term)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 font-bold"
                      aria-label={`Delete ${term} from history`}
                      title="Delete this search"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
