import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navigation() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const isInventoryAllowed = role === 'Admin' || role === 'Warehouse Supervisor' || role === 'Sales Marketing';
  const isSalesAllowed = role === 'Admin' || role === 'Sales Marketing';
  const isBusinessPartnersAllowed = role === 'Admin' || role === 'Sales Marketing' || role === 'Warehouse Supervisor';
  const isPurchasingAllowed = role === 'Admin' || role === 'Sales Marketing';
  const customerAllowed = role === 'Admin' || role === 'Sales Marketing';
  const supplierAllowed = role === 'Admin' || role === 'Warehouse Supervisor';

  const navItems = [
    {
      name: 'Home',
      dropdownItems: [
        { name: 'Dashboard', link: '/Home/Dashboard' },
        { name: 'Analytics', link: '/Home/Analytics' },
      ]
    },
    isBusinessPartnersAllowed ? {
      name: 'Business Partners',
      dropdownItems: [
        customerAllowed ? { name: 'Customers', link: '/BusinessPartners/Customers' } : null,
        supplierAllowed ? { name: 'Suppliers', link: '/BusinessPartners/Suppliers' } : null,
      ].filter(Boolean)
    } : null,
    isSalesAllowed ? {
      name: 'Sales',
      dropdownItems: [
        { name: 'Orders', link: '/Sales/Orders' },
        { name: 'Invoices', link: '/Sales/Invoices' },
        { name: 'Payments', link: '/Sales/Payments' },
        // { name: 'Sales Quotes', link: '/Sales/SalesQuotes' },
        // { name: 'Sales Order', link: '/Sales/SalesOrder' },
        // { name: 'Sales Invoice', link: '/Sales/SalesInvoice' },
        // { name: 'Delivery', link: '/Sales/Delivery' }
      ]
    } : null,
    isPurchasingAllowed ? {
      name: 'Purchasing',
      dropdownItems: [
        // { name: 'Purchase Quotes', link: '/Purchasing/PurchaseQuotes' },
        { name: 'Purchase Order', link: '/Purchasing/PurchaseOrder' },
      ]
    } : null,
    isInventoryAllowed ? {
      name: 'Inventory',
      dropdownItems: (
        role === 'Sales Marketing'
          ? [
              { name: 'Items', link: '/Inventory/Items' }
            ]
          : [
              { name: 'Items', link: '/Inventory/Items' },
              { name: 'Unit', link: '/Inventory/Unit' },
              { name: 'Category', link: '/Inventory/Category' },
              // { name: 'Product Specs', link: '/Inventory/ProductSpecs' },
            ]
      )
    } : null,
    // {
    //   name: 'Financial',
    //   dropdownItems: [
    //     { name: 'Collection', link: '/Financial/Collection' },
    //     { name: 'Voucher', link: '/Financial/Voucher' },
    //   ]
    // },
    // {
    //   name: 'Reports',
    //   dropdownItems: [
    //     { name: 'Sales Report', link: '/Reports/Sales' },
    //     { name: 'Purchase Report', link: '/Reports/Purchase' },
    //     { name: 'Sales per Item', link: '/Reports/SalesPerItem' }
    //   ]
    // }
  ];

  const filteredNavItems = navItems.filter(Boolean);

  const handleNavigate = (link) => {
    setHoveredItem(null); // Close dropdown
    navigate(link); // Using React Router's navigation instead of window.location
  };

  // Check if any dropdown item matches current path
  const isItemActive = (items) => {
    return items.some(item => item.link === location.pathname);
  };

  return (
    <nav className="bg-white shadow-md h-18 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-0 flex justify-start items-center ml-15">
        <ul className="flex list-none ">
          {filteredNavItems.map((item, index) => {
            const isActive = isItemActive(item.dropdownItems);
            return (
              <li
                key={index}
                className="relative mx-4"
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  className={`no-underline font-medium text-xl py-3 px-4 flex items-center transition-all duration-300 
                    rounded text-gray-600 hover:bg-blue-50 cursor-pointer`}
                >
                  {item.name} <ChevronDown className={`ml-1 mt-1 transition-transform duration-300 ${hoveredItem === index ? 'rotate-180' : ''}`} size={24} />
                </button>
                <ul
                  className={`absolute top-full left-0 bg-white w-56 rounded-md shadow-lg transform transition-all duration-300 z-[400] ${
                    hoveredItem === index ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                  }`}
                >
                  {item.dropdownItems.map((dropdownItem, idx) => {
                    const isDropdownActive = location.pathname === dropdownItem.link ||
                      (location.pathname.endsWith('.html') &&
                        location.pathname.replace('.html', '') === dropdownItem.link);
                    return (
                      <li
                        key={idx}
                        className={`py-3 px-4 text-xl border-b border-gray-100 transition-all duration-200
                          text-gray-700 hover:text-black cursor-pointer hover:bg-gray-50 hover:pl-5 last:border-b-0`}
                      >
                        <button
                          onClick={() => {
                            handleNavigate(dropdownItem.link)
                          }}
                          className={`w-full text-left no-underline cursor-pointer`}
                        >
                          {dropdownItem.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;