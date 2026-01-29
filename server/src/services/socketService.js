/**
 * Socket.io Service
 * Real-time communication for notifications and updates
 */

const { Server } = require('socket.io');

let io = null;
const userSockets = new Map(); // Map userId -> Set of socket IDs
const studentSockets = new Map(); // Map studentId -> Set of socket IDs

/**
 * Initialize Socket.io with HTTP server
 */
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Handle user authentication
        socket.on('authenticate', (data) => {
            const { userId, userType } = data; // userType: 'user' or 'student'

            if (userId) {
                const targetMap = userType === 'student' ? studentSockets : userSockets;

                if (!targetMap.has(userId)) {
                    targetMap.set(userId, new Set());
                }
                targetMap.get(userId).add(socket.id);

                // Join user-specific room
                socket.join(`${userType}:${userId}`);

                // Join role-based rooms for users
                if (data.role) {
                    socket.join(`role:${data.role}`);
                }

                // Join class-based room for students
                if (data.class) {
                    socket.join(`class:${data.class}`);
                    if (data.section) {
                        socket.join(`class:${data.class}:${data.section}`);
                    }
                }

                console.log(`👤 ${userType} ${userId} authenticated on socket ${socket.id}`);
            }
        });

        // Handle joining specific rooms
        socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`🚪 Socket ${socket.id} joined room: ${room}`);
        });

        // Handle leaving rooms
        socket.on('leave-room', (room) => {
            socket.leave(room);
            console.log(`🚶 Socket ${socket.id} left room: ${room}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);

            // Clean up user sockets
            for (const [userId, sockets] of userSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                    break;
                }
            }

            // Clean up student sockets
            for (const [studentId, sockets] of studentSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        studentSockets.delete(studentId);
                    }
                    break;
                }
            }
        });
    });

    console.log('🔌 Socket.io initialized');
    return io;
}

/**
 * Get the Socket.io instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
}

/**
 * Emit event to a specific user (admin/staff)
 */
function emitToUser(userId, event, data) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to a specific student
 */
function emitToStudent(studentId, event, data) {
    if (!io) return;
    io.to(`student:${studentId}`).emit(event, data);
}

/**
 * Emit event to all users with a specific role
 */
function emitToRole(role, event, data) {
    if (!io) return;
    io.to(`role:${role}`).emit(event, data);
}

/**
 * Emit event to all students in a class
 */
function emitToClass(className, event, data, section = null) {
    if (!io) return;

    if (section) {
        io.to(`class:${className}:${section}`).emit(event, data);
    } else {
        io.to(`class:${className}`).emit(event, data);
    }
}

/**
 * Emit event to all connected clients
 */
function broadcast(event, data) {
    if (!io) return;
    io.emit(event, data);
}

/**
 * Emit notification to appropriate recipients
 */
function emitNotification(notification) {
    if (!io) return;

    const event = 'notification';
    const data = {
        _id: notification._id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt
    };

    switch (notification.recipientType) {
        case 'student':
            emitToStudent(notification.recipientId.toString(), event, data);
            break;
        case 'user':
            emitToUser(notification.recipientId.toString(), event, data);
            break;
        case 'class':
            emitToClass(notification.recipientClass, event, data, notification.recipientSection);
            break;
        case 'all':
            broadcast(event, data);
            break;
    }
}

/**
 * Emit schedule update event
 */
function emitScheduleUpdate(type, entityType, entity, targetClass, targetSection) {
    if (!io) return;

    const event = 'schedule-update';
    const data = {
        type, // 'created', 'updated', 'cancelled', 'rescheduled'
        entityType, // 'class', 'test'
        entity,
        timestamp: new Date()
    };

    // Notify staff
    emitToRole('admin', event, data);
    emitToRole('staff', event, data);

    // Notify affected students
    emitToClass(targetClass, event, data, targetSection);
}

/**
 * Check if a user is online
 */
function isUserOnline(userId, userType = 'user') {
    const targetMap = userType === 'student' ? studentSockets : userSockets;
    return targetMap.has(userId) && targetMap.get(userId).size > 0;
}

/**
 * Get online user count
 */
function getOnlineCount() {
    return {
        users: userSockets.size,
        students: studentSockets.size,
        totalConnections: io ? io.sockets.sockets.size : 0
    };
}

module.exports = {
    initializeSocket,
    getIO,
    emitToUser,
    emitToStudent,
    emitToRole,
    emitToClass,
    broadcast,
    emitNotification,
    emitScheduleUpdate,
    isUserOnline,
    getOnlineCount
};
