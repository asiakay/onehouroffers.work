
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  // Basic phone validation - adjust for your needs
  const re = /^[\d\s\-\(\)\+]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function validateBooking(data) {
  const errors = [];

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Valid phone number is required');
  }

  if (!data.serviceId || !data.serviceName) {
    errors.push('Service selection is required');
  }

  if (!data.preferredDate) {
    errors.push('Preferred date is required');
  } else {
    const date = new Date(data.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push('Preferred date cannot be in the past');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validatePayment(data) {
  const errors = [];

  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.push('Valid amount is required');
  }

  if (!data.serviceId) {
    errors.push('Service ID is required');
  }

  if (!data.customerEmail || !validateEmail(data.customerEmail)) {
    errors.push('Valid customer email is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
