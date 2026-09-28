"use client";

import { useAppStore } from "@/store";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ShoppingCart, X, Trash2, Package } from "lucide-react";

export default function Inventory() {
  const currentUser = useAppStore(state => state.currentUser);
  const books = useAppStore(state => state.books);
  const inventory = useAppStore(state => state.inventory);
  const addBook = useAppStore(state => state.addBook);
  const deleteBook = useAppStore(state => state.deleteBook);
  const categories = useAppStore(state => state.categories);
  const addBookToCategory = useAppStore(state => state.addBookToCategory);

  const isAdmin = currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Book Form State
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Add Book Form State

  const filteredInventory = inventory.map(inv => {
    const book = books.find(b => b.id === inv.book_id)!;
    return { ...inv, book };
  }).filter(item => item.book?.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let catId = selectedCategory?.id;
    const catName = selectedCategory ? selectedCategory.name : categorySearchQuery;

    if (!catName) return;

    if (!catId) {
      // Create new category if it doesn't exist
      const existingCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (existingCat) {
        catId = existingCat.id;
      } else {
        const newCatId = Math.random().toString(36).substr(2, 9);
        const newCat = {
          id: newCatId,
          name: catName,
          bookIds: [],
          created_at: new Date().toISOString(),
        };
        useAppStore.setState(state => ({
          categories: [...state.categories, newCat]
        }));
        catId = newCatId;
      }
    }

    const bookId = addBook({
      name: catName,
      purchase_price: Number(purchasePrice),
      sale_price: Number(salePrice),
    }, Number(addQty), currentUser.id);

    if (catId) {
      addBookToCategory(catId, bookId);
    }
    
    setIsAddModalOpen(false);
    setPurchasePrice(""); setSalePrice(""); setAddQty("1");
    setSelectedCategory(null); setCategorySearchQuery("");
  };



  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and watch your book inventory</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search books..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-stark-500 focus:border-transparent outline-none w-full sm:w-56 transition-all text-sm"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-stark-600 hover:bg-stark-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 flex-shrink-0 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Add Book</span><span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence>
          {filteredInventory.map((item) => {
            const bookCategory = categories.find(c => c.bookIds.includes(item.book.id));
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col justify-between ${
                  item.quantity <= 5 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
                }`}
              >
                <div>
                  <div className="flex flex-col mb-3 sm:mb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-2 mr-2">{item.book.name}</h3>
                      <div className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 ${
                        item.quantity <= 0 ? 'bg-stark-100 text-stark-700' :
                        item.quantity <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.quantity <= 0 ? 'Out' : `${item.quantity} left`}
                      </div>
                    </div>
                    {bookCategory && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1.5 self-start">
                        {bookCategory.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Purchase:</span>
                      <span className="font-semibold text-slate-900">{item.book.purchase_price.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sale:</span>
                      <span className="font-bold text-stark-600">{item.book.sale_price.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Margin:</span>
                      <span className="font-semibold text-emerald-600">+{(item.book.sale_price - item.book.purchase_price).toLocaleString()} UZS</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        if(window.confirm('Delete this book completely? This cannot be undone.')) {
                          deleteBook(item.book.id);
                        }
                      }}
                      className="w-full bg-stark-50 hover:bg-stark-100 text-stark-600 py-2.5 rounded-xl transition-colors font-bold flex items-center justify-center gap-2 text-sm"
                      title="Delete Book"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Book
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredInventory.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No books found in inventory.</p>
            {isAdmin && (
              <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-stark-600 font-semibold hover:underline text-sm">
                + Add your first book
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5 sm:mb-6">Add New Book</h2>
              
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or select category"
                      required
                      value={categorySearchQuery}
                      onChange={(e) => {
                        setCategorySearchQuery(e.target.value);
                        setIsCategoryDropdownOpen(true);
                        if (!e.target.value) {
                          setSelectedCategory(null);
                        }
                      }}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm bg-white"
                    />
                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {categories
                          .filter(c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                          .map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory({ id: cat.id, name: cat.name });
                                setCategorySearchQuery(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm transition-colors cursor-pointer text-slate-700 font-medium"
                            >
                              {cat.name}
                            </button>
                          ))}
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-slate-400">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Purchase Price</label>
                    <input type="number" required min="0" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Sale Price</label>
                    <input type="number" required min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
                  <input type="number" required min="1" value={addQty} onChange={e => setAddQty(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm" />
                </div>
                {purchasePrice && addQty && (
                  <div className="bg-slate-50 p-3 rounded-xl text-sm">
                    <span className="text-slate-500">Total cost: </span>
                    <span className="font-bold text-slate-900">{(Number(purchasePrice) * Number(addQty)).toLocaleString()} UZS</span>
                    <span className="text-slate-400"> (deducted from wallet)</span>
                  </div>
                )}
                <div className="pt-2 sm:pt-4">
                  <button type="submit" className="w-full bg-stark-600 text-white font-bold py-3 sm:py-3.5 rounded-xl hover:bg-stark-700 transition-colors shadow-lg shadow-stark-500/25 text-sm sm:text-base">
                    Confirm Purchase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
