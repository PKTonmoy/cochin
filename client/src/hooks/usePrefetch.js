import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';

/**
 * usePrefetch — Smart data prefetching hook
 * Pre-fetches data for likely next pages based on the current route.
 * Only runs on good connections (3g+ / WiFi) and when the device is online.
 * Uses queryClient.prefetchQuery() so data is ready before navigation.
 */
export function usePrefetch({ enabled = true, userRoll, userClass, userId } = {}) {
    const queryClient = useQueryClient();
    const location = useLocation();
    const prefetchedRef = useRef(new Set());

    useEffect(() => {
        if (!enabled || !navigator.onLine) return;

        // Skip on slow connections
        const conn = navigator.connection;
        if (conn) {
            const slowTypes = ['slow-2g', '2g'];
            if (slowTypes.includes(conn.effectiveType) || conn.saveData) return;
        }

        const currentPath = location.pathname;
        const prefetchKey = currentPath;

        // Don't re-prefetch the same route within 5 minutes
        if (prefetchedRef.current.has(prefetchKey)) return;
        prefetchedRef.current.add(prefetchKey);

        // Clear stale prefetch tracking every 5 minutes
        const timer = setTimeout(() => {
            prefetchedRef.current.delete(prefetchKey);
        }, 5 * 60 * 1000);

        // Delay prefetch to avoid competing with current page load
        const prefetchTimer = setTimeout(() => {
            const prefetchMap = {
                '/student': () => {
                    // On Dashboard → prefetch Schedule, Results, Notices
                    if (userClass) {
                        queryClient.prefetchQuery({
                            queryKey: ['schedule-classes', userClass],
                            queryFn: () => api.get(`/classes/upcoming?class=${userClass}&limit=10`).then(r => r.data.data),
                            staleTime: 60000,
                        });
                    }
                    if (userRoll) {
                        queryClient.prefetchQuery({
                            queryKey: ['student-results'],
                            queryFn: () => api.get(`/results/student/${userRoll}`).then(r => r.data.data),
                            staleTime: 60000,
                        });
                    }
                    queryClient.prefetchQuery({
                        queryKey: ['student-notices', 1, '', false],
                        queryFn: () => api.get('/notifications/student-notices?page=1&limit=20').then(r => r.data.data),
                        staleTime: 60000,
                    });
                },
                '/student/schedule': () => {
                    // On Schedule → prefetch Results
                    if (userRoll) {
                        queryClient.prefetchQuery({
                            queryKey: ['student-results'],
                            queryFn: () => api.get(`/results/student/${userRoll}`).then(r => r.data.data),
                            staleTime: 60000,
                        });
                    }
                },
                '/student/results': () => {
                    // On Results → prefetch Attendance
                    if (userId) {
                        queryClient.prefetchQuery({
                            queryKey: ['student-attendance'],
                            queryFn: () => api.get(`/attendance/student/${userId}`).then(r => r.data.data),
                            staleTime: 60000,
                        });
                    }
                },
                '/student/attendance': () => {
                    // On Attendance → prefetch Notices
                    queryClient.prefetchQuery({
                        queryKey: ['student-notices', 1, '', false],
                        queryFn: () => api.get('/notifications/student-notices?page=1&limit=20').then(r => r.data.data),
                        staleTime: 60000,
                    });
                },
                '/student/notices': () => {
                    // On Notices → prefetch Dashboard
                    if (userRoll) {
                        queryClient.prefetchQuery({
                            queryKey: ['student-dashboard-v2'],
                            queryFn: () => api.get(`/students/${userRoll}/dashboard`).then(r => r.data.data),
                            staleTime: 60000,
                        });
                    }
                },
            };

            const prefetchFn = prefetchMap[currentPath];
            if (prefetchFn) {
                try { prefetchFn(); } catch { }
            }
        }, 1500); // Wait 1.5s after page load before prefetching

        return () => {
            clearTimeout(timer);
            clearTimeout(prefetchTimer);
        };
    }, [location.pathname, enabled, userRoll, userClass, userId, queryClient]);
}

export default usePrefetch;
