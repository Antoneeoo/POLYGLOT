/**
 * Google People API (Contacts) Client for POLYGLOT
 * All calls are made client-side using the OAuth bearer access token.
 */

export interface GoogleContact {
  resourceName: string; // e.g. "people/c123456789"
  etag: string;
  name: string;
  givenName: string;
  familyName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  organization?: string;
}

export interface CreateContactInput {
  givenName: string;
  familyName?: string;
  email?: string;
  phone?: string;
}

/**
 * Fetch contacts from Google People API
 */
export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos,organizations&pageSize=100';

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch Google Contacts:', res.status, errorText);
    throw new Error(`Google Contacts API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((person: any): GoogleContact => {
    const nameObj = person.names?.[0] || {};
    const emailObj = person.emailAddresses?.[0] || {};
    const phoneObj = person.phoneNumbers?.[0] || {};
    const photoObj = person.photos?.[0] || {};
    const orgObj = person.organizations?.[0] || {};

    const displayName = nameObj.displayName || `${nameObj.givenName || ''} ${nameObj.familyName || ''}`.trim() || 'Unnamed Contact';

    return {
      resourceName: person.resourceName,
      etag: person.etag,
      name: displayName,
      givenName: nameObj.givenName || displayName.split(' ')[0] || 'Friend',
      familyName: nameObj.familyName,
      email: emailObj.value,
      phone: phoneObj.value,
      photoUrl: photoObj.url,
      organization: orgObj.name
    };
  });
}

/**
 * Create a new contact in Google Contacts
 */
export async function createGoogleContact(accessToken: string, input: CreateContactInput): Promise<GoogleContact> {
  const url = 'https://people.googleapis.com/v1/people:createContact?personFields=names,emailAddresses,phoneNumbers';

  const payload: any = {
    names: [
      {
        givenName: input.givenName,
        familyName: input.familyName || ''
      }
    ]
  };

  if (input.email) {
    payload.emailAddresses = [{ value: input.email, type: 'home' }];
  }

  if (input.phone) {
    payload.phoneNumbers = [{ value: input.phone, type: 'mobile' }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create contact (${res.status}): ${errorText}`);
  }

  const person = await res.json();
  const nameObj = person.names?.[0] || {};
  const emailObj = person.emailAddresses?.[0] || {};
  const phoneObj = person.phoneNumbers?.[0] || {};

  return {
    resourceName: person.resourceName,
    etag: person.etag,
    name: nameObj.displayName || input.givenName,
    givenName: input.givenName,
    familyName: input.familyName,
    email: emailObj.value || input.email,
    phone: phoneObj.value || input.phone
  };
}

/**
 * Delete a contact from Google Contacts
 */
export async function deleteGoogleContact(accessToken: string, resourceName: string): Promise<boolean> {
  const url = `https://people.googleapis.com/v1/${resourceName}:deleteContact`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete contact (${res.status}): ${errorText}`);
  }

  return true;
}
