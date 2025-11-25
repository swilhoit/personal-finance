/**
 * TypeScript declarations for Teller Connect SDK
 * @see https://teller.io/docs/guides/connect
 */

declare global {
  interface Window {
    TellerConnect?: TellerConnectStatic;
  }
}

export interface TellerConnectStatic {
  setup(config: TellerConnectConfig): TellerConnectInstance;
}

export interface TellerConnectInstance {
  open(): void;
  destroy(): void;
}

export interface TellerConnectConfig {
  /** Your Teller application ID */
  applicationId: string;
  
  /** Environment: sandbox, development, or production */
  environment?: 'sandbox' | 'development' | 'production';
  
  /** Institution ID to connect to (optional - if not provided, user selects from list) */
  institutionId?: string;
  
  /** Teller products to request access to */
  products?: ('balance' | 'transactions' | 'identity' | 'details')[];
  
  /** Allow multiple account selection */
  selectAccount?: 'disabled' | 'single' | 'multiple';
  
  /** User ID for tracking purposes */
  userId?: string;
  
  /** Enrollment ID to reconnect an existing enrollment */
  enrollmentId?: string;
  
  /** Connect token for additional security (optional) */
  connectToken?: string;

  /** Called when the user successfully connects their bank */
  onSuccess?(enrollment: TellerEnrollment): void;
  
  /** Called when the user exits without completing enrollment */
  onExit?(): void;
  
  /** Called when the user needs to reconnect their bank (re-authentication) */
  onFailure?(failure: TellerFailure): void;
  
  /** Called when the widget is initialized */
  onInit?(): void;
  
  /** Called when an event occurs in the widget */
  onEvent?(event: TellerEvent): void;
}

export interface TellerEnrollment {
  /** The access token to use for API calls */
  accessToken: string;
  
  /** The enrollment ID */
  enrollmentId?: string;
  
  /** User information */
  user?: {
    id: string;
  };
  
  /** Connected institution details */
  institution?: TellerInstitution;
  
  /** Connected accounts */
  accounts?: TellerAccount[];
  
  /** Signatures for account verification (if requested) */
  signatures?: string[];
}

export interface TellerInstitution {
  id: string;
  name: string;
}

export interface TellerAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currency: string;
  enrollmentId: string;
  institution: TellerInstitution;
  lastFour: string;
}

export interface TellerFailure {
  type: string;
  code: string;
  message: string;
  enrollmentId?: string;
}

export interface TellerEvent {
  name: string;
  data?: Record<string, unknown>;
}

export {};

