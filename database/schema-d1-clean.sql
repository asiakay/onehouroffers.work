CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_price TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending',
    message TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    payment_intent_id TEXT,
    crm_contact_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    stripe_customer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date ON bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE VIEW IF NOT EXISTS booking_details AS
SELECT 
    b.id,
    b.booking_id,
    b.service_id,
    b.service_name,
    b.service_price,
    b.preferred_date,
    b.preferred_time,
    b.status,
    b.payment_status,
    b.payment_intent_id,
    b.message,
    b.created_at as booking_created_at,
    c.id as customer_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.business_name
FROM bookings b
JOIN customers c ON b.customer_id = c.id;

CREATE VIEW IF NOT EXISTS payment_summary AS
SELECT 
    b.booking_id,
    b.service_name,
    c.email as customer_email,
    p.amount,
    p.currency,
    p.status as payment_status,
    p.payment_intent_id,
    p.created_at as payment_date
FROM payments p
JOIN bookings b ON p.booking_id = b.id
JOIN customers c ON b.customer_id = c.id;

CREATE TRIGGER IF NOT EXISTS update_customer_timestamp 
AFTER UPDATE ON customers
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_booking_timestamp 
AFTER UPDATE ON bookings
BEGIN
    UPDATE bookings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_payment_timestamp 
AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
