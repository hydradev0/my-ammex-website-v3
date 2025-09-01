import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

const AdvanceActionsDropdown = ({
  item,
  actions = [],
  onAction,
  quickActions = [],
  dropdownClassName = "absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200",
  buttonClassName = "text-gray-400 hover:text-gray-600 p-1 rounded transition-colors",
  actionItemClassName = "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    if (onAction) {
      onAction(item, action.key || action);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      {/* Quick Actions */}
      {quickActions.map((action) => {
        // Check if action should be shown based on condition
        if (action.condition && !action.condition(item)) {
          return null;
        }

        const IconComponent = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => handleAction(action)}
            className={action.className || "p-1 rounded transition-colors"}
            title={action.title || action.label}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
          </button>
        );
      })}

      {/* More Actions Dropdown */}
      {actions.length > 0 && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleToggle}
            className={buttonClassName}
            title="More Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {isOpen && (
            <div ref={dropdownRef} className={dropdownClassName}>
              <div className="py-1">
                {actions.map((action) => {
                  // Check if action should be shown based on condition
                  if (action.condition && !action.condition(item)) {
                    return null;
                  }

                  const IconComponent = action.icon;
                  return (
                    <button
                      key={action.key}
                      onClick={() => handleAction(action)}
                      className={actionItemClassName}
                      title={action.title}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvanceActionsDropdown;
