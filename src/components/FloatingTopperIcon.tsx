import { Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function FloatingTopperIcon() {
  const navigate = useNavigate();
  const isEditorPage = window.location.pathname === '/custom-topper';

  if (isEditorPage) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/custom-topper')}
      className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-all duration-300 hover:bg-gray-900 md:right-8"
      style={{
        boxShadow: '0 0 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,1)'
      }}
      title="Diseña tu Topper"
    >
      <Scissors size={24} />
      <div className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
        NEW
      </div>
    </motion.button>
  );
}
