// Helper to format created_by for display and storage
const formatCreatedBy = (userSession) => {
    if (!userSession || !userSession.userId) {
        return 'admin';
    }

    if (userSession.userRole === 'OWNER') {
        return 'admin';
    }

    // Staff: format as "name - id"
    return `${userSession.userFullName} - ${userSession.userId}`;
};

module.exports = { formatCreatedBy };
