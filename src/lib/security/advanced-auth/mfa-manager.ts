export interface MFAMethod {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'hardware_key' | 'biometric';
  enabled: boolean;
  verified: boolean;
  secret?: string;
  backupCodes: string[];
  createdAt: string;
  lastUsed?: string;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod['type'];
  code: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

export interface AuthSession {
  id: string;
  userId: string;
  mfaCompleted: boolean;
  partialToken: string;
  fullToken?: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

export class MFAManager {
  private methods: Map<string, MFAMethod[]> = new Map();
  private challenges: Map<string, MFAChallenge> = new Map();
  private sessions: Map<string, AuthSession> = new Map();

  async setupTOTP(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    
    const method: MFAMethod = {
      id: crypto.randomUUID(),
      userId,
      type: 'totp',
      enabled: false,
      verified: false,
      secret,
      backupCodes,
      createdAt: new Date().toISOString()
    };

    const userMethods = this.methods.get(userId) || [];
    userMethods.push(method);
    this.methods.set(userId, userMethods);

    return {
      secret,
      qrCode: this.generateQRCode(secret, userId),
      backupCodes
    };
  }

  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const userMethods = this.methods.get(userId) || [];
    const totpMethod = userMethods.find(m => m.type === 'totp' && !m.verified);
    
    if (!totpMethod || !totpMethod.secret) return false;

    const isValid = this.validateTOTPCode(totpMethod.secret, code);
    
    if (isValid) {
      totpMethod.verified = true;
      totpMethod.enabled = true;
      totpMethod.lastUsed = new Date().toISOString();
    }

    return isValid;
  }

  async enableSMS(userId: string, phoneNumber: string): Promise<MFAMethod> {
    const method: MFAMethod = {
      id: crypto.randomUUID(),
      userId,
      type: 'sms',
      enabled: true,
      verified: false,
      backupCodes: this.generateBackupCodes(),
      createdAt: new Date().toISOString()
    };

    const userMethods = this.methods.get(userId) || [];
    userMethods.push(method);
    this.methods.set(userId, userMethods);

    // Send verification SMS
    await this.sendSMSCode(phoneNumber, userId);

    return method;
  }

  async createChallenge(userId: string, preferredMethod?: MFAMethod['type']): Promise<MFAChallenge> {
    const userMethods = this.methods.get(userId) || [];
    const enabledMethods = userMethods.filter(m => m.enabled && m.verified);

    if (enabledMethods.length === 0) {
      throw new Error('No MFA methods enabled');
    }

    let selectedMethod = enabledMethods[0];
    if (preferredMethod) {
      const preferred = enabledMethods.find(m => m.type === preferredMethod);
      if (preferred) selectedMethod = preferred;
    }

    const challenge: MFAChallenge = {
      id: crypto.randomUUID(),
      userId,
      method: selectedMethod.type,
      code: this.generateChallengeCode(selectedMethod.type),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      verified: false
    };

    this.challenges.set(challenge.id, challenge);

    // Send challenge based on method type
    await this.sendChallenge(challenge, selectedMethod);

    return challenge;
  }

  async verifyChallenge(challengeId: string, code: string): Promise<{
    success: boolean;
    token?: string;
    remainingAttempts?: number;
  }> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return { success: false };
    }

    if (new Date() > new Date(challenge.expiresAt)) {
      this.challenges.delete(challengeId);
      return { success: false };
    }

    challenge.attempts++;

    if (challenge.attempts > challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      return { success: false };
    }

    let isValid = false;

    switch (challenge.method) {
      case 'totp':
        isValid = this.validateTOTPCode(this.getTOTPSecret(challenge.userId), code);
        break;
      case 'sms':
      case 'email':
        isValid = challenge.code === code;
        break;
      case 'hardware_key':
        isValid = await this.validateHardwareKey(challenge.userId, code);
        break;
    }

    if (isValid) {
      challenge.verified = true;
      const token = this.generateMFAToken(challenge.userId);
      this.challenges.delete(challengeId);
      
      // Update method last used
      this.updateMethodLastUsed(challenge.userId, challenge.method);
      
      return { success: true, token };
    }

    return {
      success: false,
      remainingAttempts: challenge.maxAttempts - challenge.attempts
    };
  }

  async createPartialSession(userId: string, ipAddress: string, userAgent: string): Promise<AuthSession> {
    const session: AuthSession = {
      id: crypto.randomUUID(),
      userId,
      mfaCompleted: false,
      partialToken: this.generatePartialToken(userId),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      ipAddress,
      userAgent
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async completeMFASession(sessionId: string, mfaToken: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.mfaCompleted) return null;

    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(sessionId);
      return null;
    }

    if (this.validateMFAToken(session.userId, mfaToken)) {
      session.mfaCompleted = true;
      session.fullToken = this.generateFullToken(session.userId);
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      return session.fullToken;
    }

    return null;
  }

  private generateSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(36))
      .join('');
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }

  private generateQRCode(secret: string, userId: string): string {
    return `otpauth://totp/InfinityStack:${userId}?secret=${secret}&issuer=InfinityStack`;
  }

  private validateTOTPCode(secret: string, code: string): boolean {
    // Simplified TOTP validation - in production use proper TOTP library
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedCode = this.generateTOTPCode(secret, timeStep);
    return code === expectedCode;
  }

  private generateTOTPCode(secret: string, timeStep: number): string {
    // Simplified TOTP generation - use proper crypto library in production
    return ((timeStep % 1000000)).toString().padStart(6, '0');
  }

  private generateChallengeCode(method: MFAMethod['type']): string {
    switch (method) {
      case 'sms':
      case 'email':
        return Math.floor(100000 + Math.random() * 900000).toString();
      case 'totp':
        return ''; // TOTP doesn't need server-generated code
      default:
        return crypto.randomUUID().substring(0, 8);
    }
  }

  private async sendChallenge(challenge: MFAChallenge, method: MFAMethod): Promise<void> {
    switch (challenge.method) {
      case 'sms':
        console.log(`SMS code ${challenge.code} sent to user ${challenge.userId}`);
        break;
      case 'email':
        console.log(`Email code ${challenge.code} sent to user ${challenge.userId}`);
        break;
      case 'totp':
        // No action needed - user generates code
        break;
    }
  }

  private async sendSMSCode(phoneNumber: string, userId: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`SMS verification code ${code} sent to ${phoneNumber}`);
  }

  private getTOTPSecret(userId: string): string {
    const userMethods = this.methods.get(userId) || [];
    const totpMethod = userMethods.find(m => m.type === 'totp' && m.verified);
    return totpMethod?.secret || '';
  }

  private async validateHardwareKey(userId: string, signature: string): Promise<boolean> {
    // Mock hardware key validation
    return signature.length > 10;
  }

  private generatePartialToken(userId: string): string {
    return `partial_${userId}_${Date.now()}`;
  }

  private generateMFAToken(userId: string): string {
    return `mfa_${userId}_${Date.now()}`;
  }

  private generateFullToken(userId: string): string {
    return `full_${userId}_${Date.now()}`;
  }

  private validateMFAToken(userId: string, token: string): boolean {
    return token.startsWith(`mfa_${userId}_`);
  }

  private updateMethodLastUsed(userId: string, methodType: MFAMethod['type']): void {
    const userMethods = this.methods.get(userId) || [];
    const method = userMethods.find(m => m.type === methodType);
    if (method) {
      method.lastUsed = new Date().toISOString();
    }
  }

  getUserMethods(userId: string): MFAMethod[] {
    return this.methods.get(userId) || [];
  }

  async disableMethod(userId: string, methodId: string): Promise<boolean> {
    const userMethods = this.methods.get(userId) || [];
    const method = userMethods.find(m => m.id === methodId);
    
    if (method) {
      method.enabled = false;
      return true;
    }
    
    return false;
  }

  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const userMethods = this.methods.get(userId) || [];
    
    for (const method of userMethods) {
      const codeIndex = method.backupCodes.indexOf(code);
      if (codeIndex !== -1) {
        method.backupCodes.splice(codeIndex, 1); // Remove used code
        method.lastUsed = new Date().toISOString();
        return true;
      }
    }
    
    return false;
  }
}