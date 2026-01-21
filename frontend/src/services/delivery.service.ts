
export const DeliveryService = {
    // Get WhatsApp Link
    getWhatsAppLink: async (consultationId: string): Promise<string> => {
        try {
            const response = await fetch(`/api/print/${consultationId}/whatsapp-link`);
            if (!response.ok) {
                throw new Error('Failed to generate WhatsApp link');
            }
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Error generating WhatsApp link:', error);
            throw error;
        }
    },

    // Send Email
    sendEmail: async (consultationId: string, email: string): Promise<void> => {
        try {
            const response = await fetch(`/api/print/${consultationId}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    },

    // Validate Token (Public)
    validateToken: async (token: string): Promise<any> => {
        try {
            const response = await fetch(`/api/v/${token}`);
            if (!response.ok) {
                if (response.status === 404) return null; // Invalid token
                throw new Error('Validation failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Error validating token:', error);
            throw error;
        }
    }
};
