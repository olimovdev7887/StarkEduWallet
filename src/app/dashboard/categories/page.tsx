"use client";

import { useAppStore } from "@/store";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BookOpen, X, FolderOpen, ChevronDown, ChevronUp, Check } from "lucide-react";

export default function CategoriesPage() {
  const currentUser = useAppStore(state => state.currentUser);
  const categories = useAppStore(state => state.categories);
  const books = useAppStore(state => state.books);
  const inventory = useAppStore(state => state.inventory);
  const addCategory = useAppStore(state => state.addCategory);
  const deleteCategory = useAppStore(state => state.deleteCategory);
  const addBookToCategory = useAppStore(state => state.addBookToCategory);
  const removeBookFromCategory = useAppStore(state => state.removeBookFromCategory);

  const isAdmin = currentUser?.role === 'admin';

  const [newCatName, setNewCatName] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [addBookModal, setAddBookModal] = useState<string | null>(null); // categoryId

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName("");
    setIsAddOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-violet-600 p-3 rounded-2xl shadow-md shadow-violet-500/20">
            <FolderOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Categories</h1>
            <p className="text-slate-500 mt-1">Organise books into groups</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm sm:text-base w-fit"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Category</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No categories yet.</p>
          {isAdmin && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 text-violet-600 font-semibold hover:underline text-sm"
            >
              + Create your first category
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {categories.map(cat => {
              const catBooks = books.filter(b => cat.bookIds.includes(b.id));
              const isExpanded = expandedCat === cat.id;

              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between p-5">
                    <button
                      className="flex items-center gap-3 flex-1 text-left"
                      onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                    >
                      <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">{cat.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{catBooks.length} book{catBooks.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="ml-2 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => setAddBookModal(cat.id)}
                          className="text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          + Add Book
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete category "${cat.name}"?`)) {
                              deleteCategory(cat.id);
                              if (expandedCat === cat.id) setExpandedCat(null);
                            }
                          }}
                          className="text-stark-500 hover:text-stark-700 hover:bg-stark-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Book List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100"
                      >
                        {catBooks.length === 0 ? (
                          <div className="p-5 text-center text-slate-400 text-sm">
                            No books in this category yet.{" "}
                            {isAdmin && (
                              <button
                                onClick={() => setAddBookModal(cat.id)}
                                className="text-violet-600 font-semibold hover:underline"
                              >
                                Add one
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {catBooks.map(book => {
                              const invItem = inventory.find(i => i.book_id === book.id);
                              const stock = invItem?.quantity ?? 0;
                              return (
                                <div
                                  key={book.id}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <BookOpen className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-900 text-sm truncate">{book.name}</p>
                                      <p className="text-xs text-slate-500">{book.sale_price.toLocaleString()} UZS</p>
                                      <p className={`text-xs font-medium mt-0.5 ${stock === 0 ? 'text-stark-500' : stock <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                        {stock === 0 ? 'Out of stock' : `${stock} left`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {/* Remove from category — admin only */}
                                    {isAdmin && (
                                      <button
                                        onClick={() => removeBookFromCategory(cat.id, book.id)}
                                        className="text-slate-400 hover:text-stark-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                                        title="Remove from category"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-900">New Category</h2>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                    placeholder="e.g. Mathematics, Science..."
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25"
                >
                  Create Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Book to Category Modal */}
      <AnimatePresence>
        {addBookModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Add Book to Category</h2>
                <button onClick={() => setAddBookModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {books.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No books in inventory yet.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                  {books.map(book => {
                    const cat = categories.find(c => c.id === addBookModal)!;
                    const isInCat = cat?.bookIds.includes(book.id);
                    return (
                      <button
                        key={book.id}
                        onClick={() => {
                          if (isInCat) {
                            removeBookFromCategory(addBookModal, book.id);
                          } else {
                            addBookToCategory(addBookModal, book.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${isInCat
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className={`w-4 h-4 ${isInCat ? 'text-violet-600' : 'text-slate-400'}`} />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{book.name}</p>
                            <p className="text-xs text-slate-500">{book.sale_price.toLocaleString()} UZS</p>
                          </div>
                        </div>
                        {isInCat && <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setAddBookModal(null)}
                className="mt-5 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
