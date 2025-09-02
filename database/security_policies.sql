-- Enhanced security policies for InfinityStack

-- Enable MFA for platform users
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- Session security
CREATE TABLE IF NOT EXISTS user_sessions_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    event_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'password_change', 'mfa_enabled', etc.
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier TEXT,
    max_attempts INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM failed_login_attempts
    WHERE email = identifier
    AND created_at > NOW() - INTERVAL '1 minute' * window_minutes;
    
    RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_security_user_id ON user_sessions_security(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_security_expires ON user_sessions_security(expires_at);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);