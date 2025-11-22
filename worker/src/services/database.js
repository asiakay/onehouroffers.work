// worker/src/services/database.js

export async function createBooking(db, bookingData) {
  try {
    // First, check if customer exists or create new one
    const existingCustomer = await db
      .prepare('SELECT id FROM customers WHERE email = ?')
      .bind(bookingData.email)
      .first();

    let customerId;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      // Update customer info
      await db
        .prepare(
          'UPDATE customers SET first_name = ?, last_name = ?, phone = ?, business_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        )
        .bind(
          bookingData.firstName,
          bookingData.lastName,
          bookingData.phone,
          bookingData.businessName || null,
          customerId
        )
        .run();
    } else {
      // Create new customer
      const customerResult = await db
        .prepare(
          'INSERT INTO customers (first_name, last_name, email, phone, business_name) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          bookingData.firstName,
          bookingData.lastName,
          bookingData.email,
          bookingData.phone,
          bookingData.businessName || null
        )
        .run();

      customerId = customerResult.meta.last_row_id;
    }

    // Create booking
    const bookingResult = await db
      .prepare(
        `INSERT INTO bookings (
          booking_id, customer_id, service_id, service_name, service_price,
          preferred_date, preferred_time, message, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        bookingData.bookingId,
        customerId,
        bookingData.serviceId,
        bookingData.serviceName,
        bookingData.servicePrice,
        bookingData.preferredDate,
        bookingData.preferredTime || null,
        bookingData.message || null,
        bookingData.status || 'pending',
        bookingData.paymentStatus || 'unpaid'
      )
      .run();

    return {
      id: bookingResult.meta.last_row_id,
      bookingId: bookingData.bookingId,
      customerId,
      status: bookingData.status || 'pending',
      serviceName: bookingData.serviceName,
      preferredDate: bookingData.preferredDate
    };

  } catch (error) {
    console.error('Database error - createBooking:', error);
    throw new Error('Failed to create booking in database');
  }
}

export async function getBooking(db, bookingId) {
  try {
    const result = await db
      .prepare(
        `SELECT 
          b.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.business_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        WHERE b.booking_id = ?`
      )
      .bind(bookingId)
      .first();

    return result;
  } catch (error) {
    console.error('Database error - getBooking:', error);
    throw new Error('Failed to retrieve booking');
  }
}

export async function updateBookingStatus(db, bookingId, status) {
  try {
    await db
      .prepare(
        'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?'
      )
      .bind(status, bookingId)
      .run();

    return true;
  } catch (error) {
    console.error('Database error - updateBookingStatus:', error);
    throw new Error('Failed to update booking status');
  }
}

export async function updatePaymentStatus(db, bookingId, paymentStatus, paymentIntentId) {
  try {
    await db
      .prepare(
        'UPDATE bookings SET payment_status = ?, payment_intent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?'
      )
      .bind(paymentStatus, paymentIntentId, bookingId)
      .run();

    return true;
  } catch (error) {
    console.error('Database error - updatePaymentStatus:', error);
    throw new Error('Failed to update payment status');
  }
}

export async function recordPayment(db, bookingId, paymentData) {
  try {
    // Get booking ID from database
    const booking = await db
      .prepare('SELECT id FROM bookings WHERE booking_id = ?')
      .bind(bookingId)
      .first();

    if (!booking) {
      throw new Error('Booking not found');
    }

    await db
      .prepare(
        'INSERT INTO payments (booking_id, payment_intent_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        booking.id,
        paymentData.paymentIntentId,
        paymentData.amount,
        paymentData.currency,
        paymentData.status
      )
      .run();

    return true;
  } catch (error) {
    console.error('Database error - recordPayment:', error);
    throw new Error('Failed to record payment');
  }
}

export async function getBookingsByCustomer(db, email) {
  try {
    const results = await db
      .prepare(
        `SELECT 
          b.*
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        WHERE c.email = ?
        ORDER BY b.created_at DESC`
      )
      .bind(email)
      .all();

    return results.results || [];
  } catch (error) {
    console.error('Database error - getBookingsByCustomer:', error);
    throw new Error('Failed to retrieve customer bookings');
  }
}
