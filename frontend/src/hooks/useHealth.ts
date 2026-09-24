import { useState, useEffect } from 'react';
import { fetchHealth } from '../services/api';
import { HealthCheckResponse } from '../types';

export function useHealth() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching health status');
        setLoading(false);
      });
  }, []);

  return { health, loading, error };
}
