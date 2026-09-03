export const parseApiError = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  if (err.response && err.response.data) {
    const data = err.response.data;
    // FastAPI 422 validation error returns { detail: [ { type, loc, msg, input, ctx } ] }
    if (Array.isArray(data.detail)) {
      const messages = data.detail.map((d: any) => {
        if (typeof d === 'string') return d;
        if (d && d.msg) {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
          return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg;
        }
        return JSON.stringify(d);
      });
      return messages.join(', ');
    }
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  }
  if (err.message) return err.message;
  return 'Network or server error. Please try again.';
};

export const validateRegistration = (email: string, password: string, fullName: string): string | null => {
  if (!fullName || !fullName.trim()) {
    return 'Full name is required.';
  }
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
};
