import { useState } from 'react';

export function useAuth() {
  const [adminUser] = useState({
    id: 'admin-1',
    full_name: 'Δημήτρης Παπαδόπουλος',
    email: 'admin@palaiofaliro.gr',
    municipality: 'Παλαιό Φάληρο',
  });

  return { adminUser, loading: false };
}
