const API_BASE_URL = 'http://localhost:3000';

const defaultOptions = {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Add timeout to fetch requests
async function fetchWithTimeout(url, options, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

async function handleResponse(response) {
  let text;
  try {
    text = await response.text();
    console.log('API Response:', response.url, response.status, text.slice(0, 100));
    
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Authentication error:', response.url);
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/login';
        }
        return null;
      }
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (e) {
    console.error('API Error:', {
      url: response.url,
      status: response.status,
      text: text?.slice(0, 100),
      error: e.message
    });
    throw new Error(e.message);
  }
}

export async function fetchUser() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/users`, defaultOptions);
    return handleResponse(response);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

export async function fetchEmails(maxResults = 10) { // Reduced default for better performance
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/gmail?maxResults=${maxResults}`, 
      defaultOptions
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/logout`, defaultOptions);
    return handleResponse(response);
  } catch (error) {
    console.error('Failed to logout:', error);
    throw error;
  }
}

// Category APIs
export async function getCategories() {
  try {
    console.log('Fetching categories...');
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories`, defaultOptions);
    const data = await handleResponse(response);
    console.log('Categories fetched:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}

export async function createCategory({ name, color }) {
  try {
    console.log('Creating category:', { name, color });
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ name, color })
    });
    const data = await handleResponse(response);
    console.log('Category created:', data);
    return data;
  } catch (error) {
    console.error('Failed to create category:', error);
    throw error;
  }
}

export async function updateCategory(id, { name, color }) {
  try {
    console.log('Updating category:', id, { name, color });
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify({ name, color })
    });
    const data = await handleResponse(response);
    console.log('Category updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
}

export async function deleteCategory(id) {
  try {
    console.log('Deleting category:', id);
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      ...defaultOptions,
      method: 'DELETE'
    });
    const data = await handleResponse(response);
    console.log('Category deleted:', id);
    return data;
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
}

export async function addEmailsToCategory(categoryId, emailIds) {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/emails`, {
    ...defaultOptions,
    method: 'POST',
    body: JSON.stringify({ emailIds })
  });
  return handleResponse(response);
}

// Rule APIs
export async function getRules() {
  try {
    console.log('Fetching rules...');
    const response = await fetchWithTimeout(`${API_BASE_URL}/rules`, defaultOptions);
    const data = await handleResponse(response);
    console.log('Rules fetched:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Failed to fetch rules:', error);
    throw error;
  }
}

export async function createRule({ name, conditions, categoryId, isActive }) {
  try {
    // Validate and format conditions
    if (!Array.isArray(conditions)) {
      throw new Error('Conditions must be an array');
    }

    const formattedConditions = conditions.map(condition => {
      if (!condition || typeof condition !== 'object') {
        throw new Error('Invalid condition object');
      }

      if (!condition.type) {
        throw new Error('Condition type is required');
      }

      // For hasAttachment, set specific values
      if (condition.type === 'hasAttachment') {
        return {
          type: 'hasAttachment',
          value: 'true',
          operator: 'equals'
        };
      }

      // For other conditions
      return {
        type: condition.type,
        value: condition.value ? condition.value.trim() : '',
        operator: 'contains'
      };
    });

    // Validate categoryId is not empty and is a valid format
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const ruleData = {
      name: name ? name.trim() : '',
      conditions: formattedConditions,
      categoryId: Number(categoryId), // Ensure categoryId is a number
      isActive: Boolean(isActive) // Ensure isActive is a boolean
    };

    console.log('Creating rule with formatted data:', JSON.stringify(ruleData, null, 2));

    const response = await fetchWithTimeout(`${API_BASE_URL}/rules`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
    const data = await handleResponse(response);
    console.log('Rule created:', data);
    return data;
  } catch (error) {
    console.error('Failed to create rule:', error);
    throw error;
  }
}

export async function updateRule(id, { name, conditions, categoryId, isActive }) {
  try {
    console.log('Updating rule:', id, { name, conditions, categoryId, isActive });
    const response = await fetchWithTimeout(`${API_BASE_URL}/rules/${id}`, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify({ name, conditions, categoryId, isActive })
    });
    const data = await handleResponse(response);
    console.log('Rule updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update rule:', error);
    throw error;
  }
}

export async function deleteRule(id) {
  try {
    console.log('Deleting rule:', id);
    const response = await fetchWithTimeout(`${API_BASE_URL}/rules/${id}`, {
      ...defaultOptions,
      method: 'DELETE'
    });
    const data = await handleResponse(response);
    console.log('Rule deleted:', id);
    return data;
  } catch (error) {
    console.error('Failed to delete rule:', error);
    throw error;
  }
}
