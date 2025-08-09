import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#2c5282] w-full flex items-center px-3 sm:px-5 text-white text-sm h-16 sm:h-18">
      <div className="flex justify-between w-full max-w-7xl">
        <div className="pl-4 sm:pl-8 md:pl-16">
          <button 
            className="text-2xl sm:text-3xl font-bold bg-transparent border-none text-white cursor-pointer"
          >
            Ammex
          </button>
        </div>
      </div>
      <div className="absolute right-8 sm:right-8">
        <button className="p-1.5 sm:p-2 text-white hover:bg-gray-700 hover:text-white rounded-full transition-colors">
          <Bell size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
}

export default TopBar;