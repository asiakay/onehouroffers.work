
/**
 * CRM integration service
 * Supports: HubSpot, Salesforce, Pipedrive, custom CRM
 */

export async function addToCRM(env, customerData) {
  const crmProvider = env.CRM_PROVIDER || 'hubspot';

  try {
    switch (crmProvider) {
      case 'hubspot':
        return await addToHubSpot(env, customerData);
      case 'salesforce':
        return await addToSalesforce(env, customerData);
      case 'pipedrive':
        return await addToPipedrive(env, customerData);
      default:
        console.log('No CRM provider configured');
        return null;
    }
  } catch (error) {
    console.error('CRM integration error:', error);
    // Don't throw - CRM failure shouldn't break booking
    return null;
  }
}

async function addToHubSpot(env, data) {
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          email: data.email,
          firstname: data.firstName,
          lastname: data.lastName,
          phone: data.phone,
          company: data.businessName || '',
          lifecyclestage: 'lead',
          // Custom properties
          booking_id: data.bookingId,
          service_requested: data.serviceName,
          preferred_date: data.preferredDate,
          notes: data.message || ''
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('HubSpot API error:', error);
      return null;
    }

    const result = await response.json();
    console.log('Contact added to HubSpot:', result.id);
    return { id: result.id, provider: 'hubspot' };

  } catch (error) {
    console.error('HubSpot integration error:', error);
    return null;
  }
}

async function addToSalesforce(env, data) {
  try {
    // Get OAuth token first (you'd cache this in KV in production)
    const authResponse = await fetch(
      `https://login.salesforce.com/services/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: env.SALESFORCE_CLIENT_ID,
          client_secret: env.SALESFORCE_CLIENT_SECRET,
          username: env.SALESFORCE_USERNAME,
          password: env.SALESFORCE_PASSWORD + env.SALESFORCE_SECURITY_TOKEN
        })
      }
    );

    if (!authResponse.ok) {
      throw new Error('Salesforce authentication failed');
    }

    const auth = await authResponse.json();

    // Create lead
    const response = await fetch(
      `${auth.instance_url}/services/data/v58.0/sobjects/Lead`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: data.firstName,
          LastName: data.lastName,
          Email: data.email,
          Phone: data.phone,
          Company: data.businessName || 'Unknown',
          LeadSource: 'Website',
          Description: `Booking ID: ${data.bookingId}\nService: ${data.serviceName}\nPreferred Date: ${data.preferredDate}\n\n${data.message || ''}`
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create Salesforce lead');
    }

    const result = await response.json();
    console.log('Lead added to Salesforce:', result.id);
    return { id: result.id, provider: 'salesforce' };

  } catch (error) {
    console.error('Salesforce integration error:', error);
    return null;
  }
}

async function addToPipedrive(env, data) {
  try {
    // First, create or find person
    const personResponse = await fetch(
      `https://api.pipedrive.com/v1/persons?api_token=${env.PIPEDRIVE_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: [{ value: data.email, primary: true }],
          phone: [{ value: data.phone, primary: true }],
          org_id: data.businessName ? null : undefined // You'd need to handle org creation
        })
      }
    );

    if (!personResponse.ok) {
      throw new Error('Failed to create Pipedrive person');
    }

    const person = await personResponse.json();

    // Create deal
    const dealResponse = await fetch(
      `https://api.pipedrive.com/v1/deals?api_token=${env.PIPEDRIVE_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${data.serviceName} - ${data.firstName} ${data.lastName}`,
          person_id: person.data.id,
          value: data.servicePrice ? parseFloat(data.servicePrice.split('-')[0]) : 0,
          currency: 'USD',
          status: 'open',
          // Custom fields would go here
          // You'd set these up in Pipedrive first
        })
      }
    );

    if (!dealResponse.ok) {
      throw new Error('Failed to create Pipedrive deal');
    }

    const deal = await dealResponse.json();
    console.log('Deal added to Pipedrive:', deal.data.id);
    return { id: deal.data.id, provider: 'pipedrive' };

  } catch (error) {
    console.error('Pipedrive integration error:', error);
    return null;
  }
}
