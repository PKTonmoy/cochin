import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

/**
 * Custom hook for Socket.IO real-time updates on student portal
 * Handles attendance and results update notifications
 */
export function useSocketUpdates(studentId, studentClass, studentSection) {
    const socketRef = useRef(null);
    const queryClient = useQueryClient();

    // Connect to socket and setup event listeners
    useEffect(() => {
        if (!studentId) return;

        const socketUrl = import.meta.env.PROD ? '/' : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

        // Initialize socket connection
        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        const socket = socketRef.current;

        // Authenticate when connected
        socket.on('connect', () => {
            console.log('🔌 Student portal socket connected');
            socket.emit('authenticate', {
                userId: studentId,
                userType: 'student',
                class: studentClass,
                section: studentSection
            });
        });

        // Handle attendance updates
        socket.on('attendance-updated', (data) => {
            console.log('📝 Attendance update received:', data);

            // Invalidate attendance queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-overview'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard-v2'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });

            // Show toast notification
            if (data.type === 'personal_attendance') {
                const statusEmoji = data.status === 'present' ? '✅' : data.status === 'late' ? '⏰' : '❌';
                toast.success(`${statusEmoji} Your attendance has been marked: ${data.status.toUpperCase()}`, {
                    duration: 5000,
                    icon: '📋'
                });
            } else if (data.type === 'attendance_marked') {
                toast(data.message || 'Attendance has been updated', {
                    duration: 4000,
                    icon: '📋'
                });
            }
        });

        // Handle results updates
        socket.on('results-updated', (data) => {
            console.log('📊 Results update received:', data);

            // Invalidate results queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['student-results'] });
            queryClient.invalidateQueries({ queryKey: ['recent-results'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['test-result'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard-v2'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });

            // Show toast notification
            toast.success(data.message || `Results for ${data.testName} are now available!`, {
                duration: 6000,
                icon: '🎉'
            });
        });

        // Handle schedule updates
        socket.on('schedule-update', (data) => {
            console.log('📅 Schedule update received:', data);

            // Invalidate schedule queries
            queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
            queryClient.invalidateQueries({ queryKey: ['student-schedule'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard-v2'] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });

            // Show appropriate notification
            let message = '';
            switch (data.type) {
                case 'created':
                    message = `New ${data.entityType} scheduled: ${data.entity?.title || data.entity?.testName}`;
                    break;
                case 'cancelled':
                    message = `${data.entityType === 'class' ? 'Class' : 'Test'} cancelled: ${data.entity?.title || data.entity?.testName}`;
                    break;
                case 'rescheduled':
                    message = `${data.entityType === 'class' ? 'Class' : 'Test'} rescheduled: ${data.entity?.title || data.entity?.testName}`;
                    break;
                default:
                    message = `Schedule has been updated`;
            }

            toast(message, {
                duration: 5000,
                icon: '📅'
            });
        });

        // Handle general notifications
        socket.on('notification', (data) => {
            console.log('🔔 Notification received:', data);

            // Show notification toast based on priority
            const toastFn = data.priority === 'high' ? toast.error :
                data.priority === 'medium' ? toast : toast.success;

            toastFn(data.message || data.title, {
                duration: data.priority === 'high' ? 8000 : 5000,
                icon: '🔔'
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('🔌 Student portal socket disconnected');
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [studentId, studentClass, studentSection, queryClient]);

    // Manual refresh function
    const refreshData = useCallback(() => {
        queryClient.invalidateQueries();
    }, [queryClient]);

    return {
        isConnected: socketRef.current?.connected ?? false,
        refreshData
    };
}

export default useSocketUpdates;
