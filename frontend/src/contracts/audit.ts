export interface DispatchSummaryItem {
    uuid: string;
    consultation_id: number;
    patient_name: string;
    doctor_name: string;
    issue_date: string; // ISO 8601
    email_sent_at: string | null;
    whatsapp_sent_at: string | null;
}

export interface DispatchAuditResponse {
    items: DispatchSummaryItem[];
    total_count: number;
}

export type DispatchStatus = 'all' | 'pending' | 'sent';

export interface DispatchAuditFilterParams {
    start_date?: string;
    end_date?: string;
    status?: DispatchStatus;
}
