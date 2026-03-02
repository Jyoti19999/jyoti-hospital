import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import RegisterManager from './RegisterManager';
import EquipmentStockRegister from './EquipmentStockRegister';
import { registerConfigs } from './registerConfigs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Thermometer, 
  Refrigerator, 
  Package, 
  Pill, 
  AlertTriangle, 
  Gauge,
  ClipboardList,
  Database,
  ChevronRight,
  Search,
  X
} from 'lucide-react';

// Import the sub-components from DigitalRegisterManager
import { CreateRegisterForm, RegisterRecordManager } from './DigitalRegisterManager';

const RegistersTab = () => {
  const { user } = useAuth();
  const [activeRegister, setActiveRegister] = useState('eto');
  const [digitalRegisters, setDigitalRegisters] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch digital registers on mount with small delay to ensure auth is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDigitalRegisters();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchDigitalRegisters = async (retryCount = 0) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
      const response = await fetch(`${API_BASE_URL}/digital-registers/definitions`, {
        credentials: 'include'
      });
      
      // If unauthorized and first attempt, retry once after a short delay
      if (response.status === 401 && retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchDigitalRegisters(1);
      }
      
      const data = await response.json();
      if (data.success) {
        
        // Filter registers based on user's staff type
        const userStaffType = user?.staffType;
        
        const filteredRegisters = data.data.filter(register => {
          // If no allowedStaffTypes defined, show to everyone (backward compatibility)
          if (!register.allowedStaffTypes || register.allowedStaffTypes.length === 0) {
            return true;
          }
          // Check if user's staff type is in the allowed list
          const isAllowed = register.allowedStaffTypes.includes(userStaffType);
          return isAllowed;
        });
        
        setDigitalRegisters(filteredRegisters);
      }
    } catch (error) {
    }
  };

  const staticRegisterTabs = [
    {
      key: 'eto',
      label: 'ETO Register',
      icon: FileText,
      config: registerConfigs.eto
    },
    {
      key: 'otTemperature',
      label: 'OT Temperature',
      icon: Thermometer,
      config: registerConfigs.otTemperature
    },
    {
      key: 'refrigeratorTemperature',
      label: 'Refrigerator Temp',
      icon: Refrigerator,
      config: registerConfigs.refrigeratorTemperature
    },
    {
      key: 'otEmergencyStock',
      label: 'OT Emergency Stock',
      icon: Package,
      config: registerConfigs.otEmergencyStock
    },
    {
      key: 'fridgeStockMedicines',
      label: 'Fridge Stock Medicines',
      icon: Pill,
      config: registerConfigs.fridgeStockMedicines,
      isCustom: true // Use custom daily tracking component
    },
    {
      key: 'emergency',
      label: 'Emergency Register',
      icon: AlertTriangle,
      config: registerConfigs.emergency
    },
    {
      key: 'o2N2Pressure',
      label: 'O2 & N2 Pressure',
      icon: Gauge,
      config: registerConfigs.o2N2Pressure
    },
    {
      key: 'equipmentStock',
      label: 'Equipment Stock',
      icon: ClipboardList,
      isCustom: true
    }
  ];

  // Add digital registers as tabs
  const dynamicRegisterTabs = digitalRegisters.map(reg => ({
    key: `digital-${reg.id}`,
    label: reg.name,
    icon: Database,
    isDigitalRegister: true,
    registerData: reg
  }));

  const registerTabs = [...staticRegisterTabs, ...dynamicRegisterTabs];

  // Filter tabs based on search query
  const filteredStaticTabs = useMemo(() => {
    if (!searchQuery.trim()) return staticRegisterTabs;
    const q = searchQuery.toLowerCase();
    return staticRegisterTabs.filter(tab => tab.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredDynamicTabs = useMemo(() => {
    if (!searchQuery.trim()) return dynamicRegisterTabs;
    const q = searchQuery.toLowerCase();
    return dynamicRegisterTabs.filter(tab => tab.label.toLowerCase().includes(q));
  }, [searchQuery, dynamicRegisterTabs]);

  // Find active tab data for rendering content
  const activeTab = registerTabs.find(t => t.key === activeRegister);

  // Sidebar nav item renderer
  const NavItem = ({ tab }) => {
    const IconComponent = tab.icon;
    const isActive = activeRegister === tab.key;
    return (
      <button
        onClick={() => setActiveRegister(tab.key)}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left transition-all duration-150 ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border border-blue-200/60'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
        }`}
        title={tab.label}
      >
        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
        {!sidebarCollapsed && (
          <span className="text-sm truncate flex-1">{tab.label}</span>
        )}
        {!sidebarCollapsed && isActive && (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-400" />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden" style={{ maxHeight: 'calc(100vh - 8rem)', height: '100%' }}>
      {/* Compact header - fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-gray-50/30">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-gray-900">OT Registers</h1>
          <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
            {registerTabs.length}
          </Badge>
        </div>
        {digitalRegisters.length > 0 && (
          <span className="text-xs text-gray-400">
            {digitalRegisters.length} custom
          </span>
        )}
      </div>

      {/* Main layout: sidebar + content - scrollable area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar navigation */}
          <div className={`shrink-0 border-r bg-gray-50/70 transition-all duration-200 flex flex-col ${
            sidebarCollapsed ? 'w-14' : 'w-52'
          }`}>
            {/* Search input */}
            {!sidebarCollapsed && (
              <div className="p-2 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search registers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Register list */}
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {/* Static registers */}
                {!sidebarCollapsed && (
                  <div className="px-2 pt-1 pb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      OT Registers
                    </span>
                  </div>
                )}
                {filteredStaticTabs.map(tab => (
                  <NavItem key={tab.key} tab={tab} />
                ))}

                {/* Dynamic / custom registers */}
                {filteredDynamicTabs.length > 0 && (
                  <>
                    {!sidebarCollapsed && (
                      <div className="px-2 pt-3 pb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Custom Registers
                        </span>
                      </div>
                    )}
                    {sidebarCollapsed && <div className="my-2 mx-2 border-t border-gray-200" />}
                    {filteredDynamicTabs.map(tab => (
                      <NavItem key={tab.key} tab={tab} />
                    ))}
                  </>
                )}

                {/* No results message */}
                {filteredStaticTabs.length === 0 && filteredDynamicTabs.length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-400">No registers found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Tabs value={activeRegister} onValueChange={setActiveRegister}>
              {registerTabs.map((tab) => (
                <TabsContent key={tab.key} value={tab.key} className="mt-0 focus-visible:outline-none focus-visible:ring-0 h-full">
                  {tab.isDigitalRegister ? (
                    <RegisterRecordManager 
                      register={tab.registerData} 
                      onBack={fetchDigitalRegisters}
                    />
                  ) : tab.isCustom ? (
                    <EquipmentStockRegister 
                      registerType={tab.config?.registerType}
                      title={tab.config?.title}
                    />
                  ) : (
                    <RegisterManager
                      title={tab.config.title}
                      apiEndpoint={tab.config.apiEndpoint}
                      fields={tab.config.fields}
                      columns={tab.config.columns}
                      exportFilename={tab.config.exportFilename}
                      useEquipmentTable={tab.config.useEquipmentTable}
                      registerType={tab.config.registerType}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
  );
};

export default RegistersTab;