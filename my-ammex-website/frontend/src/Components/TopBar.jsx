import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="bg-blue-900 h-15 w-full flex items-center px-5 text-white text-sm relative">
      <div className="flex justify-between w-full max-w-7xl">
        <div className="pl-16">
          <button 
            onClick={() => navigate('/Homepage/index.html')} 
            className="text-3xl font-bold bg-transparent border-none text-white cursor-pointer"
          >
            Ammex
          </button>
        </div>
      </div>
      <div className="absolute right-8">
        <button className="p-2 hover:bg-blue-800 rounded-full transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </div>
  );
}

export default TopBar;