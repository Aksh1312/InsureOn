import { useEffect, useState } from 'react';
import api from '../api';

const initialState = {
  user: null,
  profile: null,
  riskScore: null,
  smartworkTip: null,
  activePolicy: null,
  policyHistory: [],
  activeClaim: null,
  claimHistory: [],
  incomeLogs: [],
  payoutHistory: [],
  premiumBreakdown: null,
};

export const useDashboardData = () => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        if (!isMounted) return;

        setData({
          user: response.data.user || null,
          profile: response.data.profile || null,
          riskScore: response.data.risk_score || null,
          smartworkTip: response.data.smartwork_tip || null,
          activePolicy: response.data.active_policy || null,
          policyHistory: response.data.policy_history || [],
          activeClaim: response.data.active_claim || null,
          claimHistory: response.data.claim_history || [],
          incomeLogs: response.data.income_logs || [],
          payoutHistory: response.data.payout_history || [],
          premiumBreakdown: response.data.premium_breakdown || null,
        });
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.detail || 'Unable to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/dashboard/summary');
      setData({
        user: response.data.user || null,
        profile: response.data.profile || null,
        riskScore: response.data.risk_score || null,
        smartworkTip: response.data.smartwork_tip || null,
        activePolicy: response.data.active_policy || null,
        policyHistory: response.data.policy_history || [],
        activeClaim: response.data.active_claim || null,
        claimHistory: response.data.claim_history || [],
        incomeLogs: response.data.income_logs || [],
        payoutHistory: response.data.payout_history || [],
        premiumBreakdown: response.data.premium_breakdown || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return { ...data, loading, error, refresh };
};