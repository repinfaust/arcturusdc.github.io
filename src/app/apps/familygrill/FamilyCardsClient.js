"use client";

import { useState, useEffect, useCallback } from "react";

// Base deck data
const baseDeck = [
  // Know Me
  { id: "km_001", category: "Know Me", text: "What's your favourite colour?" },
  { id: "km_002", category: "Know Me", text: "What's your favourite food?" },
  { id: "km_003", category: "Know Me", text: "What's your favourite animal?" },
  { id: "km_004", category: "Know Me", text: "What do you want to be when you grow up?" },
  { id: "km_005", category: "Know Me", text: "What's your favourite thing to do on a rainy day?" },
  { id: "km_006", category: "Know Me", text: "What makes you laugh the most?" },
  { id: "km_007", category: "Know Me", text: "What's your favourite song to sing along to?" },
  { id: "km_008", category: "Know Me", text: "If you could have any superpower, what would it be?" },
  { id: "km_009", category: "Know Me", text: "What's the best thing about being in this family?" },
  { id: "km_010", category: "Know Me", text: "What's your favourite bedtime snack?" },

  // Would You Rather
  { id: "wyr_001", category: "Would You Rather", text: "Would you rather be able to fly or be invisible?" },
  { id: "wyr_002", category: "Would You Rather", text: "Would you rather live in a treehouse or a castle?" },
  { id: "wyr_003", category: "Would You Rather", text: "Would you rather have a pet dragon or a pet unicorn?" },
  { id: "wyr_004", category: "Would You Rather", text: "Would you rather eat only pizza or only ice cream forever?" },
  { id: "wyr_005", category: "Would You Rather", text: "Would you rather swim like a fish or climb like a monkey?" },
  { id: "wyr_006", category: "Would You Rather", text: "Would you rather be super fast or super strong?" },
  { id: "wyr_007", category: "Would You Rather", text: "Would you rather visit the moon or the bottom of the ocean?" },
  { id: "wyr_008", category: "Would You Rather", text: "Would you rather have a tail or wings that don't fly?" },
  { id: "wyr_009", category: "Would You Rather", text: "Would you rather speak every language or talk to animals?" },
  { id: "wyr_010", category: "Would You Rather", text: "Would you rather have breakfast for dinner or dinner for breakfast?" },

  // Remember
  { id: "rem_001", category: "Remember", text: "What's your favourite memory from a holiday?" },
  { id: "rem_002", category: "Remember", text: "What's the funniest thing that happened in our family?" },
  { id: "rem_003", category: "Remember", text: "What's your favourite birthday memory?" },
  { id: "rem_004", category: "Remember", text: "What's the best trip we've taken together?" },
  { id: "rem_005", category: "Remember", text: "What's a time someone in the family made you feel really special?" },
  { id: "rem_006", category: "Remember", text: "What's your favourite thing we do together?" },
  { id: "rem_007", category: "Remember", text: "What's the silliest thing you've seen a family member do?" },
  { id: "rem_008", category: "Remember", text: "What's your favourite family tradition?" },
  { id: "rem_009", category: "Remember", text: "What's the best surprise you've ever had?" },
  { id: "rem_010", category: "Remember", text: "What's a time you felt really proud of yourself?" },

  // Silly
  { id: "sil_001", category: "Silly", text: "Do your best dinosaur impression!" },
  { id: "sil_002", category: "Silly", text: "Act like your favourite animal for 20 seconds!" },
  { id: "sil_003", category: "Silly", text: "Make the silliest face you can!" },
  { id: "sil_004", category: "Silly", text: "Walk across the room like a penguin!" },
  { id: "sil_005", category: "Silly", text: "Talk in a robot voice until your next turn!" },
  { id: "sil_006", category: "Silly", text: "Do a silly dance for 10 seconds!" },
  { id: "sil_007", category: "Silly", text: "Make the sound of your favourite vehicle!" },
  { id: "sil_008", category: "Silly", text: "Pretend you're moving in slow motion!" },
  { id: "sil_009", category: "Silly", text: "Say 'banana' in five different funny voices!" },
  { id: "sil_010", category: "Silly", text: "Stand on one foot while patting your head!" },

  // Creative
  { id: "cre_001", category: "Creative", text: "Invent a new dance move and show everyone!" },
  { id: "cre_002", category: "Creative", text: "Make up a silly name for a new pet!" },
  { id: "cre_003", category: "Creative", text: "Describe your dream treehouse!" },
  { id: "cre_004", category: "Creative", text: "Invent a new ice cream flavour!" },
  { id: "cre_005", category: "Creative", text: "Make up a superhero name for yourself!" },
  { id: "cre_006", category: "Creative", text: "What would you invent to make mornings easier?" },
  { id: "cre_007", category: "Creative", text: "Design a new planet – what would be on it?" },
  { id: "cre_008", category: "Creative", text: "Make up a new word and tell us what it means!" },
  { id: "cre_009", category: "Creative", text: "If you could mix two animals, what would you create?" },
  { id: "cre_010", category: "Creative", text: "Invent a silly holiday – what would we celebrate?" },
];

const categories = ["All", "Know Me", "Would You Rather", "Remember", "Silly", "Creative"];

const categoryConfig = {
  "Know Me": { emoji: "🤔", color: "bg-amber-500", border: "border-amber-500", text: "text-amber-600" },
  "Would You Rather": { emoji: "⚖️", color: "bg-pink-500", border: "border-pink-500", text: "text-pink-600" },
  "Remember": { emoji: "💭", color: "bg-violet-500", border: "border-violet-500", text: "text-violet-600" },
  "Silly": { emoji: "🤪", color: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-600" },
  "Creative": { emoji: "🎨", color: "bg-blue-500", border: "border-blue-500", text: "text-blue-600" },
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FamilyCardsClient() {
  const [customCards, setCustomCards] = useState([]);
  const [remaining, setRemaining] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("Know Me");
  const [customText, setCustomText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Load custom cards from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("familyCards_custom");
      if (stored) {
        setCustomCards(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("localStorage unavailable");
    }
  }, []);

  // Get filtered deck
  const getFilteredDeck = useCallback(() => {
    const allCards = [...baseDeck, ...customCards];
    if (filter === "All") return allCards;
    return allCards.filter((c) => c.category === filter);
  }, [filter, customCards]);

  // Reset deck when filter or custom cards change
  useEffect(() => {
    if (mounted) {
      setRemaining(shuffle(getFilteredDeck()));
    }
  }, [filter, customCards, mounted, getFilteredDeck]);

  // Show toast
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  };

  // Draw next card
  const drawNext = () => {
    let pool = remaining;

    if (pool.length === 0) {
      const filtered = getFilteredDeck();
      if (filtered.length === 0) {
        setCurrentCard(null);
        return;
      }
      pool = shuffle(filtered);
      showToast("Deck reshuffled!");
    }

    const [next, ...rest] = pool;
    setCurrentCard(next);
    setRemaining(rest);
  };

  // Reshuffle
  const reshuffle = () => {
    setRemaining(shuffle(getFilteredDeck()));
    showToast("Deck reshuffled!");
  };

  // Copy card
  const copyCard = async () => {
    if (!currentCard) {
      showToast("No card to copy!");
      return;
    }
    const text = `[${currentCard.category}] ${currentCard.text}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied!");
    } catch {
      showToast("Couldn't copy");
    }
  };

  // Add custom card
  const addCustomCard = () => {
    if (!customText.trim()) {
      showToast("Please enter a prompt!");
      return;
    }

    const newCard = {
      id: `custom_${Date.now()}`,
      category: customCategory,
      text: customText.trim(),
      isCustom: true,
    };

    const updated = [...customCards, newCard];
    setCustomCards(updated);
    try {
      localStorage.setItem("familyCards_custom", JSON.stringify(updated));
    } catch (e) {
      console.warn("localStorage unavailable");
    }

    setCustomText("");
    showToast("Card added!");
  };

  // Clear custom cards
  const clearCustomCards = () => {
    if (customCards.length === 0) {
      showToast("No custom cards to clear");
      return;
    }
    if (confirm("Remove all custom cards?")) {
      setCustomCards([]);
      try {
        localStorage.removeItem("familyCards_custom");
      } catch (e) {
        console.warn("localStorage unavailable");
      }
      showToast("Custom cards cleared");
    }
  };

  const total = getFilteredDeck().length;
  const config = currentCard ? categoryConfig[currentCard.category] : null;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-pink-50 to-amber-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-pink-50 to-amber-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">🎴 Family Cards</h1>
          <div className="flex gap-2 justify-center flex-wrap">
            <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600 shadow-sm">
              Kids (5 & 9)
            </span>
            <span className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium text-white">
              {remaining.length} / {total} left
            </span>
          </div>
        </header>

        {/* Filter */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Category
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : `${categoryConfig[cat].emoji} ${cat}`}
              </option>
            ))}
          </select>
        </div>

        {/* Card */}
        <div
          className={`bg-white rounded-2xl shadow-lg p-8 min-h-[220px] flex flex-col items-center justify-center text-center mb-4 relative overflow-hidden border-t-4 ${
            config ? config.border : "border-indigo-500"
          }`}
        >
          {currentCard?.isCustom && (
            <span className="absolute top-4 right-4 text-xl">✨</span>
          )}
          {currentCard ? (
            <>
              <span className={`text-xs font-bold uppercase tracking-wider mb-4 ${config?.text}`}>
                {currentCard.category}
              </span>
              <span className="text-2xl font-semibold text-gray-900 leading-relaxed">
                {currentCard.text}
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-lg">
              {total === 0 ? "No cards in this category. Change filter or add your own!" : "Tap \"Next Card\" to start!"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={drawNext}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            Next Card →
          </button>
          <div className="flex gap-3">
            <button
              onClick={copyCard}
              className="flex-1 py-3 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              📋 Copy
            </button>
            <button
              onClick={reshuffle}
              className="flex-1 py-3 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              🔄 Reshuffle
            </button>
          </div>
        </div>

        {/* Custom Cards Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setCustomOpen(!customOpen)}
            className="w-full px-5 py-4 flex justify-between items-center text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Add Your Own Cards
            <span className={`transition-transform ${customOpen ? "rotate-180" : ""}`}>▼</span>
          </button>

          {customOpen && (
            <div className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryConfig[cat].emoji} {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prompt</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomCard()}
                  placeholder="Enter your question or challenge..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addCustomCard}
                  className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  + Add Card
                </button>
                <button
                  onClick={clearCustomCards}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 font-semibold rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              {customCards.length > 0 && (
                <p className="text-center text-sm text-gray-500">
                  {customCards.length} custom card{customCards.length !== 1 ? "s" : ""} added
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {toast}
      </div>
    </main>
  );
}
