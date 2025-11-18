import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEmployee: string;
  setFilterEmployee: (employee: string) => void;
  selectedMeetingId: number | null;
  setSelectedMeetingId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  return (
    <AppContext.Provider value={{
      searchTerm,
      setSearchTerm,
      filterEmployee,
      setFilterEmployee,
      selectedMeetingId,
      setSelectedMeetingId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
