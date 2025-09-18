// FIX: Removed self-import causing circular dependency and declaration conflicts.
export enum UserRole {
    ADMIN = 'مدير النظام',
    USER = 'مستخدم عادي',
}

export enum UserStatus {
    ACTIVE = 'مفعل',
    INACTIVE = 'غير مفعل',
}

export interface User {
    id: string; // Firestore document ID
    uid: string; // Firebase Auth user ID
    fullName: string;
    email: string;
    familyId: string;
    role: UserRole;
    status: UserStatus;
}

export interface Family {
    id: string;
    familyName: string;
    saint: string;
}

export enum ItemTypeId {
    BOOL = 1,
    INT = 2,
    ONCE = 3, // بند يقيم مرة واحدة فقط
}

export interface EvaluationItem {
    id: string;
    itemName: string;
    itemTypeId: ItemTypeId;
    price: number;
}

// FIX: Added optional 'id' property to store the Firestore document ID, resolving type errors in AppContext.
export interface EvaluationPeriod {
    id?: string;
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

export interface EvaluationEntry {
    id?: string; // Firestore document ID
    familyId: string;
    userId: string; // This is the user's uid
    itemId: string;
    date: string; // YYYY-MM-DD
    value: 'Y' | 'N' | number;
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

export interface EvaluationControls {
    saveEnabled: boolean;
}