import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Mock responses for demonstration
const mockResponses: { [key: string]: string } = {
  'sanitation': 'Based on historical data, the top 3 districts with recurring sanitation complaints are: 1) Visakhapatnam (47 cases), 2) Guntur (38 cases), 3) Krishna (32 cases). Most complaints involve garbage collection delays during monsoon season. Recommended action: Deploy additional sanitation workers and schedule preventive maintenance.',
  'water': 'Water supply complaints show a 23% increase in the last 6 months. Critical areas: East Godavari (pipeline bursts), Chittoor (contamination reports), Prakasam (irregular supply). Similar past cases were resolved through emergency pipeline repairs and water quality testing. Average resolution time: 5-7 days.',
  'power': 'Electricity outages are concentrated in rural areas of Anantapur, Kurnool, and Kadapa districts. Pattern analysis shows transformer failures as the primary cause (67% of cases). Past interventions: Emergency transformer replacements and scheduled maintenance reduced repeat complaints by 45%.',
  'healthcare': 'Healthcare complaints primarily involve staff shortages (52%) and medicine availability (31%). Affected districts: Vizianagaram, Srikakulam, Nellore. Recent policy intervention: Mobile health units deployed to 3 districts resulted in 40% reduction in similar complaints within 2 months.',
  'default': 'I can help you analyze grievance patterns, find similar past cases, and suggest resolution strategies. Try asking about specific categories like "sanitation issues", "water supply problems", or "healthcare complaints in district X".'
};

function detectQuery(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('sanitation') || lower.includes('garbage') || lower.includes('sewage')) return 'sanitation';
  if (lower.includes('water') || lower.includes('pipeline')) return 'water';
  if (lower.includes('power') || lower.includes('electricity') || lower.includes('transformer')) return 'power';
  if (lower.includes('health') || lower.includes('medicine') || lower.includes('hospital')) return 'healthcare';
  return 'default';
}

export const OfficerChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Governance Intelligence Assistant. I can help you query historical grievance data, identify patterns, and suggest resolution strategies. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate API call delay
    setTimeout(() => {
      const queryType = detectQuery(input);
      const response = mockResponses[queryType];

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
              <h3 className="text-white font-semibold text-lg">Governance Assistant</h3>
              <p className="text-white/80 text-sm">RAG-powered Query System</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm text-gray-300">Analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about grievance patterns..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Try: "sanitation issues last 6 months" or "water supply in East Godavari"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
